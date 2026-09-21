import { isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { body, failure, json, session } from "@/lib/renoxis/http";

export async function PATCH(request: Request) {
  try {
    const { db } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId) || !isUuid(input.memberId))
      throw new Error("Choose an office member.");
    if (input.status !== "removed" && input.status !== "active")
      throw new Error("Invalid member status.");
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const office = loaded.offices.find((row) => row.id === input.brokerageId);
    if (!office || office.role !== "owner")
      return json({ error: "Only an owner can change membership." }, 403);
    const { data, error } = await db
      .from("brokerage_members")
      .update({ status: input.status })
      .eq("id", input.memberId)
      .eq("brokerage_id", office.id)
      .select("id,email,role,status")
      .maybeSingle();
    if (error?.message?.includes("one active owner"))
      return json({ error: "The office needs one active owner." }, 409);
    if (error) return json({ error: "Could not update the member." }, 503);
    if (!data) return json({ error: "Member not found." }, 404);
    return json({ member: data });
  } catch (e) {
    return failure(e);
  }
}
