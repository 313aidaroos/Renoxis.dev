import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  redeemIdempotencyKey,
  redeemAwaitingCaptureCopy,
  renewWalletHref,
  seatStatus,
  type Entitlement,
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

test("seatStatus trusts only server entitlement sources", () => {
  assert.equal(seatStatus(true, emptyEntitlement()), "preview");
  assert.equal(seatStatus(false, emptyEntitlement()), "signed_inactive");
  const beta: Entitlement = {
    activatedAt: "admin-beta-grant",
    seatPeriodEnd: null,
    source: "admin_beta",
  };
  assert.equal(seatStatus(false, beta), "active");
  const current: Entitlement = {
    activatedAt: "2026-09-01T00:00:00Z",
    seatPeriodEnd: "2026-10-01T00:00:00Z",
    source: "wallet_capture",
  };
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

test("redeem copy keeps entitlement empty until capture", () => {
  assert.match(redeemAwaitingCaptureCopy("activate"), /renoxis\.activate/);
  assert.match(redeemAwaitingCaptureCopy("renew"), /renoxis\.agent\.monthly/);
  assert.match(redeemAwaitingCaptureCopy("activate"), /catalog is live/);
  assert.match(redeemAwaitingCaptureCopy("activate"), /empty until then/);
});

test("client has no self-confirm or local billing unlock path", async () => {
  const source = await readFile(
    new URL("../components/CommandDesk.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /Confirm activate/);
  assert.doesNotMatch(source, /Confirm Keep running/);
  assert.doesNotMatch(source, /renoxis-billing-v1/);
  assert.doesNotMatch(source, /persistEntitlement/);
  // Every seat unlock goes through a server route (reserve→capture); the client only calls it.
  assert.match(source, /fetch\(`\/api\/redeem\/\$\{intent\}`/);
  assert.doesNotMatch(source, /localStorage[^\n]*(seat|entitlement)/i);
});


test("paid server routes enforce server entitlement", async () => {
  const [records, chat, listings] = await Promise.all([
    readFile(new URL("../app/api/records/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/chat/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/api/listings/generate/route.ts", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(records, /await requireServerEntitlement\(user/);
  assert.match(chat, /await hasServerEntitlement\(user/);
  // Regression: this route once called hasServerEntitlement without await (always-truthy Promise → paywall open).
  assert.match(listings, /await hasServerEntitlement\(user/);
});
