import { listView, recordVisibility } from "@/lib/renoxis/access";
import { isUuid } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import { session, json, body, failure } from "@/lib/renoxis/http";
import { validateRecord } from "@/lib/renoxis/records";

const columns = "id,kind,data,version,created_at,updated_at";
const teamColumns =
  columns + ",brokerage_id,owner_agent_id,visibility";

async function commission(
  db: Awaited<ReturnType<typeof session>>["db"],
  id: string,
  kind: string,
  status: unknown,
) {
  if (kind !== "transaction" || status !== "Closed") return null;
  const { data, error } = await db.rpc("renoxis_record_platform_commission", {
    record_id: id,
  });
  if (notReady(error) || error) return null;
  return data?.ok ? data : null;
}

export async function GET(request: Request) {
  try {
    const { db, user } = await session();
    const brokerageId = new URL(request.url).searchParams.get("brokerageId");
    const view = new URL(request.url).searchParams.get("view");
    if (!brokerageId) {
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
    }
    if (!isUuid(brokerageId)) throw new Error("Choose an office.");
    const loaded = await officesOf(db);
    if (notReady(loaded.error))
      return json(
        {
          error:
            "Team storage is not ready yet. Apply supabase/brokerage.sql.",
        },
        503,
      );
    const office = loaded.offices.find((row) => row.id === brokerageId);
    if (!office)
      return json({ error: "You are not an active member of this office." }, 403);
    let query = db
      .from("renoxis_records")
      .select(teamColumns)
      .eq("brokerage_id", brokerageId)
      .order("created_at", { ascending: false })
      .limit(1001);
    if (listView(office.role, view) === "book")
      query = query.or(`owner_agent_id.eq.${user.id},visibility.eq.firm`);
    const [{ data, error }, personal] = await Promise.all([
      query,
      db
        .from("renoxis_records")
        .select(teamColumns)
        .eq("user_id", user.id)
        .is("brokerage_id", null)
        .order("created_at", { ascending: false })
        .limit(1001),
    ]);
    if (error || personal.error)
      return json(
        { error: "Workspace storage is unavailable. Please retry." },
        503,
      );
    const merged = (
      [...(data || []), ...(personal.data || [])] as { created_at?: string }[]
    )
      .filter((row) => typeof row?.created_at === "string")
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return json({
      records: merged.slice(0, 1000),
      truncated: merged.length > 1000,
      view: listView(office.role, view),
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
    let row: Record<string, unknown> = { ...record, user_id: user.id };
    if (input.brokerageId) {
      if (!isUuid(input.brokerageId)) throw new Error("Choose an office.");
      const loaded = await officesOf(db);
      if (notReady(loaded.error))
        return json({ error: "Team storage is not ready yet." }, 503);
      const office = loaded.offices.find((item) => item.id === input.brokerageId);
      if (!office)
        return json({ error: "You are not an active member of this office." }, 403);
      row = {
        ...row,
        brokerage_id: office.id,
        owner_agent_id: user.id,
        visibility: recordVisibility(office.role, input.visibility),
      };
    }
    const { data, error } = await db
      .from("renoxis_records")
      .insert(row)
      .select(input.brokerageId ? teamColumns : columns)
      .single();
    if (error || !data || !("id" in data) || typeof data.id !== "string")
      return json(
        {
          error:
            error?.code === "23505"
              ? "Preferences already exist. Refresh and edit them."
              : "Could not save the record. Please retry.",
        },
        error?.code === "23505" ? 409 : 503,
      );
    const platformCommission = await commission(
      db,
      data.id,
      record.kind,
      record.data.status,
    );
    return json({ record: data, platformCommission }, 201);
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
    const platformCommission = await commission(
      db,
      data.id,
      record.kind,
      record.data.status,
    );
    return json({ record: data, platformCommission });
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
