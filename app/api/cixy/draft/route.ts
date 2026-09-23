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
import { insufficientMessage } from "@/lib/renoxis/ixis";
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
    let balance: number | null = null;
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
        const debit = await db.rpc("renoxis_debit_ixis", {
          bid: office.id,
          sku: kind,
          ref,
        });
        if (notReady(debit.error))
          return json({ error: "The office ledger is not ready yet." }, 503);
        if (debit.error)
          return json({ error: "Could not debit the office." }, 503);
        if (!debit.data?.ok) {
          const debitCost = Number(debit.data?.cost || 0);
          const debitBalance =
            typeof debit.data?.balance === "number" ? debit.data.balance : null;
          return json(
            {
              error:
                debit.data?.error === "INSUFFICIENT"
                  ? insufficientMessage(debitCost, debitBalance)
                  : debit.data?.error || "Could not debit the office.",
              cost: debitCost,
              balance: debitBalance,
              sent: false,
              disclaimer: DRAFT_DISCLAIMER,
            },
            debit.data?.error === "INSUFFICIENT" ? 402 : 400,
          );
        }
        cost = Number(debit.data.cost || (kind === "email_draft" ? 50 : 100));
        balance =
          office.role === "owner" || office.role === "broker"
            ? typeof debit.data.balance === "number"
              ? debit.data.balance
              : null
            : null;
        const subject = wrapped.title.slice(0, 200);
        const { data: outbox, error } = await db
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
        if (error)
          return json(
            {
              error:
                "The office was debited but the draft did not save. Retry with the same reference.",
              ref,
              sent: false,
            },
            503,
          );
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
