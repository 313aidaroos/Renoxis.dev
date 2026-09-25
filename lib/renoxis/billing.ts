/**
 * Soft-launch billing for Renoxis.
 * Cash buy stays on Apixis Wallet. No Renoxis Stripe.
 * Activate + monthly seat: 5000 Ixis ($50) each per Awad lock 2026-09-21.
 * Paid Cixy drafts use the person’s shared Apixis Wallet (see wallet-charge.ts).
 * Wallet SKUs locked by hub: renoxis.activate + renoxis.agent.monthly @ 5000
 * (do NOT invent Wallet balances; revise monthly off 30000 — no new seat.monthly key).
 * Wallet catalog SKUs are LIVE (activate + agent.monthly @ 5000).
 * Entitlements stay empty until redeem capture — do not invent balances.
 */

import { RENOXIS_APP_ORIGIN, walletBuyUrl } from "./wallet-link.ts";

export const ACTIVATE_IXIS = 5000;
export const MONTHLY_IXIS = 5000;
export const ACTIVATE_USD = 50;
export const MONTHLY_USD = 50;

/** Locked Wallet product keys (Wallet Lead prices at 5000). */
export const WALLET_SKU = {
  activate: "renoxis.activate",
  /** Existing catalog key — revise to 5000/mo; do not invent renoxis.seat.monthly. */
  monthly: "renoxis.agent.monthly",
} as const;

/** Hub aliases for the same SKUs. */
export const WALLET_SKU_ALIAS = {
  activate: "renoxis-activate",
  monthly: "renoxis-monthly",
} as const;

export type SeatStatus =
  | "preview"
  | "signed_inactive"
  | "activated_lapsed"
  | "active";

export type Entitlement = {
  activatedAt: string | null;
  seatPeriodEnd: string | null;
  /** Server-provisioned only. Client/local values never grant access. */
  source: "none" | "admin_beta" | "wallet_capture";
};

export const emptyEntitlement = (): Entitlement => ({
  activatedAt: null,
  seatPeriodEnd: null,
  source: "none",
});

export function isActivated(e: Entitlement) {
  return e.source !== "none" && !!e.activatedAt;
}

export function isSeatCurrent(e: Entitlement, now = Date.now()) {
  if (e.source === "admin_beta") return true;
  if (e.source !== "wallet_capture" || !e.activatedAt || !e.seatPeriodEnd) return false;
  const end = Date.parse(e.seatPeriodEnd);
  return Number.isFinite(end) && end > now;
}

export function seatStatus(
  preview: boolean,
  e: Entitlement,
  now = Date.now(),
): SeatStatus {
  if (preview) return "preview";
  if (!isActivated(e)) return "signed_inactive";
  if (!isSeatCurrent(e, now)) return "activated_lapsed";
  return "active";
}

export function canUseWorkspace(status: SeatStatus) {
  return status === "active";
}

/** Chat basics included in subscription; heavy SKUs still meter. */
export function canUseCixyChat(status: SeatStatus) {
  return status === "active";
}

function billingReturn(intent: "activate" | "renew") {
  const url = new URL(RENOXIS_APP_ORIGIN);
  url.searchParams.set("board", "Connections");
  url.searchParams.set("billing", intent);
  return url.toString();
}

export function activateWalletHref() {
  return walletBuyUrl(billingReturn("activate"));
}

export function renewWalletHref() {
  return walletBuyUrl(billingReturn("renew"));
}

export function activateCopy() {
  return `Activate · ${ACTIVATE_IXIS.toLocaleString()} Ixis ($${ACTIVATE_USD})`;
}

export function renewCopy() {
  return `Keep running · ${MONTHLY_IXIS.toLocaleString()} Ixis / mo ($${MONTHLY_USD})`;
}

/** Copy after Wallet return — catalog live; entitlement empty until capture. */
export function redeemAwaitingCaptureCopy(intent: "activate" | "renew") {
  const sku =
    intent === "activate" ? WALLET_SKU.activate : WALLET_SKU.monthly;
  const amount = intent === "activate" ? ACTIVATE_IXIS : MONTHLY_IXIS;
  return (
    `Wallet catalog is live (${sku} · ${amount.toLocaleString()} Ixis). ` +
    "Seat unlocks after redeem capture — entitlements stay empty until then (no invented balances)."
  );
}

/**
 * Idempotency keys for Wallet redeem (hub lock).
 * activate: renoxis-{userId}-activate
 * monthly: renoxis-{userId}-seat-{YYYY-MM}
 */
export function redeemIdempotencyKey(
  userId: string,
  intent: "activate" | "renew",
  at = new Date(),
) {
  const id = userId.trim() || "unknown";
  if (intent === "activate") return `renoxis-${id}-activate`;
  const y = at.getUTCFullYear();
  const m = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `renoxis-${id}-seat-${y}-${m}`;
}
