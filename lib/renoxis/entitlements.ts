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
 * Wallet capture persistence must be added here once its server contract lands.
 * Until then only an explicit hub-admin beta allowlist can grant access.
 */
export function serverEntitlement(user: UserIdentity): Entitlement {
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

export function hasServerEntitlement(user: UserIdentity) {
  return serverEntitlement(user).source !== "none";
}

export function requireServerEntitlement(user: UserIdentity) {
  if (!hasServerEntitlement(user)) throw new Error("ENTITLEMENT");
}
