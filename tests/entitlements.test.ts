import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasServerEntitlement,
  requireServerEntitlement,
  serverEntitlement,
} from "../lib/renoxis/entitlements.ts";

const user = { id: "user-123", email: "agent@example.com" };

function withEnv(values: Record<string, string | undefined>, fn: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("unlisted signed user stays blocked", async () => {
  withEnv(
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
  withEnv(
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
  withEnv(
    {
      RENOXIS_BETA_GRANT_EMAILS: undefined,
      RENOXIS_BETA_GRANT_USER_IDS: "user-123",
    },
    async () => assert.equal(await hasServerEntitlement(user), true),
  );
});
