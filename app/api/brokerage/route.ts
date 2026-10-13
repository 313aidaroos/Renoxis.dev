import { notReady } from "@/lib/renoxis/firm-store";
import { isUuid, officeName, slugify } from "@/lib/renoxis/brokerage";
import { canRollup } from "@/lib/renoxis/access";
import { guardOffice, officesFor } from "@/lib/renoxis/brokerage-admin";
import { body, failure, json, session } from "@/lib/renoxis/http";
import { brokerageVisible, canManageOffice, jobLabel } from "@/lib/renoxis/office-access";
import { officeBuyUrl, officeWalletBalance, resolveOfficeWalletOwner } from "@/lib/renoxis/office-billing";

const memberColumns = "id,email,role,status,user_id";
const inviteColumns = "id,email,role,expires_at,accepted_at";
const noteColumns = "id,record_id,author_id,body,shared,created_at";
const outboxColumns =
  "id,kind,to_email,subject,body,status,approved,provider,author_id,created_at";
const commissionColumns = "id,record_id,fee_base,bps,amount,status,created_at";

async function firmPayload(
  db: Awaited<ReturnType<typeof session>>["db"],
  user: Awaited<ReturnType<typeof session>>["user"],
  brokerageId?: string | null,
) {
  const userId = user.id;
  const loaded = await officesFor(db, user);
  if (brokerageId && isUuid(brokerageId) && !brokerageVisible({
    requestedId: brokerageId,
    memberIds: loaded.offices.map((office) => office.id),
    masterAdmin: loaded.masterAdmin,
  })) {
    return { denied: true as const };
  }
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
  const reader = loaded.reader;
  const [members, invites, notes, outbox, commissions] = await Promise.all([
    reader
      .from("brokerage_members")
      .select(memberColumns)
      .eq("brokerage_id", office.id)
      .order("joined_at", { ascending: true }),
    canRollup(office.role)
      ? reader
          .from("brokerage_invites")
          .select(inviteColumns)
          .eq("brokerage_id", office.id)
          .is("accepted_at", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    reader
      .from("renoxis_notes")
      .select(noteColumns)
      .eq("brokerage_id", office.id)
      .order("created_at", { ascending: false })
      .limit(100),
    reader
      .from("renoxis_outbox")
      .select(outboxColumns)
      .eq("brokerage_id", office.id)
      .order("created_at", { ascending: false })
      .limit(100),
    reader
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
  const memberRows = members.data || [];
  const access = {
    masterAdmin: loaded.masterAdmin,
    canRename: canManageOffice({
      role: office.role,
      masterAdmin: loaded.masterAdmin,
      action: "rename",
    }),
    canInvite: canManageOffice({
      role: office.role,
      masterAdmin: loaded.masterAdmin,
      action: "invite",
    }),
    canRemove: canManageOffice({
      role: office.role,
      masterAdmin: loaded.masterAdmin,
      action: "remove",
      targetRole: "agent",
    }),
    canViewSpend: canManageOffice({
      role: office.role,
      masterAdmin: loaded.masterAdmin,
      action: "spend",
    }),
  };
  const spendByUser: Record<string, { spent: number; jobs: number }> = {};
  let activity: {
    id: string;
    sku: string;
    label: string;
    amount: number;
    email: string;
    at: string;
  }[] = [];
  let wallet: { available: number | null; buy: string } | null = null;
  if (access.canViewSpend) {
    const ledger = await reader
      .from("brokerage_ixis_ledger")
      .select("id,sku,amount_ixis,actor_user_id,created_at")
      .eq("brokerage_id", office.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!ledger.error) {
      const emailOf = new Map(
        memberRows.map((member) => [member.user_id, member.email]),
      );
      activity = (ledger.data || []).map((row) => ({
        id: String(row.id),
        sku: String(row.sku),
        label: jobLabel(String(row.sku)),
        amount: Math.abs(Number(row.amount_ixis) || 0),
        email: emailOf.get(row.actor_user_id) || "Someone in the office",
        at: String(row.created_at),
      }));
      for (const row of ledger.data || []) {
        const key = String(row.actor_user_id || "");
        const bucket = spendByUser[key] || { spent: 0, jobs: 0 };
        const amount = Math.abs(Number(row.amount_ixis) || 0);
        if (amount > 0) {
          bucket.spent += amount;
          bucket.jobs += 1;
        }
        spendByUser[key] = bucket;
      }
    }
    try {
      const payer = await resolveOfficeWalletOwner(office.id);
      wallet = {
        available: payer ? await officeWalletBalance(payer) : null,
        buy: officeBuyUrl(),
      };
    } catch {
      wallet = { available: null, buy: officeBuyUrl() };
    }
  }
  return {
    ready: true,
    userId,
    offices: loaded.offices,
    office,
    members: memberRows,
    invites: invites.data || [],
    notes: notes.data || [],
    outbox: outbox.data || [],
    commissions: commissions.data || [],
    access,
    activity,
    spendByUser,
    wallet,
    billedToOffice: true,
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
    const payload = await firmPayload(db, user, brokerageId);
    if ("denied" in payload) return json({ error: "You cannot open that brokerage." }, 403);
    return json(payload);
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
    const payload = await firmPayload(db, user, created.id);
    if ("denied" in payload) return json({ error: "You cannot open that brokerage." }, 403);
    return json(payload, 201);
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
    const loaded = await officesFor(db, user);
    if (notReady(loaded.error))
      return json({ error: "Team storage is not ready yet." }, 503);
    const gate = guardOffice({
      offices: loaded.offices,
      masterAdmin: loaded.masterAdmin,
      brokerageId: input.brokerageId,
      action: "rename",
    });
    if (!gate.ok) return json({ error: gate.error }, gate.status);
    const { data, error } = await loaded.reader
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
    const payload = await firmPayload(db, user, input.brokerageId);
    if ("denied" in payload) return json({ error: "You cannot open that brokerage." }, 403);
    return json(payload);
  } catch (e) {
    return respond(e);
  }
}
