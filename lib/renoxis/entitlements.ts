import type { Entitlement } from "./billing";
import { hasEntitlement as walletHasEntitlement, isWalletConfigured } from "../apixis-wallet.ts";

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
  // Wallet entitlements are the source of truth. The Wallet records WHAT was bought
  // (activate, monthly); the seat period is ours, kept in the renoxis_records cache
  // that the redeem route writes at capture time. So: Wallet proves ownership, cache
  // supplies the dates. If the Wallet says "activated" but the cache is missing
  // (e.g. bought on another device before the cache existed), rebuild a minimal row.
  let walletActivated = false;
  if (user.email && isWalletConfigured()) {
    try {
      walletActivated = await walletHasEntitlement(user.email, APP_SLUG, PRODUCT_KEY_ACTIVATE);
    } catch (walletErr) {
      console.warn("Wallet entitlement check failed:", walletErr);
    }
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
          return ent; // has activatedAt + seatPeriodEnd from the redeem route
        }
      }
    } catch {
      // Fall through
    }
  }
  if (walletActivated) {
    // Wallet proves activation; no local dates yet → activated but not current.
    return { activatedAt: "wallet", seatPeriodEnd: null, source: "wallet_capture" };
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
