import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Payment-safety contract of the shared Wallet client, exercised against a fake Wallet:
 *  - capture fails after provision → retried once; the hold is released and ONLY THEN (not charged)
 *    unprovision runs; caller sees the error
 *  - capture response lost but the Wallet did capture (release → 409 already_captured) → ok, access kept
 *  - provision fails → release only; unprovision never runs
 *  - same idempotency key twice → Wallet dedupes (one reservation), so a retried click cannot double-charge
 */
// The SDK reads its env at module load. Set it, then import — and nothing else in the suite may unset it.
process.env.WALLET_API_KEY = "test-key-0123456789-abcdefghij";
process.env.APIXIS_WALLET_API_URL = "https://wallet.test";
const { redeem } = await import("../lib/apixis-wallet.ts");

type Call = { path: string; body?: string };
function fakeWallet(opts: { captureFails?: boolean; alreadyCaptured?: boolean } = {}) {
  const calls: Call[] = [];
  const reservations = new Map<string, string>(); // idempotencyKey → reservationId
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    const path = new URL(url).pathname;
    const body = init?.body ? String(init.body) : undefined;
    calls.push({ path, body });
    const json = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (path.endsWith("/reservations")) {
      const key = JSON.parse(body ?? "{}").idempotencyKey as string;
      const id = reservations.get(key) ?? `res-${reservations.size + 1}`;
      reservations.set(key, id);
      return json(200, { reservationId: id, ixis: 5000, xp: 5000, status: "held" });
    }
    if (path.endsWith("/capture")) return opts.captureFails ? json(500, { error: "ledger unavailable" }) : json(200, { receiptId: "rcpt-1" });
    if (path.endsWith("/release")) {
      return opts.alreadyCaptured ? json(409, { error: "already captured", code: "already_captured" }) : json(200, { released: true });
    }
    if (/\/reservations\/[^/]+$/.test(path)) return json(200, { status: "captured", receiptId: "rcpt-late" });
    return json(404, { error: "nope" });
  }) as typeof fetch;
  return { calls, reservations };
}

test("capture failure after provision → retry, release, then unprovision; error surfaces", async () => {
  const w = fakeWallet({ captureFails: true });
  const events: string[] = [];
  await assert.rejects(
    redeem({
      ownerEmail: "a@example.com", productKey: "renoxis.activate", idempotencyKey: "rx-activate-abc-attempt1",
      provision: async () => { events.push("provision"); return { seat: true }; },
      unprovision: async () => { events.push("unprovision"); },
    }),
  );
  assert.deepEqual(events, ["provision", "unprovision"]);
  const paths = w.calls.map((c) => c.path.split("/").pop());
  assert.deepEqual(paths, ["reservations", "capture", "capture", "release"]);
});

test("lost capture response (Wallet already captured) → ok, access kept, no unprovision", async () => {
  const w = fakeWallet({ captureFails: true, alreadyCaptured: true });
  const events: string[] = [];
  const out = await redeem({
    owner: "a@example.com", productKey: "renoxis.activate", idempotencyKey: "rx-activate-abc-attempt9",
    provision: async () => { events.push("provision"); return { seat: true }; },
    unprovision: async () => { events.push("unprovision"); },
  });
  assert.equal(out.ok, true);
  assert.deepEqual(events, ["provision"]);
  assert.ok(w.calls.some((c) => c.path.endsWith("/release")));
});

test("provision failure → release only, unprovision never runs", async () => {
  const w = fakeWallet();
  const events: string[] = [];
  await assert.rejects(
    redeem({
      ownerEmail: "a@example.com", productKey: "renoxis.activate", idempotencyKey: "rx-activate-abc-attempt2",
      provision: async () => { events.push("provision"); throw new Error("db down"); },
      unprovision: async () => { events.push("unprovision"); },
    }),
    /db down/,
  );
  assert.deepEqual(events, ["provision"]);
  assert.deepEqual(w.calls.map((c) => c.path.split("/").pop()), ["reservations", "release"]);
});

test("same attempt retried reuses the idempotency key → one reservation, not two", async () => {
  const w = fakeWallet();
  const run = () => redeem({ ownerEmail: "a@example.com", productKey: "renoxis.activate", idempotencyKey: "rx-activate-abc-attempt3", provision: async () => ({}) });
  await run(); await run();
  assert.equal(w.reservations.size, 1, "Wallet saw one reservation for the same click");
  const keys = w.calls.filter((c) => c.path.endsWith("/reservations")).map((c) => JSON.parse(c.body!).idempotencyKey);
  assert.deepEqual(keys, ["rx-activate-abc-attempt3", "rx-activate-abc-attempt3"]);
});

test("a NEW click gets a new key → never locked out by an earlier released hold", async () => {
  const w = fakeWallet();
  await redeem({ ownerEmail: "a@example.com", productKey: "renoxis.activate", idempotencyKey: "rx-activate-abc-clickA", provision: async () => ({}) });
  await redeem({ ownerEmail: "a@example.com", productKey: "renoxis.activate", idempotencyKey: "rx-activate-abc-clickB", provision: async () => ({}) });
  assert.equal(w.reservations.size, 2);
});
