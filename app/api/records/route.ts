import { session, json, body, failure } from "@/lib/renoxis/http";
import { validateRecord } from "@/lib/renoxis/records";
const columns = "id,kind,data,version,created_at,updated_at";
export async function GET() {
  try {
    const { db, user } = await session();
    const { data, error } = await db
      .from("renoxis_records")
      .select(columns)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1001);
    if (error)
      return json(
        { error: "Workspace storage is unavailable. Please retry." },
        503,
      );
    return json({
      records: (data || []).slice(0, 1000),
      truncated: (data?.length || 0) > 1000,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    const record = validateRecord(input.kind, input.data);
    const { data, error } = await db
      .from("renoxis_records")
      .insert({ ...record, user_id: user.id })
      .select(columns)
      .single();
    if (error)
      return json(
        {
          error:
            error.code === "23505"
              ? "Preferences already exist. Refresh and edit them."
              : "Could not save the record. Please retry.",
        },
        409,
      );
    return json({ record: data }, 201);
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    const record = validateRecord(input.kind, input.data);
    if (
      typeof input.id !== "string" ||
      !Number.isInteger(input.version) ||
      input.version < 1
    )
      throw new Error("Invalid record version.");
    const { data, error } = await db
      .from("renoxis_records")
      .update({
        data: record.data,
        version: input.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .eq("kind", record.kind)
      .eq("version", input.version)
      .select(columns)
      .maybeSingle();
    if (error) return json({ error: "Could not update record." }, 503);
    if (!data)
      return json(
        {
          error: "This record changed or was deleted. Refresh before editing.",
        },
        409,
      );
    return json({ record: data });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (typeof input.id !== "string" || !Number.isInteger(input.version))
      throw new Error("Invalid record.");
    const { data, error } = await db
      .from("renoxis_records")
      .delete()
      .eq("user_id", user.id)
      .eq("id", input.id)
      .eq("version", input.version)
      .select("id");
    if (error) return json({ error: "Could not delete record." }, 503);
    if (!data?.length)
      return json({ error: "Record changed. Refresh before deleting." }, 409);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
