import { isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";

export async function POST(request: Request) {
  try {
    const { db } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId)) throw new Error("Choose an office.");
    if (!Number.isInteger(input.amount))
      throw new Error("Enter a whole Ixis amount.");
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const office = loaded.offices.find((row) => row.id === input.brokerageId);
    if (!office || office.role !== "owner")
      return json({ error: "Only an owner can record an office grant." }, 403);
    const { data, error } = await db.rpc("renoxis_grant_ixis", {
      bid: office.id,
      amount: input.amount,
      note: "manual office grant",
    });
    if (notReady(error))
      return json({ error: "Team storage is not ready yet." }, 503);
    if (error) return json({ error: "Could not record the grant." }, 503);
    if (!data?.ok)
      return json({ error: data?.error || "Could not record the grant." }, 400);
    return json({
      ok: true,
      balance: data.balance,
      amount: data.amount,
      message:
        "Manual office grant recorded. This is not a wallet purchase or a Stripe charge.",
    });
  } catch (e) {
    return failure(e);
  }
}
