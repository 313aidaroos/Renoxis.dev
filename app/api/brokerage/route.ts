import { officesOf, notReady } from "@/lib/renoxis/firm-store";
import { isUuid, officeName, slugify } from "@/lib/renoxis/brokerage";
import { canRollup } from "@/lib/renoxis/access";
import { body, failure, json, session } from "@/lib/renoxis/http";

const memberColumns = "id,email,role,status,user_id";
const inviteColumns = "id,email,role,expires_at,accepted_at";
const noteColumns = "id,record_id,author_id,body,shared,created_at";
const outboxColumns =
  "id,kind,to_email,subject,body,status,approved,provider,author_id,created_at";
const commissionColumns = "id,record_id,fee_base,bps,amount,status,created_at";

async function firmPayload(
  db: Awaited<ReturnType<typeof session>>["db"],
  userId: string,
  brokerageId?: string | null,
) {
  const loaded = await officesOf(db);
  if (loaded.error) {
    if (notReady(loaded.error))
      return {
        ready: false,
        userId,
        offices: [],
        members: [],
        invites: [],
        notes: [],
        outbox: [],
        commissions: [],
      };
    throw new Error("Team storage is unavailable. Please retry.");
  }
  const office =
    loaded.offices.find((row) => row.id === brokerageId) ||
    loaded.offices[0] ||
    null;
  if (!office)
    return {
      ready: true,
      userId,
      offices: loaded.offices,
      office: null,
      members: [],
      invites: [],
      notes: [],
      outbox: [],
      commissions: [],
    };
  const [members, invites, notes, outbox, commissions] = await Promise.all([
    db
      .from("brokerage_members")
      .select(memberColumns)
      .eq("brokerage_id", office.id)
      .order("joined_at", { ascending: true }),
    canRollup(office.role)
      ? db
          .from("brokerage_invites")
          .select(inviteColumns)
          .eq("brokerage_id", office.id)
          .is("accepted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    db
      .from("renoxis_notes")
      .select(noteColumns)
      .eq("brokerage_id", office.id)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("renoxis_outbox")
      .select(outboxColumns)
      .eq("brokerage_id", office.id)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("platform_commission")
      .select(commissionColumns)
      .eq("brokerage_id", office.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const failed = [members, invites, notes, outbox, commissions].find(
    (result) => result.error,
  );
  if (failed?.error) {
    if (notReady(failed.error))
      return {
        ready: false,
        userId,
        offices: loaded.offices,
        office,
        members: [],
        invites: [],
        notes: [],
        outbox: [],
        commissions: [],
      };
    throw new Error("Team storage is unavailable. Please retry.");
  }
  return {
    ready: true,
    userId,
    offices: loaded.offices,
    office,
    members: members.data || [],
    invites: invites.data || [],
    notes: notes.data || [],
    outbox: outbox.data || [],
    commissions: commissions.data || [],
  };
}

function respond(error: unknown) {
  if (error instanceof Error && error.message.includes("unavailable"))
    return json({ error: error.message }, 503);
  return failure(error);
}

export async function GET(request: Request) {
  try {
    const { db, user } = await session(request);
    const brokerageId = new URL(request.url).searchParams.get("brokerageId");
    return json(await firmPayload(db, user.id, brokerageId));
  } catch (e) {
    return respond(e);
  }
}

export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    const name = officeName(input.name);
    const base = slugify(name);
    let created = null;
    let errorMessage = "Could not create the office. Please retry.";
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`.slice(0, 60);
      const result = await db
        .from("brokerages")
        .insert({
          name,
          slug,
          created_by: user.id,
          status: "active",
          settings: {},
        })
        .select("id")
        .single();
      if (!result.error && result.data) {
        created = result.data;
        break;
      }
      if (notReady(result.error))
        return json(
          {
            error:
              "Team storage is not ready yet. Apply supabase/brokerage.sql before creating an office.",
          },
          503,
        );
      if (result.error?.code !== "23505") errorMessage = "Could not create the office. Please retry.";
    }
    if (!created) return json({ error: errorMessage }, 409);
    return json(await firmPayload(db, user.id, created.id), 201);
  } catch (e) {
    return respond(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const { db, user } = await session(request);
    const input = await body(request);
    if (!isUuid(input.brokerageId)) throw new Error("Choose an office.");
    const name = officeName(input.name);
    const { data, error } = await db
      .from("brokerages")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", input.brokerageId)
      .select("id")
      .maybeSingle();
    if (notReady(error))
      return json({ error: "Team storage is not ready yet." }, 503);
    if (error) return json({ error: "Could not rename the office." }, 503);
    if (!data)
      return json({ error: "Only an owner can rename this office." }, 403);
    return json(await firmPayload(db, user.id, input.brokerageId));
  } catch (e) {
    return respond(e);
  }
}
