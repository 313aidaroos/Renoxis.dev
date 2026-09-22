import type { Entitlement } from "./billing";
import { hasEntitlement as walletHasEntitlement } from "@/lib/apixis-wallet";

type UserIdentity = { id: string; email?: string | null };

function csv(name: string) {
  return new Set(
    (process.env[name] || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

const APP_SLUG = "renoxis";
const PRODUCT_KEY_ACTIVATE = "renoxis.activate";

/**
 * Server-only entitlement lookup.
 * Wallet entitlements (written on capture) are the single source of truth.
 * Local renoxis_records kind='entitlement' is a CACHE only, not authoritative.
 * Falls back to hub-admin beta allowlist for testing.
 */
export async function serverEntitlement(
  user: UserIdentity,
  supabase?: any,
): Promise<Entitlement> {
  // Check Wallet entitlements (source of truth)
  try {
    const hasActivate = await walletHasEntitlement(user.id, APP_SLUG, PRODUCT_KEY_ACTIVATE);
    if (hasActivate) {
      return {
        activatedAt: new Date().toISOString(),
        seatPeriodEnd: null,
        source: "wallet_capture",
      };
    }
  } catch (walletErr) {
    // Wallet unreachable, fall through to cache + beta grants
    console.warn("Wallet entitlement check failed:", walletErr);
  }

  // Fall back to local cache (renoxis_records) if Wallet unreachable
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("renoxis_records")
        .select("data")
        .eq("user_id", user.id)
        .eq("kind", "entitlement")
        .single();

      if (!error && data?.data) {
        const ent = data.data as Entitlement;
        if (ent.source === "wallet_capture" && ent.activatedAt) {
          return ent;
        }
      }
    } catch {
      // Fall through to beta grant check
    }
  }

  // Fall back to beta grants (for testing before first redeem)
  const emails = csv("RENOXIS_BETA_GRANT_EMAILS");
  const ids = csv("RENOXIS_BETA_GRANT_USER_IDS");
  const email = user.email?.trim().toLowerCase() || "";
  if ((email && emails.has(email)) || ids.has(user.id.toLowerCase())) {
    return {
      activatedAt: "admin-beta-grant",
      seatPeriodEnd: null,
      source: "admin_beta",
    };
  }

  return {
    activatedAt: null,
    seatPeriodEnd: null,
    source: "none",
  };
}

export async function hasServerEntitlement(
  user: UserIdentity,
  supabase?: any,
) {
  const ent = await serverEntitlement(user, supabase);
  return ent.source !== "none";
}

export async function requireServerEntitlement(
  user: UserIdentity,
  supabase?: any,
) {
  if (!(await hasServerEntitlement(user, supabase)))
    throw new Error("ENTITLEMENT");
}
