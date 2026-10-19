import assert from "node:assert/strict";
import { test } from "node:test";
import { PROMO_END, START_FEE } from "../lib/renoxis/pricing.ts";
import {
  cardCheckoutConfigured,
  checkoutSessionParams,
  priceMatchesSelection,
  selectCardPrice,
  stripeCents,
} from "../lib/renoxis/stripe-prices.ts";

const env = {
  STRIPE_SECRET_KEY: "sk_live_example",
  STRIPE_PRICE_START_FEE: "price_start",
  STRIPE_PRICE_MONTHLY_PROMO: "price_promo",
  STRIPE_PRICE_MONTHLY_STANDARD: "price_standard",
};

test("card checkout stays off until every Stripe env var is set", () => {
  assert.equal(cardCheckoutConfigured({}), false);
  assert.equal(cardCheckoutConfigured({ STRIPE_SECRET_KEY: "sk_live_example" }), false);
  assert.equal(cardCheckoutConfigured(env), true);
});

test("checkout uses pricing.ts and switches price ids at PROMO_END", () => {
  const during = new Date(PROMO_END.getTime() - 1);
  const promo = selectCardPrice("monthly", during, env);
  assert.equal(promo.mode, "subscription");
  assert.equal(promo.usd, 50);
  assert.equal(promo.priceId, "price_promo");
  assert.equal(promo.envName, "STRIPE_PRICE_MONTHLY_PROMO");
  assert.equal(promo.switchAt, PROMO_END.toISOString());
  assert.equal(promo.switchPriceId, "price_standard");

  const standard = selectCardPrice("monthly", PROMO_END, env);
  assert.equal(standard.usd, 100);
  assert.equal(standard.priceId, "price_standard");
  assert.equal(standard.switchAt, null);
  assert.equal(standard.switchPriceId, null);

  const start = selectCardPrice("activate", during, env);
  assert.equal(start.mode, "payment");
  assert.equal(start.usd, START_FEE.usd);
  assert.equal(start.priceId, "price_start");
  assert.equal(stripeCents(start.usd), 5000);
  assert.equal(stripeCents(standard.usd), 10000);
});

test("session params carry the Renoxis metadata and the promo switch", () => {
  const selection = selectCardPrice("monthly", new Date("2027-01-15T00:00:00.000Z"), env);
  const params = checkoutSessionParams({
    selection,
    userId: "11111111-1111-4111-8111-111111111111",
    email: "agent@example.com",
    origin: "https://renoxis.dev/",
    integrationIdentifier: "renoxis_checkout_abcdefgh",
  });
  assert.equal(params.mode, "subscription");
  assert.equal(params.line_items[0].price, "price_promo");
  assert.equal(params.metadata.product, "renoxis");
  assert.equal(params.metadata.intent, "monthly");
  assert.equal(params.metadata.usd, "50");
  assert.equal(params.metadata.switch_at, PROMO_END.toISOString());
  assert.equal(params.metadata.switch_price, "price_standard");
  assert.equal(params.subscription_data?.metadata.user_id, "11111111-1111-4111-8111-111111111111");
  assert.match(params.success_url, /^https:\/\/renoxis\.dev\/dashboard/);
  assert.equal(
    priceMatchesSelection(
      { unit_amount: 5000, currency: "usd", type: "recurring", recurring: { interval: "month" } },
      selection,
    ),
    true,
  );
  assert.equal(
    priceMatchesSelection(
      { unit_amount: 10000, currency: "usd", type: "recurring", recurring: { interval: "month" } },
      selection,
    ),
    false,
  );
});
