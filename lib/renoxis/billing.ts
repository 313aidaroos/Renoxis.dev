/**
 * Soft-launch billing for Renoxis.
 * Amounts and SKUs live in pricing.ts (Awad, 2026-10-13).
 * Ixis redeem stays on the Wallet. Card checkout is Stripe, and it writes the same seat fields.
 * Cixy jobs inside a brokerage bill the office owner's Apixis Wallet (see office-billing.ts).
 * Entitlements stay empty until redeem capture — do not invent balances.
 */

import { RENOXIS_APP_ORIGIN, walletBuyUrl } from "./wallet-link.ts";
import {
  IXIS_PER_USD,
  MONTHLY_PROMO_SKU,
  MONTHLY_STANDARD_SKU,
  PROMO_END,
  START_FEE,
  formatIxis,
  getMonthlyPrice,
} from "./pricing.ts";

export const ACTIVATE_IXIS = START_FEE.ixis;
export const ACTIVATE_USD = START_FEE.usd;

/** Wallet product keys. The standard monthly id is the one Wallet Lead is publishing. */
export const WALLET_SKU = {
  activate: START_FEE.sku,
  monthlyPromo: MONTHLY_PROMO_SKU,
  monthlyStandard: MONTHLY_STANDARD_SKU,
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
  source: "none" | "admin_beta" | "wallet_capture" | "card";
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
  if ((e.source !== "wallet_capture" && e.source !== "card") || !e.activatedAt || !e.seatPeriodEnd) return false;
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
  return `Activate · ${formatIxis(ACTIVATE_IXIS)} Ixis ($${ACTIVATE_USD})`;
}

export function renewCopy(now = new Date()) {
  const price = getMonthlyPrice(now);
  return `Monthly plan · ${formatIxis(price.ixis)} Ixis / mo ($${price.usd})`;
}

export function startFeeCopy() {
  return `$${ACTIVATE_USD} one-time start fee (${formatIxis(ACTIVATE_IXIS)} Ixis).`;
}

export function monthlyPlanCopy(now = new Date()) {
  const price = getMonthlyPrice(now);
  const renews = "It renews automatically every month.";
  if (price.phase === "promo") {
    const later = getMonthlyPrice(PROMO_END);
    return `$${price.usd}/month (${formatIxis(price.ixis)} Ixis) for the first month from launch, then $${later.usd}/month (${formatIxis(later.ixis)} Ixis). ${renews}`;
  }
  return `$${price.usd}/month (${formatIxis(price.ixis)} Ixis). ${renews}`;
}

/** Shown wherever the start fee or monthly plan is offered. No card form here. */
export function payChoiceCopy() {
  return `Pay with Ixis or by card. ${IXIS_PER_USD} Ixis = $1.`;
}

/** Copy after Wallet return — catalog live; entitlement empty until capture. */
export function redeemAwaitingCaptureCopy(intent: "activate" | "renew", now = new Date()) {
  const monthly = getMonthlyPrice(now);
  const sku = intent === "activate" ? WALLET_SKU.activate : monthly.sku;
  const amount = intent === "activate" ? ACTIVATE_IXIS : monthly.ixis;
  return (
    `Wallet catalog is live (${sku} · ${formatIxis(amount)} Ixis). ` +
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
