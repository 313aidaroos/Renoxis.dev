/**
 * Locked Renoxis prices (Awad, 2026-10-13).
 * Pages, pricing copy, and server-side charges read this module.
 * 100 Ixis = $1. This site does not grant Ixis.
 * Card checkout reads these amounts. Price ids stay in env.
 */

/** Midnight Central time on 2027-01-01 (CST, UTC−6). Set by Awad on 2026-10-13. */
export const LAUNCH_DATE = new Date("2027-01-01T06:00:00.000Z");

export const IXIS_PER_USD = 100;

export const START_FEE = {
  usd: 50,
  ixis: 5000,
  sku: "renoxis.activate",
} as const;

/** Live Wallet catalog row. It is 5,000 Ixis today. */
export const MONTHLY_PROMO_SKU = "renoxis.agent.monthly";

/**
 * 10,000 Ixis monthly SKU. Wallet Lead is publishing this id.
 * Do not point this at renoxis.agent.monthly. That catalog row is 5,000 Ixis.
 */
export const MONTHLY_STANDARD_SKU = "renoxis.agent.monthly.10000";

export const JOB_IXIS = {
  email: 50,
  offerLetter: 100,
  propertyLookup: 25,
  trackContact: 0,
} as const;

/** Apixis share of a closed-deal fee. Recorded as pending. The Wallet collects it. */
export const CLOSED_DEAL_FEE_BPS = 500;

export type PricePhase = "promo" | "standard";

export type MonthlyPrice = {
  phase: PricePhase;
  usd: number;
  ixis: number;
  sku: string;
};

const PROMO_MONTHLY: MonthlyPrice = {
  phase: "promo",
  usd: 50,
  ixis: 5000,
  sku: MONTHLY_PROMO_SKU,
};

const STANDARD_MONTHLY: MonthlyPrice = {
  phase: "standard",
  usd: 100,
  ixis: 10000,
  sku: MONTHLY_STANDARD_SKU,
};

/** Same calendar day next month, or the last day when that month is shorter. UTC. */
export function addOneUtcMonth(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      year,
      month + 1,
      Math.min(date.getUTCDate(), lastDay),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

/** LAUNCH_DATE plus one calendar month. The monthly price switches here. */
export const PROMO_END = addOneUtcMonth(LAUNCH_DATE);

/**
 * Launch rate until PROMO_END (2027-02-01 06:00 UTC, midnight Central),
 * including dates before LAUNCH_DATE. At PROMO_END the price is $100
 * and the standard SKU. The switch does not need a deploy.
 */
export function getMonthlyPrice(now: Date = new Date()): MonthlyPrice {
  if (now.getTime() < PROMO_END.getTime()) return PROMO_MONTHLY;
  return STANDARD_MONTHLY;
}

export function seatProductKey(
  intent: "activate" | "monthly",
  now: Date = new Date(),
) {
  return intent === "activate" ? START_FEE.sku : getMonthlyPrice(now).sku;
}

/** Return path after Buy Ixis. Monthly redeem uses billing=renew. */
export function seatBuyReturnUrl(origin: string, intent: "activate" | "monthly") {
  const base = origin.replace(/\/$/, "") || "https://renoxis.dev";
  const billing = intent === "activate" ? "activate" : "renew";
  return `${base}/?board=Connections&billing=${billing}`;
}

export function closedDealFeeLabel() {
  return `${CLOSED_DEAL_FEE_BPS / 100}%`;
}

export function formatIxis(amount: number) {
  return amount.toLocaleString("en-US");
}

export function beginCharge(now: Date = new Date()) {
  const monthly = getMonthlyPrice(now);
  return {
    usd: START_FEE.usd + monthly.usd,
    ixis: START_FEE.ixis + monthly.ixis,
    monthly,
  };
}

/** Shown wherever card and Ixis are both offered. */
export const CARD_BILLING_COPY =
  "Pay by card through Stripe Checkout on the shared Apixis account. Ixis stay in Apixis Wallet and are never granted here.";
