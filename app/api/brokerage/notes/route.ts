import { isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId)) throw new Error("Choose an office.");
    if (typeof input.body !== "string") throw new Error("Write a note.");
    const text = input.body.trim();
    if (text.length < 1 || text.length > 10000)
      throw new Error("Notes must be 1–10,000 characters.");
    if (input.recordId !== undefined && input.recordId !== null && !isUuid(input.recordId))
      throw new Error("Invalid record.");
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const office = loaded.offices.find((row) => row.id === input.brokerageId);
    if (!office)
      return json({ error: "You are not an active member of this office." }, 403);
    const { data, error } = await db
      .from("renoxis_notes")
      .insert({
        brokerage_id: office.id,
        record_id: isUuid(input.recordId) ? input.recordId : null,
        author_id: user.id,
        body: text,
        shared: input.shared === true,
      })
      .select("id,record_id,author_id,body,shared,created_at")
      .single();
    if (error) return json({ error: "Could not save the note." }, 503);
    return json({ note: data }, 201);
  } catch (e) {
    return failure(e);
  }
}
