import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACTIVATE_IXIS,
  MONTHLY_IXIS,
  WALLET_SKU,
  WALLET_SKU_ALIAS,
  activateWalletHref,
  canUseCixyChat,
  canUseWorkspace,
  emptyEntitlement,
  markActivated,
  markSeatMonth,
  parseEntitlement,
  redeemIdempotencyKey,
  redeemSkuPendingCopy,
  renewWalletHref,
  seatStatus,
} from "../lib/renoxis/billing.ts";

test("pricing lock is 5000 Ixis activate and monthly", () => {
  assert.equal(ACTIVATE_IXIS, 5000);
  assert.equal(MONTHLY_IXIS, 5000);
});

test("Wallet SKUs are activate + agent.monthly (not seat.monthly)", () => {
  assert.equal(WALLET_SKU.activate, "renoxis.activate");
  assert.equal(WALLET_SKU.monthly, "renoxis.agent.monthly");
  assert.equal(WALLET_SKU_ALIAS.activate, "renoxis-activate");
  assert.equal(WALLET_SKU_ALIAS.monthly, "renoxis-monthly");
});

test("seatStatus gates preview / inactive / lapsed / active", () => {
  assert.equal(seatStatus(true, emptyEntitlement()), "preview");
  assert.equal(seatStatus(false, emptyEntitlement()), "signed_inactive");
  const activated = markActivated(emptyEntitlement());
  assert.equal(seatStatus(false, activated), "activated_lapsed");
  const current = markSeatMonth(activated, new Date("2026-09-01T00:00:00Z"), 30);
  assert.equal(
    seatStatus(false, current, Date.parse("2026-09-15T00:00:00Z")),
    "active",
  );
  assert.equal(
    seatStatus(false, current, Date.parse("2026-10-15T00:00:00Z")),
    "activated_lapsed",
  );
  assert.equal(canUseWorkspace("active"), true);
  assert.equal(canUseWorkspace("signed_inactive"), false);
  assert.equal(canUseCixyChat("active"), true);
  assert.equal(canUseCixyChat("activated_lapsed"), false);
});

test("Wallet CTAs are product=renoxis buy with billing return", () => {
  const a = new URL(activateWalletHref());
  assert.equal(a.pathname, "/buy");
  assert.equal(a.searchParams.get("product"), "renoxis");
  assert.match(a.searchParams.get("return_url") || "", /billing=activate/);
  const r = new URL(renewWalletHref());
  assert.match(r.searchParams.get("return_url") || "", /billing=renew/);
});

test("idempotency keys follow hub lock", () => {
  assert.equal(
    redeemIdempotencyKey("user-1", "activate"),
    "renoxis-user-1-activate",
  );
  assert.equal(
    redeemIdempotencyKey("user-1", "renew", new Date("2026-09-21T12:00:00Z")),
    "renoxis-user-1-seat-2026-09",
  );
});

test("redeem pending copy names the locked SKU", () => {
  assert.match(redeemSkuPendingCopy("activate"), /renoxis\.activate/);
  assert.match(redeemSkuPendingCopy("renew"), /renoxis\.agent\.monthly/);
  assert.match(redeemSkuPendingCopy("activate"), /SKU pending/);
});

test("parseEntitlement ignores invented balances", () => {
  assert.deepEqual(parseEntitlement({ balance: 9999 }), emptyEntitlement());
  assert.equal(
    parseEntitlement({
      activatedAt: "2026-09-21T00:00:00.000Z",
      seatPeriodEnd: "2026-10-21T00:00:00.000Z",
      source: "wallet",
    }).source,
    "wallet",
  );
});
