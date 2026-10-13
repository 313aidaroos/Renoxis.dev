import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { buyIxisUrl } from "../lib/apixis-wallet.ts";
import {
  CARD_BILLING_COPY,
  CLOSED_DEAL_FEE_BPS,
  IXIS_PER_USD,
  JOB_IXIS,
  LAUNCH_DATE,
  MONTHLY_PROMO_SKU,
  MONTHLY_STANDARD_SKU,
  PROMO_END,
  START_FEE,
  addOneUtcMonth,
  getMonthlyPrice,
  seatBuyReturnUrl,
  seatProductKey,
} from "../lib/renoxis/pricing.ts";

test("promo boundary switches the monthly price and SKU", () => {
  assert.equal(PROMO_END.getTime(), addOneUtcMonth(LAUNCH_DATE).getTime());
  const beforeLaunch = new Date(LAUNCH_DATE.getTime() - 1);
  const atLaunch = new Date(LAUNCH_DATE.getTime());
  const lastPromoMs = new Date(PROMO_END.getTime() - 1);
  const atEnd = new Date(PROMO_END.getTime());
  const after = new Date(PROMO_END.getTime() + 86_400_000);

  for (const now of [beforeLaunch, atLaunch, lastPromoMs]) {
    const price = getMonthlyPrice(now);
    assert.equal(price.phase, "promo");
    assert.equal(price.usd, 50);
    assert.equal(price.ixis, 5000);
    assert.equal(price.sku, MONTHLY_PROMO_SKU);
    assert.equal(seatProductKey("monthly", now), MONTHLY_PROMO_SKU);
  }
  for (const now of [atEnd, after]) {
    const price = getMonthlyPrice(now);
    assert.equal(price.phase, "standard");
    assert.equal(price.usd, 100);
    assert.equal(price.ixis, 10000);
    assert.equal(price.sku, MONTHLY_STANDARD_SKU);
    assert.equal(seatProductKey("monthly", now), MONTHLY_STANDARD_SKU);
  }
  assert.equal(seatProductKey("activate", atEnd), START_FEE.sku);
  assert.equal(START_FEE.ixis, 5000);
  assert.equal(START_FEE.usd, 50);
  assert.notEqual(MONTHLY_STANDARD_SKU, MONTHLY_PROMO_SKU);
});

test("one calendar month clamps short months", () => {
  assert.equal(
    addOneUtcMonth(new Date("2026-01-31T15:04:05.006Z")).toISOString(),
    "2026-02-28T15:04:05.006Z",
  );
  assert.equal(
    addOneUtcMonth(new Date("2026-03-31T00:00:00.000Z")).toISOString(),
    "2026-04-30T00:00:00.000Z",
  );
});

test("job prices, peg, and closed-deal share stay on the lock", () => {
  assert.equal(IXIS_PER_USD, 100);
  assert.equal(JOB_IXIS.email, 50);
  assert.equal(JOB_IXIS.offerLetter, 100);
  assert.equal(JOB_IXIS.propertyLookup, 25);
  assert.equal(JOB_IXIS.trackContact, 0);
  assert.equal(CLOSED_DEAL_FEE_BPS, 500);
});

test("insufficient Ixis buy link returns to the seat screen", () => {
  const back = seatBuyReturnUrl("https://renoxis.dev", "monthly");
  assert.match(back, /billing=renew/);
  const buy = new URL(buyIxisUrl("renoxis", back));
  assert.equal(buy.pathname, "/buy");
  assert.equal(buy.searchParams.get("product"), "renoxis");
  assert.equal(buy.searchParams.get("return_url"), back);
  assert.match(seatBuyReturnUrl("https://renoxis.dev/", "activate"), /billing=activate/);
});

test("launch is midnight Central on 2027-01-01 and $100 starts 2027-02-01", async () => {
  assert.equal(LAUNCH_DATE.toISOString(), "2027-01-01T06:00:00.000Z");
  assert.equal(PROMO_END.toISOString(), "2027-02-01T06:00:00.000Z");
  assert.equal(getMonthlyPrice(new Date("2027-02-01T05:59:59.999Z")).usd, 50);
  assert.equal(getMonthlyPrice(new Date("2027-02-01T06:00:00.000Z")).usd, 100);
  assert.equal(MONTHLY_STANDARD_SKU, "renoxis.agent.monthly.10000");
  const source = await readFile(new URL("../lib/renoxis/pricing.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /TODO\(Awad\): set the real launch/);
  assert.match(CARD_BILLING_COPY, /coming soon/i);
});

test("seat payment does not add Stripe", async () => {
  for (const file of [
    "../lib/renoxis/pricing.ts",
    "../lib/renoxis/billing.ts",
    "../lib/renoxis/seat-purchase.ts",
    "../lib/renoxis/redeem-seat.ts",
    "../components/SeatPay.tsx",
    "../components/PricingCheckout.tsx",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /STRIPE_|sk_live|sk_test|from ["']stripe|@stripe\/stripe-js/);
  }
  const purchase = await readFile(new URL("../lib/renoxis/seat-purchase.ts", import.meta.url), "utf8");
  assert.match(purchase, /seatProductKey\(input\.intent\)/);
  const pay = await readFile(new URL("../components/SeatPay.tsx", import.meta.url), "utf8");
  assert.match(pay, /Coming soon/);
  assert.match(pay, /Buy Ixis/);
});
