import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRole, type Role } from "@/lib/renoxis/access";
import { asOffice, type Office } from "@/lib/renoxis/brokerage";
import { notReady, officesOf } from "@/lib/renoxis/firm-store";
import {
  brokerageVisible,
  canManageOffice,
  isMasterAdmin,
  type OfficeAction,
} from "@/lib/renoxis/office-access";

export async function officesFor(db: SupabaseClient, user: User) {
  const loaded = await officesOf(db);
  const masterAdmin = isMasterAdmin(user);
  if (!masterAdmin || loaded.error) {
    return { ...loaded, masterAdmin, reader: db };
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("brokerages")
      .select("id,name,slug,status")
      .order("created_at", { ascending: true });
    if (error) {
      if (notReady(error)) return { ...loaded, masterAdmin, reader: db };
      return { error, offices: [] as Office[], masterAdmin, reader: db };
    }
    const mine = new Map(loaded.offices.map((office) => [office.id, office]));
    const offices = (data || [])
      .map((row) => {
        const own = mine.get(row.id);
        if (own) return own;
        return asOffice({
          id: row.id,
          name: row.name,
          slug: row.slug,
          status: row.status,
          role: "owner",
          balance: null,
          billedToOffice: true,
        });
      })
      .filter((row): row is Office => row !== null);
    return { error: null, offices, masterAdmin, reader: admin };
  } catch {
    return { ...loaded, masterAdmin, reader: db };
  }
}

export function guardOffice(input: {
  offices: Office[];
  masterAdmin: boolean;
  brokerageId: string;
  action: OfficeAction;
  invitee?: Role;
  targetRole?: Role;
  targetIsSelf?: boolean;
}) {
  if (
    !brokerageVisible({
      requestedId: input.brokerageId,
      memberIds: input.offices.map((office) => office.id),
      masterAdmin: input.masterAdmin,
    })
  ) {
    return { ok: false as const, status: 403, error: "You cannot open that brokerage." };
  }
  const office = input.offices.find((row) => row.id === input.brokerageId) || null;
  const role = office?.role ?? (input.masterAdmin ? "owner" : null);
  if (
    !canManageOffice({
      role,
      masterAdmin: input.masterAdmin,
      action: input.action,
      invitee: input.invitee,
      targetRole: input.targetRole,
      targetIsSelf: input.targetIsSelf,
    })
  ) {
    return { ok: false as const, status: 403, error: "You cannot do that in this brokerage." };
  }
  return { ok: true as const, office, role };
}

export async function findAuthUserId(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const response = await fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=20&filter=${encodeURIComponent(email)}`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    },
  ).catch(() => null);
  if (!response?.ok) return null;
  const body = (await response.json()) as { users?: { id?: string; email?: string }[] };
  const users = Array.isArray(body.users) ? body.users : [];
  return users.find((row) => row.email?.toLowerCase() === email)?.id ?? null;
}

export async function addOrInviteMember(input: {
  brokerageId: string;
  email: string;
  role: Role;
  invitedBy: string;
}) {
  if (!isRole(input.role)) throw new Error("Choose a role.");
  const admin = createAdminClient();
  const userId = await findAuthUserId(input.email);
  if (!userId) return { added: false as const };
  const { data: existing } = await admin
    .from("brokerage_members")
    .select("id,status,role")
    .eq("brokerage_id", input.brokerageId)
    .eq("email", input.email)
    .maybeSingle();
  if (existing?.status === "active") return { added: false as const, already: true };
  if (existing?.id) {
    const { error } = await admin
      .from("brokerage_members")
      .update({
        user_id: userId,
        status: "active",
        role: existing.role === "owner" ? "owner" : input.role,
        joined_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error("Could not add that person.");
    return { added: true as const };
  }
  const { error } = await admin.from("brokerage_members").insert({
    brokerage_id: input.brokerageId,
    user_id: userId,
    email: input.email,
    role: input.role,
    status: "active",
    invited_by: input.invitedBy,
    joined_at: new Date().toISOString(),
  });
  if (error) throw new Error("Could not add that person.");
  return { added: true as const };
}
