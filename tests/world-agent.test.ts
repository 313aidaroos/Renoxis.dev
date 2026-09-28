import assert from "node:assert/strict";
import { test } from "node:test";
import { APIXIS_ENTER_CLIENTS } from "../lib/apixis-world.ts";
import {
  WORLD_AGENT_ROLLOUT_AT,
  ensureWorldAgent,
  needsProvision,
  welcomeSeenMetadata,
  worldAgentView,
  type WorldAgentUser,
} from "../lib/renoxis/world-agent.ts";

const NEW = "2026-09-28T07:00:00.000Z";
const OLD = "2026-09-20T07:00:00.000Z";
const base: WorldAgentUser = { id: "u1", email: "new@example.com", created_at: NEW, email_confirmed_at: NEW, app_metadata: { provider: "email" } };

function deps() {
  const calls: unknown[] = [];
  const saved: Record<string, unknown>[] = [];
  return {
    calls,
    saved,
    d: {
      provision: async (input: unknown) => {
        calls.push(input);
        return { ok: true as const, created: true, starterGrantedNow: true, starterIxis: 200, agent: { id: "agent-1", name: "New", status: "active", ixix_balance: 200 }, enterUrl: "https://www.apixis.dev/enter?from=renoxis" };
      },
      saveAppMetadata: async (_id: string, m: Record<string, unknown>) => { saved.push(m); },
      now: () => new Date("2026-09-28T08:00:00.000Z"),
    },
  };
}

test("sdk list matches the 13 Apixis.dev clients", () => {
  assert.equal(APIXIS_ENTER_CLIENTS.length, 13);
  for (const c of ["renoxis", "halaxis", "contentbot", "nurserytoons"]) assert.ok((APIXIS_ENTER_CLIENTS as readonly string[]).includes(c));
  assert.ok(!(APIXIS_ENTER_CLIENTS as readonly string[]).includes("awadbot"));
});

test("only new, verified accounts without the flag are provisioned", () => {
  assert.equal(needsProvision(base), true);
  assert.equal(needsProvision({ ...base, created_at: OLD }), false, "accounts before the rollout are not auto-provisioned");
  assert.equal(needsProvision({ ...base, email_confirmed_at: null }), false, "unverified email waits");
  assert.equal(needsProvision({ ...base, email_confirmed_at: null, app_metadata: { apixis_sub: "sub-1" } }), true, "Apixis ID accounts are Wallet-verified");
  assert.equal(needsProvision({ ...base, app_metadata: { apixis_world_agent_at: NEW } }), false);
  assert.ok(Date.parse(WORLD_AGENT_ROLLOUT_AT) <= Date.parse(NEW));
});

test("provisions once, stores the flag, then never calls again", async () => {
  const { calls, saved, d } = deps();
  const view = await ensureWorldAgent({ ...base, app_metadata: { provider: "email", apixis_sub: "sub-1" } }, d);
  assert.deepEqual(calls, [{ client: "renoxis", email: "new@example.com", apixisSub: "sub-1", displayName: null }]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].provider, "email", "existing app_metadata is kept");
  assert.equal(saved[0].apixis_world_agent_id, "agent-1");
  assert.equal(saved[0].apixis_world_agent_at, "2026-09-28T08:00:00.000Z");
  assert.deepEqual(view, { status: "ready", agentName: "New", showWelcome: true, newAccount: true, dismissed: false });

  const again = await ensureWorldAgent({ ...base, app_metadata: saved[0] }, d);
  assert.equal(calls.length, 1, "flag set: no second provision call");
  assert.equal(again.status, "ready");
});

test("a failed provision leaves the flag unset (retry next load) and still invites", async () => {
  const saved: unknown[] = [];
  const view = await ensureWorldAgent(base, {
    provision: async () => ({ ok: false as const, error: "timeout" }),
    saveAppMetadata: async (_id, m) => { saved.push(m); },
  });
  assert.equal(saved.length, 0);
  assert.equal(view.status, "invite");
  assert.equal(view.showWelcome, true);
  const thrown = await ensureWorldAgent(base, { provision: async () => { throw new Error("boom"); }, saveAppMetadata: async () => {} });
  assert.equal(thrown.status, "invite");
});

test("welcome card hides after enter/dismiss; old accounts are not forced", () => {
  const seen = welcomeSeenMetadata({ apixis_world_agent_at: NEW, provider: "email" }, "enter", new Date(NEW));
  assert.equal(seen.provider, "email");
  assert.equal(seen.apixis_world_welcome_action, "enter");
  assert.equal(worldAgentView({ ...base, app_metadata: seen }).showWelcome, false);
  assert.equal(worldAgentView({ ...base, app_metadata: seen }).dismissed, true);
  assert.equal(worldAgentView({ ...base, created_at: OLD }).showWelcome, false);
});
