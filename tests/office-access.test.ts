import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { IXIS_SKU, quoteDebit } from "../lib/renoxis/ixis.ts";
import {
  brokerageVisible,
  canManageOffice,
  isMasterAdmin,
  jobPayer,
} from "../lib/renoxis/office-access.ts";

const office = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";

test("a brokerage member cannot open another brokerage", () => {
  assert.equal(
    brokerageVisible({ requestedId: other, memberIds: [office], masterAdmin: false }),
    false,
  );
  assert.equal(
    brokerageVisible({ requestedId: office, memberIds: [office], masterAdmin: false }),
    true,
  );
  assert.equal(
    brokerageVisible({ requestedId: other, memberIds: [], masterAdmin: false }),
    false,
  );
});

test("confirmed master admins can open every brokerage", () => {
  assert.equal(
    isMasterAdmin({ email: "awad@apixis.dev", email_confirmed_at: "2026-01-01T00:00:00Z" }),
    true,
  );
  assert.equal(
    isMasterAdmin({
      email: "alaidaroosawad@gmail.com",
      email_confirmed_at: "2026-01-01T00:00:00Z",
    }),
    true,
  );
  assert.equal(
    isMasterAdmin({ email: "awad@apixis.dev", email_confirmed_at: null }),
    false,
  );
  assert.equal(
    isMasterAdmin({ email: "agent@harbor.test", email_confirmed_at: "2026-01-01T00:00:00Z" }),
    false,
  );
  assert.equal(
    brokerageVisible({ requestedId: other, memberIds: [office], masterAdmin: true }),
    true,
  );
  assert.equal(
    canManageOffice({ role: null, masterAdmin: true, action: "spend" }),
    true,
  );
  assert.equal(
    canManageOffice({ role: null, masterAdmin: true, action: "invite", invitee: "agent" }),
    true,
  );
  assert.equal(
    canManageOffice({
      role: null,
      masterAdmin: true,
      action: "remove",
      targetRole: "agent",
      targetIsSelf: true,
    }),
    false,
  );
});

test("only an owner or manager can invite, remove, and view spend", () => {
  assert.equal(canManageOffice({ role: "agent", masterAdmin: false, action: "spend" }), false);
  assert.equal(canManageOffice({ role: "assistant", masterAdmin: false, action: "spend" }), false);
  assert.equal(
    canManageOffice({ role: "agent", masterAdmin: false, action: "invite", invitee: "agent" }),
    false,
  );
  assert.equal(canManageOffice({ role: "agent", masterAdmin: false, action: "rename" }), false);
  assert.equal(
    canManageOffice({ role: "agent", masterAdmin: false, action: "remove", targetRole: "agent" }),
    false,
  );
  assert.equal(canManageOffice({ role: "broker", masterAdmin: false, action: "spend" }), true);
  assert.equal(canManageOffice({ role: "owner", masterAdmin: false, action: "spend" }), true);
  assert.equal(
    canManageOffice({ role: "broker", masterAdmin: false, action: "invite", invitee: "agent" }),
    true,
  );
  assert.equal(
    canManageOffice({ role: "broker", masterAdmin: false, action: "invite", invitee: "owner" }),
    false,
  );
  assert.equal(
    canManageOffice({ role: "broker", masterAdmin: false, action: "remove", targetRole: "agent" }),
    true,
  );
  assert.equal(
    canManageOffice({ role: "broker", masterAdmin: false, action: "remove", targetRole: "owner" }),
    false,
  );
  assert.equal(canManageOffice({ role: "broker", masterAdmin: false, action: "rename" }), false);
  assert.equal(canManageOffice({ role: "owner", masterAdmin: false, action: "rename" }), true);
  assert.equal(
    canManageOffice({
      role: "owner",
      masterAdmin: false,
      action: "remove",
      targetRole: "agent",
      targetIsSelf: true,
    }),
    false,
  );
});

test("Cixy jobs inside a brokerage bill the office Wallet, not the agent", () => {
  const billed = jobPayer({
    inBrokerage: true,
    actorPayer: "agent@harbor.test",
    officeWalletOwner: "owner-apixis-sub",
  });
  assert.equal(billed.kind, "office");
  if (billed.kind === "office") {
    assert.equal(billed.payer, "owner-apixis-sub");
    assert.notEqual(billed.payer, "agent@harbor.test");
  }
  const solo = jobPayer({
    inBrokerage: false,
    actorPayer: "solo@harbor.test",
    officeWalletOwner: null,
  });
  assert.deepEqual(solo, { kind: "personal", payer: "solo@harbor.test" });
  const blocked = jobPayer({
    inBrokerage: true,
    actorPayer: "agent@harbor.test",
    officeWalletOwner: null,
  });
  assert.equal(blocked.kind, "blocked");
  if (blocked.kind === "blocked") assert.doesNotMatch(blocked.reason, /agent@harbor.test/);
  assert.equal(IXIS_SKU.email_draft, 50);
  assert.equal(IXIS_SKU.offer_letter, 100);
  assert.equal(IXIS_SKU.property_lookup, 25);
  const short = quoteDebit(10, "property_lookup");
  assert.equal(short.ok, false);
  if (!short.ok) assert.equal(short.shortfall, 15);
});

test("paid brokerage routes bill the office and keep offices apart", () => {
  const actions = readFileSync(
    new URL("../app/api/brokerage/actions/route.ts", import.meta.url),
    "utf8",
  );
  const draft = readFileSync(new URL("../app/api/cixy/draft/route.ts", import.meta.url), "utf8");
  const members = readFileSync(
    new URL("../app/api/brokerage/members/route.ts", import.meta.url),
    "utf8",
  );
  const desk = readFileSync(new URL("../app/api/brokerage/route.ts", import.meta.url), "utf8");
  assert.match(actions, /chargeOfficeJob/);
  assert.doesNotMatch(actions, /chargeFromWallet\(/);
  assert.match(draft, /chargeOfficeJob/);
  assert.match(members, /guardOffice/);
  assert.match(desk, /brokerageVisible/);
  assert.match(desk, /canViewSpend/);
  const migration = readFileSync(
    new URL("../supabase/migrations/20261006120000_brokerage_office_wallet.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /when 'property_lookup' then 25/);
  assert.match(migration, /member_role\(brokerage_id\) = 'broker'/);
});
