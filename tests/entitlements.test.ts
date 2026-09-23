import assert from "node:assert/strict";
import { test } from "node:test";
import { isSeatCurrent, seatStatus, type Entitlement } from "../lib/renoxis/billing.ts";
import { hasServerEntitlement, serverEntitlement, requireServerEntitlement } from "../lib/renoxis/entitlements.ts";

const user = { id: "user-123", email: "agent@example.com" };
// No service-role env in tests → the protected-table read fails closed and only env grants apply.
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

async function withEnv(values: Record<string, string | undefined>, fn: () => Promise<void>) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { await fn(); } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

const DAY = 86400_000;
const now = Date.parse("2026-09-22T12:00:00Z");
const paid = (end: number): Entitlement => ({ activatedAt: "2026-09-01T00:00:00Z", seatPeriodEnd: new Date(end).toISOString(), source: "wallet_capture" });

test("server access requires a CURRENT paid month, not just activation", () => {
  assert.equal(isSeatCurrent(paid(now + DAY), now), true, "paid month in progress → access");
  assert.equal(isSeatCurrent(paid(now - DAY), now), false, "lapsed seat → no access");
  assert.equal(isSeatCurrent({ activatedAt: "2026-09-01T00:00:00Z", seatPeriodEnd: null, source: "wallet_capture" }, now), false, "activated, never paid a month → no access");
  assert.equal(isSeatCurrent(paid(now), now), false, "period end == now → expired");
});

test("UI status and server gate agree on lapsed", () => {
  assert.equal(seatStatus(false, paid(now - DAY), now), "activated_lapsed");
  assert.equal(isSeatCurrent(paid(now - DAY), now), false);
});

test("customer-supplied data can never grant access: only env grants without the protected table", async () => {
  await withEnv({ RENOXIS_BETA_GRANT_EMAILS: undefined, RENOXIS_BETA_GRANT_USER_IDS: undefined }, async () => {
    assert.equal((await serverEntitlement(user)).source, "none");
    assert.equal(await hasServerEntitlement(user), false);
    await assert.rejects(() => requireServerEntitlement(user), /ENTITLEMENT/);
  });
});

test("beta grant is env-only and case-insensitive", async () => {
  await withEnv({ RENOXIS_BETA_GRANT_EMAILS: "other@example.com, AGENT@EXAMPLE.COM ", RENOXIS_BETA_GRANT_USER_IDS: undefined }, async () => {
    assert.equal((await serverEntitlement(user)).source, "admin_beta");
    assert.equal(await hasServerEntitlement(user), true);
  });
});
