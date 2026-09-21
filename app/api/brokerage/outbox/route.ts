import { canApprove } from "@/lib/renoxis/access";
import { isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";
import { decideSend } from "@/lib/renoxis/outbox";

const columns =
  "id,kind,to_email,subject,body,status,approved,provider,author_id,created_at";

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId) || !isUuid(input.id))
      throw new Error("Choose a draft.");
    if (input.action !== "approve" && input.action !== "send")
      throw new Error("Choose Approve or a send check.");
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const office = loaded.offices.find((row) => row.id === input.brokerageId);
    if (!office)
      return json({ error: "You are not an active member of this office." }, 403);
    const { data: draft, error } = await db
      .from("renoxis_outbox")
      .select(columns)
      .eq("id", input.id)
      .eq("brokerage_id", office.id)
      .maybeSingle();
    if (error) return json({ error: "Could not load the draft." }, 503);
    if (!draft) return json({ error: "Draft not found." }, 404);

    if (input.action === "approve") {
      if (!canApprove(office.role))
        return json({ error: "Only an owner or broker can approve a send." }, 403);
      const { data, error: updateError } = await db
        .from("renoxis_outbox")
        .update({
          approved: true,
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id)
        .eq("brokerage_id", office.id)
        .select(columns)
        .maybeSingle();
      if (updateError) return json({ error: "Could not approve the draft." }, 503);
      return json({
        outbox: data,
        sent: false,
        message: "Approved. Nothing was sent. Live mail is not connected.",
      });
    }

    const decision = decideSend({ approved: Boolean(draft.approved) });
    if (!draft.approved) {
      await db
        .from("renoxis_outbox")
        .update({
          status: "pending_approve",
          provider: "blocked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id)
        .eq("approved", false);
    } else {
      await db
        .from("renoxis_outbox")
        .update({
          provider: decision.provider,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id);
    }
    return json({ ...decision, outboxId: draft.id });
  } catch (e) {
    return failure(e);
  }
}
