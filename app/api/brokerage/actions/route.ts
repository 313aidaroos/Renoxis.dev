import { recordVisibility } from "@/lib/renoxis/access";
import { isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";
import { insufficientMessage, isSku, type IxisSku } from "@/lib/renoxis/ixis";
import { validateRecord } from "@/lib/renoxis/records";
import { randomUUID } from "node:crypto";

const recordColumns =
  "id,kind,data,version,created_at,updated_at,brokerage_id,owner_agent_id,visibility";

function reference(value: unknown) {
  if (typeof value !== "string") return randomUUID();
  const ref = value.trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(ref))
    throw new Error("Invalid action reference.");
  return ref;
}

function draftInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Write the draft before saving it.");
  const input = value as Record<string, unknown>;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const text = typeof input.body === "string" ? input.body.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (subject.length < 1 || subject.length > 200)
    throw new Error("A subject of 1–200 characters is required.");
  if (text.length < 1 || text.length > 10000)
    throw new Error("Write the draft before saving it.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email.");
  return { subject, body: text, email };
}

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId) || !isSku(input.sku))
      throw new Error("Choose an office action.");
    const sku: IxisSku = input.sku;
    const ref = reference(input.ref);
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const office = loaded.offices.find((row) => row.id === input.brokerageId);
    if (!office)
      return json({ error: "You are not an active member of this office." }, 403);
    const visibility = recordVisibility(office.role, input.visibility);

    if (sku === "email_draft" || sku === "offer_letter") {
      const draft = draftInput(input.draft);
      const { data: existing } = await db
        .from("renoxis_outbox")
        .select("id,kind,subject,status,approved,provider")
        .eq("brokerage_id", office.id)
        .eq("ref", ref)
        .maybeSingle();
      if (existing)
        return json({
          outbox: existing,
          idempotent: true,
          billedToOffice: true,
          sent: false,
        });
      const debit = await db.rpc("renoxis_debit_ixis", {
        bid: office.id,
        sku,
        ref,
      });
      if (notReady(debit.error))
        return json({ error: "The office ledger is not ready yet." }, 503);
      if (debit.error) return json({ error: "Could not debit the office." }, 503);
      if (!debit.data?.ok) {
        const cost = Number(debit.data?.cost || 0);
        const balance =
          typeof debit.data?.balance === "number" ? debit.data.balance : null;
        return json(
          {
            error:
              debit.data?.error === "INSUFFICIENT"
                ? insufficientMessage(cost, balance)
                : debit.data?.error || "Could not debit the office.",
            cost,
            balance,
            billedToOffice: true,
          },
          debit.data?.error === "INSUFFICIENT" ? 402 : 400,
        );
      }
      const { data, error } = await db
        .from("renoxis_outbox")
        .insert({
          brokerage_id: office.id,
          author_id: user.id,
          kind: sku === "email_draft" ? "email" : "offer",
          to_email: draft.email || null,
          subject: draft.subject,
          body: draft.body,
          status: "draft",
          approved: false,
          provider: "not_configured",
          ref,
        })
        .select("id,kind,subject,status,approved,provider")
        .single();
      if (error)
        return json(
          {
            error:
              "The office was debited but the draft did not save. Retry with the same reference.",
            ref,
            billedToOffice: true,
          },
          503,
        );
      if (sku === "email_draft") {
        const record = validateRecord("draft", {
          title: draft.subject,
          ...(draft.email ? { email: draft.email } : {}),
          notes: draft.body,
        });
        await db.from("renoxis_records").insert({
          ...record,
          user_id: user.id,
          brokerage_id: office.id,
          owner_agent_id: user.id,
          visibility,
          external_ref: ref,
        });
      }
      return json(
        {
          outbox: data,
          billedToOffice: true,
          sent: false,
          balance: office.role === "owner" || office.role === "broker" ? debit.data.balance : null,
          message: "Draft saved. Nothing was sent.",
        },
        201,
      );
    }

    const kind = sku === "property_lookup" ? "property" : "lead";
    const record = validateRecord(kind, input.data);
    const { data: existing } = await db
      .from("renoxis_records")
      .select(recordColumns)
      .eq("brokerage_id", office.id)
      .eq("external_ref", ref)
      .maybeSingle();
    if (existing)
      return json({ record: existing, idempotent: true, billedToOffice: true });
    const debit = await db.rpc("renoxis_debit_ixis", {
      bid: office.id,
      sku,
      ref,
    });
    if (notReady(debit.error))
      return json({ error: "The office ledger is not ready yet." }, 503);
    if (debit.error) return json({ error: "Could not debit the office." }, 503);
    if (!debit.data?.ok) {
      const cost = Number(debit.data?.cost || 0);
      const balance =
        typeof debit.data?.balance === "number" ? debit.data.balance : null;
      return json(
        {
          error:
            debit.data?.error === "INSUFFICIENT"
              ? insufficientMessage(cost, balance)
              : debit.data?.error || "Could not debit the office.",
          cost,
          balance,
          billedToOffice: true,
        },
        debit.data?.error === "INSUFFICIENT" ? 402 : 400,
      );
    }
    const { data, error } = await db
      .from("renoxis_records")
      .insert({
        ...record,
        user_id: user.id,
        brokerage_id: office.id,
        owner_agent_id: user.id,
        visibility,
        external_ref: ref,
      })
      .select(recordColumns)
      .single();
    if (error)
      return json(
        {
          error:
            "The office was debited but the record did not save. Retry with the same reference.",
          ref,
          billedToOffice: true,
        },
        503,
      );
    return json(
      {
        record: data,
        billedToOffice: true,
        balance: office.role === "owner" || office.role === "broker" ? debit.data.balance : null,
        message:
          sku === "property_lookup"
            ? "Saved the property facts you entered. No listing feed or comps were queried."
            : "Contact saved to your book. Billed to office. No charge.",
      },
      201,
    );
  } catch (e) {
    return failure(e);
  }
}
