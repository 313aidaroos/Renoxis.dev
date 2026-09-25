import { isUuid } from "@/lib/renoxis/brokerage";
import {
  DRAFT_DISCLAIMER,
  isDraftKind,
  wrapDraftFile,
  type DraftKind,
} from "@/lib/renoxis/draft-file";
import { requireServerEntitlement } from "@/lib/renoxis/entitlements";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";
import { chargeFromWallet } from "@/lib/renoxis/wallet-charge";
import { randomUUID } from "node:crypto";

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    await requireServerEntitlement(user);
    const input = await body(request);
    if (!isDraftKind(input.kind))
      throw new Error("Choose a draft kind: generic, email_draft, or offer_letter.");
    const kind: DraftKind = input.kind;
    const title =
      typeof input.title === "string" && input.title.trim()
        ? input.title.trim()
        : "Cixy draft";
    const draftBody =
      typeof input.body === "string"
        ? input.body
        : typeof input.content === "string"
          ? input.content
          : "";
    const save = input.save === true;
    const wrapped = wrapDraftFile(kind, title, draftBody);
    const filename = wrapped.filename + ".txt";
    let cost = 0;
    const balance: number | null = null;
    let outboxId: string | null = null;
    let path: string | null = null;

    if (kind === "email_draft" || kind === "offer_letter") {
      if (!isUuid(input.brokerageId))
        throw new Error("Choose an office to bill email or offer drafts.");
      const loaded = await officesOf(db);
      if (notReady(loaded.error))
        return json({ error: "Team storage is not ready yet." }, 503);
      const office = loaded.offices.find((row) => row.id === input.brokerageId);
      if (!office)
        return json(
          { error: "You are not an active member of this office." },
          403,
        );
      const ref =
        typeof input.ref === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(input.ref)
          ? input.ref
          : randomUUID().replaceAll("-", "");
      const { data: existing } = await db
        .from("renoxis_outbox")
        .select("id")
        .eq("brokerage_id", office.id)
        .eq("ref", ref)
        .maybeSingle();
      if (!existing) {
        // Paid from the person's one Apixis Wallet balance (no office ledger).
        const subject = wrapped.title.slice(0, 200);
        const charge = await chargeFromWallet(
          user,
          kind,
          ref,
          async () => {
            const { data, error } = await db
              .from("renoxis_outbox")
              .insert({
                brokerage_id: office.id,
                author_id: user.id,
                kind: kind === "email_draft" ? "email" : "offer",
                to_email: null,
                subject,
                body: wrapped.text,
                status: "draft",
                approved: false,
                provider: "not_configured",
                ref,
              })
              .select("id")
              .single();
            if (error) throw new Error("The draft did not save. Nothing was charged. Try again.");
            return data;
          },
          async (row) => {
            await db.from("renoxis_outbox").delete().eq("id", row.id);
          },
        );
        if (!charge.ok) return json({ ...charge.body, sent: false, disclaimer: DRAFT_DISCLAIMER }, charge.status);
        cost = charge.cost;
        const outbox = charge.result;
        outboxId = outbox.id;
      } else {
        outboxId = existing.id;
      }
    }

    if (save) {
      const storagePath =
        user.id + "/" + randomUUID() + "_" + filename;
      const file = new Blob([wrapped.text], { type: "text/plain" });
      const { error } = await db.storage
        .from("renoxis-documents")
        .upload(storagePath, file, {
          contentType: "text/plain",
          upsert: false,
        });
      if (error)
        return json({ error: "Could not save the draft to Documents." }, 503);
      path = storagePath;
    }

    return json({
      title: wrapped.title,
      filename,
      text: wrapped.text,
      path,
      outboxId,
      cost,
      balance,
      sent: false,
      disclaimer: DRAFT_DISCLAIMER,
      message: save
        ? "Draft saved to Documents. Nothing was sent."
        : "Draft ready to download. Nothing was sent.",
    });
  } catch (e) {
    return failure(e);
  }
}
