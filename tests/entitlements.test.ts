import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasServerEntitlement,
  requireServerEntitlement,
  serverEntitlement,
} from "../lib/renoxis/entitlements.ts";

const user = { id: "user-123", email: "agent@example.com" };
delete process.env.WALLET_API_KEY;
delete process.env.APIXIS_WALLET_API_KEY;

// serverEntitlement is async (it consults the Wallet), so the env must stay set until the
// awaited body finishes — a sync try/finally restored it before the assertions ran.
async function withEnv(values: Record<string, string | undefined>, fn: () => Promise<void>) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("unlisted signed user stays blocked", async () => {
  await withEnv(
    {
      RENOXIS_BETA_GRANT_EMAILS: undefined,
      RENOXIS_BETA_GRANT_USER_IDS: undefined,
    },
    async () => {
      assert.equal(await hasServerEntitlement(user), false);
      assert.equal((await serverEntitlement(user)).source, "none");
      await assert.rejects(async () => await requireServerEntitlement(user), /ENTITLEMENT/);
    },
  );
});

test("hub-admin beta email grant is server-only and case-insensitive", async () => {
  await withEnv(
    {
      RENOXIS_BETA_GRANT_EMAILS: "other@example.com, AGENT@EXAMPLE.COM ",
      RENOXIS_BETA_GRANT_USER_IDS: undefined,
    },
    async () => {
      assert.equal(await hasServerEntitlement(user), true);
      assert.equal((await serverEntitlement(user)).source, "admin_beta");
      await assert.doesNotReject(async () => await requireServerEntitlement(user));
    },
  );
});

test("hub-admin beta user id grant is server-only", async () => {
  await withEnv(
    {
      RENOXIS_BETA_GRANT_EMAILS: undefined,
      RENOXIS_BETA_GRANT_USER_IDS: "user-123",
    },
    async () => assert.equal(await hasServerEntitlement(user), true),
  );
});
