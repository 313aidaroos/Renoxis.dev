import type { Entitlement } from "./billing.ts";
import { isSeatCurrent } from "./billing.ts";
import { createAdminClient } from "../supabase/admin.ts";

type UserIdentity = { id: string; email?: string | null };

function csv(name: string) {
  return new Set(
    (process.env[name] || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Server-only entitlement lookup.
 *
 * Source of truth for ACCESS is `renoxis_entitlements` — a table no customer role can read or
 * write (RLS on, zero policies, service role only). The redeem route is the only writer, and it
 * writes only inside a Wallet reserve→capture. The Wallet remains proof of purchase.
 *
 * The old design cached this in `renoxis_records` (customer-writable) and trusted the row;
 * a customer could have granted themselves a seat. That kind is gone from the CHECK constraint.
 */
export async function serverEntitlement(user: UserIdentity): Promise<Entitlement> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("renoxis_entitlements")
      .select("activated_at, seat_period_end, source")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) console.error("renoxis_entitlements read failed:", error.message);
    if (data) {
      return {
        activatedAt: data.activated_at,
        seatPeriodEnd: data.seat_period_end,
        source: "wallet_capture",
      };
    }
  } catch (e) {
    console.error("entitlement lookup error:", e);
  }

  // Beta grants: env-only, set by Awad, never from the client or DB.
  const emails = csv("RENOXIS_BETA_GRANT_EMAILS");
  const ids = csv("RENOXIS_BETA_GRANT_USER_IDS");
  const email = user.email?.trim().toLowerCase() || "";
  if ((email && emails.has(email)) || ids.has(user.id.toLowerCase())) {
    return { activatedAt: "admin-beta-grant", seatPeriodEnd: null, source: "admin_beta" };
  }

  return { activatedAt: null, seatPeriodEnd: null, source: "none" };
}

/**
 * Access = activated AND the paid month has not ended. An activation with no paid month, or a
 * lapsed seat, is NOT access — matching what the UI already showed as "lapsed".
 */
export async function hasServerEntitlement(user: UserIdentity, now = Date.now()) {
  const ent = await serverEntitlement(user);
  return isSeatCurrent(ent, now);
}

export async function requireServerEntitlement(user: UserIdentity) {
  if (!(await hasServerEntitlement(user))) throw new Error("ENTITLEMENT");
}
