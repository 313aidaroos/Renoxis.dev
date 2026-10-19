/**
 * Card price selection for Renoxis seats.
 * Amounts come from pricing.ts (LAUNCH_DATE / PROMO_END). Price ids come from env.
 * This module does not call Stripe and does not grant Ixis.
 */

import {
  PROMO_END,
  START_FEE,
  getMonthlyPrice,
  type PricePhase,
} from "./pricing.ts";

export const STRIPE_PRICE_ENV = {
  startFee: "STRIPE_PRICE_START_FEE",
  monthlyPromo: "STRIPE_PRICE_MONTHLY_PROMO",
  monthlyStandard: "STRIPE_PRICE_MONTHLY_STANDARD",
} as const;

export type CardIntent = "activate" | "monthly";

export type CardPriceSelection = {
  intent: CardIntent;
  mode: "payment" | "subscription";
  envName: (typeof STRIPE_PRICE_ENV)[keyof typeof STRIPE_PRICE_ENV];
  priceId: string;
  usd: number;
  sku: string;
  phase: PricePhase | "start";
  /** When the promo subscription moves to the standard price. Null from PROMO_END on. */
  switchAt: string | null;
  switchPriceId: string | null;
};

export type StripePriceEnv = { [key: string]: string | undefined };

export function cardCheckoutConfigured(env: StripePriceEnv = process.env) {
  return Boolean(
    env.STRIPE_SECRET_KEY?.trim() &&
      env[STRIPE_PRICE_ENV.startFee]?.trim() &&
      env[STRIPE_PRICE_ENV.monthlyPromo]?.trim() &&
      env[STRIPE_PRICE_ENV.monthlyStandard]?.trim(),
  );
}

export function selectCardPrice(
  intent: CardIntent,
  now: Date = new Date(),
  env: StripePriceEnv = process.env,
): CardPriceSelection {
  if (intent === "activate") {
    return {
      intent,
      mode: "payment",
      envName: STRIPE_PRICE_ENV.startFee,
      priceId: env[STRIPE_PRICE_ENV.startFee]?.trim() || "",
      usd: START_FEE.usd,
      sku: START_FEE.sku,
      phase: "start",
      switchAt: null,
      switchPriceId: null,
    };
  }
  const monthly = getMonthlyPrice(now);
  const promo = monthly.phase === "promo";
  const standardId = env[STRIPE_PRICE_ENV.monthlyStandard]?.trim() || "";
  return {
    intent,
    mode: "subscription",
    envName: promo ? STRIPE_PRICE_ENV.monthlyPromo : STRIPE_PRICE_ENV.monthlyStandard,
    priceId: (promo ? env[STRIPE_PRICE_ENV.monthlyPromo] : env[STRIPE_PRICE_ENV.monthlyStandard])?.trim() || "",
    usd: monthly.usd,
    sku: monthly.sku,
    phase: monthly.phase,
    switchAt: promo ? PROMO_END.toISOString() : null,
    switchPriceId: promo ? standardId : null,
  };
}

/** Stripe unit_amount is cents. */
export function stripeCents(usd: number) {
  return Math.round(usd * 100);
}

export type StripePriceShape = {
  unit_amount: number | null;
  currency: string;
  type: string;
  recurring: { interval: string } | null;
};

export function priceMatchesSelection(price: StripePriceShape, selection: CardPriceSelection) {
  if (price.currency !== "usd" || price.unit_amount !== stripeCents(selection.usd)) return false;
  if (selection.mode === "payment") return price.type === "one_time";
  return price.type === "recurring" && price.recurring?.interval === "month";
}

export function checkoutSessionParams(input: {
  selection: CardPriceSelection;
  userId: string;
  email: string;
  origin: string;
  integrationIdentifier: string;
}) {
  const origin = input.origin.replace(/\/$/, "");
  const metadata: Record<string, string> = {
    product: "renoxis",
    intent: input.selection.intent,
    user_id: input.userId,
    sku: input.selection.sku,
    usd: String(input.selection.usd),
  };
  if (input.selection.switchAt && input.selection.switchPriceId) {
    metadata.switch_at = input.selection.switchAt;
    metadata.switch_price = input.selection.switchPriceId;
  }
  const params: {
    mode: "payment" | "subscription";
    line_items: [{ price: string; quantity: 1 }];
    success_url: string;
    cancel_url: string;
    client_reference_id: string;
    customer_email: string;
    metadata: Record<string, string>;
    integration_identifier: string;
    subscription_data?: { metadata: Record<string, string> };
    payment_intent_data?: { metadata: Record<string, string> };
  } = {
    mode: input.selection.mode,
    line_items: [{ price: input.selection.priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?board=Connections&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?board=Connections&checkout=cancel`,
    client_reference_id: input.userId,
    customer_email: input.email,
    metadata,
    integration_identifier: input.integrationIdentifier,
  };
  if (input.selection.mode === "subscription") params.subscription_data = { metadata };
  else params.payment_intent_data = { metadata };
  return params;
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

export function integrationIdentifier(bytes = crypto.getRandomValues(new Uint8Array(8))) {
  let suffix = "";
  for (let i = 0; i < 8; i += 1) suffix += LETTERS[bytes[i]! % 26];
  return `renoxis_checkout_${suffix}`;
}
