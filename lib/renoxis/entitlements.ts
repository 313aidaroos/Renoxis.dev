import type { Entitlement } from "./billing";

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
 * Reads from renoxis_records kind='entitlement' for wallet_capture,
 * falls back to hub-admin beta allowlist.
 */
export async function serverEntitlement(
  user: UserIdentity,
  supabase?: any,
): Promise<Entitlement> {
  // First try database entitlement
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

  // Fall back to beta grants
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
