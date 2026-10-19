import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PROMO_END } from "../lib/renoxis/pricing.ts";
import {
  ACTIVATE_IXIS,
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

test("pricing lock is 5000 Ixis to start", () => {
  assert.equal(ACTIVATE_IXIS, 5000);
});

test("Wallet SKUs are activate + agent.monthly, with a separate standard id", () => {
  assert.equal(WALLET_SKU.activate, "renoxis.activate");
  assert.equal(WALLET_SKU.monthlyPromo, "renoxis.agent.monthly");
  assert.match(WALLET_SKU.monthlyStandard, /10000/);
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
  const card: Entitlement = {
    activatedAt: "2026-09-01T00:00:00Z",
    seatPeriodEnd: "2026-10-01T00:00:00Z",
    source: "card",
  };
  assert.equal(seatStatus(false, card, Date.parse("2026-09-15T00:00:00Z")), "active");
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
  const duringPromo = new Date(PROMO_END.getTime() - 1);
  assert.match(redeemAwaitingCaptureCopy("activate", duringPromo), /renoxis\.activate/);
  assert.match(redeemAwaitingCaptureCopy("renew", duringPromo), /renoxis\.agent\.monthly · 5,000/);
  assert.match(redeemAwaitingCaptureCopy("renew", PROMO_END), /renoxis\.agent\.monthly\.10000 · 10,000/);
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
  const [records, chat, listings, documents] = await Promise.all([
    readFile(new URL("../app/api/records/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/chat/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/api/listings/generate/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/api/documents/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(records, /await requireServerEntitlement\(user/);
  assert.match(chat, /await hasServerEntitlement\(user/);
  // Regression: this route once called hasServerEntitlement without await (always-truthy Promise → paywall open).
  assert.match(listings, /await hasServerEntitlement\(user/);
  assert.doesNotMatch(listings, /redeem\(/);
  assert.doesNotMatch(listings, /TODO: Call Apixis Wallet/);
  assert.match(listings, /Do not invent one or charge locally/);
  assert.equal(
    documents.match(/await requireServerEntitlement\(user\)/g)?.length,
    2,
  );
});
