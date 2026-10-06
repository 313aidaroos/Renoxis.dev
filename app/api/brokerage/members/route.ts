import { isRole } from "@/lib/renoxis/access";
import { addOrInviteMember, guardOffice, officesFor } from "@/lib/renoxis/brokerage-admin";
import { inviteEmail, isUuid } from "@/lib/renoxis/brokerage";
import { notReady } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";
import { createHash, randomBytes } from "node:crypto";

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId) || !isRole(input.role))
      throw new Error("Choose an office and a role.");
    const email = inviteEmail(input.email);
    const loaded = await officesFor(db, user);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const gate = guardOffice({
      offices: loaded.offices,
      masterAdmin: loaded.masterAdmin,
      brokerageId: input.brokerageId,
      action: "invite",
      invitee: input.role,
    });
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    let added = false;
    try {
      const result = await addOrInviteMember({
        brokerageId: input.brokerageId,
        email,
        role: input.role,
        invitedBy: user.id,
      });
      if (result.already)
        return json({ error: "That person is already in this brokerage." }, 409);
      added = result.added;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("not set")) throw error;
    }
    if (added)
      return json(
        {
          added: true,
          emailed: false,
          message: "Added to the brokerage. Their Cixy jobs are paid by the office.",
        },
        201,
      );
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { error } = await loaded.reader.from("brokerage_invites").insert({
      brokerage_id: input.brokerageId,
      email,
      role: input.role,
      token_hash: tokenHash,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (notReady(error))
      return json({ error: "Team storage is not ready yet." }, 503);
    if (error) return json({ error: "Could not create the invite." }, 503);
    return json(
      {
        added: false,
        emailed: false,
        token,
        path: "/dashboard?board=Brokerage&invite=" + token,
        message:
          "They don't have an account yet. Share this link. Mail was not sent. It expires in 14 days.",
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId) || !isUuid(input.memberId))
      throw new Error("Choose an office member.");
    if (input.status !== "removed" && input.status !== "active")
      throw new Error("Invalid member status.");
    const loaded = await officesFor(db, user);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const { data: member, error: lookupError } = await loaded.reader
      .from("brokerage_members")
      .select("id,email,role,status,user_id")
      .eq("id", input.memberId)
      .eq("brokerage_id", input.brokerageId)
      .maybeSingle();
    if (lookupError) return json({ error: "Could not update the member." }, 503);
    if (!member) return json({ error: "Member not found." }, 404);
    if (!isRole(member.role)) return json({ error: "Member not found." }, 404);
    const gate = guardOffice({
      offices: loaded.offices,
      masterAdmin: loaded.masterAdmin,
      brokerageId: input.brokerageId,
      action: "remove",
      targetRole: member.role,
      targetIsSelf: member.user_id === user.id,
    });
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    const { data, error } = await loaded.reader
      .from("brokerage_members")
      .update({ status: input.status })
      .eq("id", input.memberId)
      .eq("brokerage_id", input.brokerageId)
      .select("id,email,role,status")
      .maybeSingle();
    if (error?.message?.includes("one active owner"))
      return json({ error: "The brokerage needs one active owner." }, 409);
    if (error) return json({ error: "Could not update the member." }, 503);
    if (!data) return json({ error: "Member not found." }, 404);
    return json({ member: data });
  } catch (e) {
    return failure(e);
  }
}
