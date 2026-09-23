import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  canReadNote,
  canReadRecord,
  type Viewer,
} from "../lib/renoxis/access.ts";
import { CIXY_SYSTEM_PROMPT } from "../lib/renoxis/cixy-prompts.ts";
import {
  IXIS_SKU,
  PLATFORM_COMMISSION_BPS,
  platformCommission,
  quoteDebit,
} from "../lib/renoxis/ixis.ts";
import { decideSend, LIVE_SEND_ENABLED } from "../lib/renoxis/outbox.ts";

const office = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const agent: Viewer = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  brokerageId: office,
  role: "agent",
};
const peer: Viewer = {
  userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  brokerageId: office,
  role: "agent",
};
const owner: Viewer = {
  userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  brokerageId: office,
  role: "owner",
};

test("firm ledger debits published SKUs and rejects a short balance", () => {
  assert.deepEqual(
    { ...IXIS_SKU },
    { property_lookup: 0, track_contact: 0, email_draft: 50, offer_letter: 100 },
  );
  // Property "lookup" saves typed facts and queries no data source → free until it does.
  assert.deepEqual(quoteDebit(100, "property_lookup"), {
    ok: true,
    sku: "property_lookup",
    cost: 0,
    balance: 100,
    next: 100,
  });
  assert.deepEqual(quoteDebit(0, "track_contact"), {
    ok: true,
    sku: "track_contact",
    cost: 0,
    balance: 0,
    next: 0,
  });
  const short = quoteDebit(40, "email_draft");
  assert.equal(short.ok, false);
  if (!short.ok) assert.equal(short.shortfall, 10);
  assert.equal(quoteDebit(100, "offer_letter").ok, true);
  assert.throws(() => quoteDebit(-1, "property_lookup"));
});

test("closed deal fee keeps a 5 percent pending cut", () => {
  assert.equal(PLATFORM_COMMISSION_BPS, 500);
  assert.deepEqual(platformCommission(2500), {
    bps: 500,
    feeBase: 2500,
    amount: 125,
    status: "pending",
  });
  assert.equal(platformCommission(0).amount, 0);
  assert.equal(platformCommission(10.01).amount, 0.5);
  assert.throws(() => platformCommission(-1));
});

test("peers cannot read another book or an unshared note", () => {
  const book = {
    brokerageId: office,
    ownerAgentId: agent.userId,
    visibility: "book" as const,
    authorId: agent.userId,
  };
  assert.equal(canReadRecord(agent, book), true);
  assert.equal(canReadRecord(peer, book), false);
  assert.equal(canReadRecord(owner, book), true);
  assert.equal(
    canReadRecord(peer, { ...book, visibility: "firm" }),
    true,
  );
  assert.equal(
    canReadRecord(peer, {
      brokerageId: other,
      ownerAgentId: null,
      visibility: "firm",
      authorId: agent.userId,
    }),
    false,
  );
  const note = { brokerageId: office, authorId: agent.userId, shared: false };
  assert.equal(canReadNote(agent, note), true);
  assert.equal(canReadNote(peer, note), false);
  assert.equal(canReadNote(owner, note), true);
  assert.equal(canReadNote(peer, { ...note, shared: true }), true);
  assert.equal(canReadNote(agent, { ...note, brokerageId: other }), false);
});

test("send stays blocked until Approve, and Approve still does not send", () => {
  assert.equal(LIVE_SEND_ENABLED, false);
  const blocked = decideSend({ approved: false, liveSendEnabled: true });
  assert.equal(blocked.sent, false);
  assert.equal(blocked.status, "pending_approve");
  const approved = decideSend({ approved: true });
  assert.equal(approved.sent, false);
  assert.equal(approved.status, "approved");
  assert.equal(approved.provider, "not_configured");
  const forced = decideSend({ approved: true, liveSendEnabled: true });
  assert.equal(forced.sent, false);
});

test("sql sketches the same isolation, prices, and approve gate", () => {
  const sql = readFileSync(new URL("../supabase/brokerage.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/);
  assert.match(sql, /renoxis_private\.can_read_record/);
  assert.match(sql, /renoxis_private\.can_read_note/);
  assert.match(sql, /when 'property_lookup' then 0/);
  assert.match(sql, /when 'track_contact' then 0/);
  assert.match(sql, /when 'email_draft' then 50/);
  assert.match(sql, /when 'offer_letter' then 100/);
  assert.match(sql, /bps = 500/);
  assert.match(sql, /status in \('draft', 'pending_approve', 'approved', 'rejected'\)/);
  assert.doesNotMatch(sql, /'sent'/);
  const google = readFileSync(
    new URL("../app/api/connections/google/start/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(google, /gmail\.readonly/);
  assert.doesNotMatch(google, /gmail\.send/);
  assert.match(CIXY_SYSTEM_PROMPT, /TEAM DESK/);
  assert.match(CIXY_SYSTEM_PROMPT, /Do not invent comps/);
  assert.match(CIXY_SYSTEM_PROMPT, /charge Ixis/);
});
