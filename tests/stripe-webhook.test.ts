import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";
import { isSeatCurrent } from "../lib/renoxis/billing.ts";
import type { SeatGrant, StripeSeatStore } from "../lib/renoxis/stripe-seat.ts";
import { handleStripeWebhook, type StripeEventLike } from "../lib/renoxis/stripe-webhook.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const SECRET = "whsec_test_secret";
const NOW = new Date("2026-10-19T12:00:00.000Z");
const PERIOD_END = 1893456000;
const stripe = new Stripe("sk_test_renoxis_webhook", { apiVersion: "2026-09-30.endive" });

function memoryStore() {
  const events = new Set<string>();
  const seats = new Map<string, SeatGrant>();
  let writes = 0;
  const store: StripeSeatStore = {
    async claimEvent(eventId) {
      if (events.has(eventId)) return false;
      events.add(eventId);
      return true;
    },
    async releaseEvent(eventId) {
      events.delete(eventId);
    },
    async readSeat(userId) {
      return seats.get(userId) ?? null;
    },
    async writeSeat(seat) {
      writes += 1;
      seats.set(seat.userId, seat);
    },
    async findUserBySubscription(subscriptionId) {
      for (const seat of seats.values()) {
        if (seat.stripeSubscriptionId === subscriptionId) return seat.userId;
      }
      return null;
    },
  };
  return { store, seats, writes: () => writes, events };
}

function envelope(id: string, type: string, object: Record<string, unknown>) {
  return {
    id,
    object: "event",
    api_version: "2026-09-30.endive",
    created: 1760000000,
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type,
    data: { object },
  };
}

function signed(event: ReturnType<typeof envelope>, secret = SECRET) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("https://renoxis.dev/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}

function deps(store: StripeSeatStore, secret = SECRET) {
  return {
    secret,
    now: NOW,
    store,
    constructEvent: (raw: string, signature: string) =>
      stripe.webhooks.constructEvent(raw, signature, secret) as unknown as StripeEventLike,
  };
}

test("webhook rejects a bad signature and does not touch the seat", async () => {
  const memory = memoryStore();
  const event = envelope("evt_bad", "checkout.session.completed", {
    id: "cs_bad",
    mode: "payment",
    payment_status: "paid",
    metadata: { product: "renoxis", intent: "activate", user_id: USER },
  });
  const request = signed(event);
  request.headers.set("stripe-signature", "t=1,v1=deadbeef");
  const result = await handleStripeWebhook(request, deps(memory.store));
  assert.equal(result.status, 400);
  assert.equal(result.body.error, "Invalid Stripe signature.");
  assert.equal(memory.writes(), 0);
  assert.equal(memory.events.size, 0);
  assert.equal(memory.seats.size, 0);
});

test("webhook grants the start fee and the monthly period", async () => {
  const memory = memoryStore();
  const activate = envelope("evt_activate", "checkout.session.completed", {
    id: "cs_activate",
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi_start",
    customer: "cus_1",
    client_reference_id: USER,
    metadata: { product: "renoxis", intent: "activate", user_id: USER },
  });
  const monthly = envelope("evt_monthly", "checkout.session.completed", {
    id: "cs_monthly",
    mode: "subscription",
    payment_status: "paid",
    customer: "cus_1",
    subscription: {
      id: "sub_1",
      object: "subscription",
      status: "active",
      items: { data: [{ current_period_end: PERIOD_END }] },
    },
    metadata: {
      product: "renoxis",
      intent: "monthly",
      user_id: USER,
      switch_at: "2027-02-01T06:00:00.000Z",
      switch_price: "price_standard",
    },
  });
  const other = envelope("evt_other", "checkout.session.completed", {
    id: "cs_other",
    mode: "payment",
    payment_status: "paid",
    metadata: { product: "launchixis", intent: "activate", user_id: USER },
  });
  const switches: string[] = [];
  const base = deps(memory.store);
  assert.equal((await handleStripeWebhook(signed(activate), base)).status, 200);
  const scheduled = await handleStripeWebhook(signed(monthly), {
    ...base,
    scheduleSwitch: async (input) => {
      switches.push(input.standardPriceId);
    },
  });
  assert.equal(scheduled.body.granted, "monthly");
  assert.deepEqual(switches, ["price_standard"]);
  assert.equal((await handleStripeWebhook(signed(other), base)).body.ignored, true);

  const seat = memory.seats.get(USER);
  assert.ok(seat);
  assert.equal(seat.source, "card");
  assert.equal(seat.activatedAt, NOW.toISOString());
  assert.equal(seat.seatPeriodEnd, new Date(PERIOD_END * 1000).toISOString());
  assert.equal(seat.lastReceiptId, "cs_monthly");
  assert.equal(seat.stripeSubscriptionId, "sub_1");
  assert.equal(
    isSeatCurrent(
      { activatedAt: seat.activatedAt, seatPeriodEnd: seat.seatPeriodEnd, source: "card" },
      NOW.getTime(),
    ),
    true,
  );
  assert.equal(memory.writes(), 2);
});

test("webhook is idempotent on the Stripe event id", async () => {
  const memory = memoryStore();
  const event = envelope("evt_once", "checkout.session.completed", {
    id: "cs_once",
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi_once",
    metadata: { product: "renoxis", intent: "activate", user_id: USER },
  });
  const first = await handleStripeWebhook(signed(event), deps(memory.store));
  const second = await handleStripeWebhook(signed(event), deps(memory.store));
  assert.equal(first.body.granted, "activate");
  assert.equal(second.status, 200);
  assert.equal(second.body.duplicate, true);
  assert.equal(memory.writes(), 1);
  assert.equal(memory.seats.get(USER)?.activatedAt, NOW.toISOString());
});

test("webhook revokes the monthly seat on cancel and on a failed invoice", async () => {
  const memory = memoryStore();
  const base = deps(memory.store);
  await handleStripeWebhook(
    signed(
      envelope("evt_open", "customer.subscription.updated", {
        id: "sub_9",
        object: "subscription",
        status: "active",
        customer: "cus_9",
        metadata: { product: "renoxis", user_id: USER },
        items: { data: [{ current_period_end: PERIOD_END }] },
      }),
    ),
    base,
  );
  const open = memory.seats.get(USER);
  assert.ok(open?.activatedAt === null);
  assert.equal(
    isSeatCurrent(
      { activatedAt: "2026-01-01T00:00:00.000Z", seatPeriodEnd: open?.seatPeriodEnd ?? null, source: "card" },
      NOW.getTime(),
    ),
    true,
  );

  const canceled = await handleStripeWebhook(
    signed(
      envelope("evt_cancel", "customer.subscription.deleted", {
        id: "sub_9",
        object: "subscription",
        status: "canceled",
        metadata: { product: "renoxis", user_id: USER },
        items: { data: [{ current_period_end: PERIOD_END }] },
      }),
    ),
    base,
  );
  assert.equal(canceled.body.revoked, true);
  const closed = memory.seats.get(USER);
  assert.equal(closed?.seatPeriodEnd, NOW.toISOString());
  assert.equal(
    isSeatCurrent(
      { activatedAt: "2026-01-01T00:00:00.000Z", seatPeriodEnd: closed?.seatPeriodEnd ?? null, source: "card" },
      NOW.getTime(),
    ),
    false,
  );

  await memory.store.writeSeat({
    ...closed!,
    seatPeriodEnd: new Date(PERIOD_END * 1000).toISOString(),
  });
  const failed = await handleStripeWebhook(
    signed(
      envelope("evt_fail", "invoice.payment_failed", {
        id: "in_fail",
        metadata: { product: "renoxis", user_id: USER },
        parent: { subscription_details: { subscription: "sub_9", metadata: { product: "renoxis", user_id: USER } } },
      }),
    ),
    base,
  );
  assert.equal(failed.body.revoked, true);
  assert.equal(memory.seats.get(USER)?.seatPeriodEnd, NOW.toISOString());
  assert.equal(memory.seats.get(USER)?.activatedAt, null);
});
