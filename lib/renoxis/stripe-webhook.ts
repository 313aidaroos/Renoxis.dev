/**
 * Stripe webhook for Renoxis seats.
 * Verifies the signature, then grants or revokes renoxis_entitlements.
 * Idempotent on the Stripe event id. Ignores events that are not product=renoxis
 * (the live Apixis.dev account is shared). Does not grant Ixis.
 */

import { addOneUtcMonth } from "./pricing.ts";
import { laterIso, revokeIso, type SeatGrant, type StripeSeatStore } from "./stripe-seat.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCT = "renoxis";

export type WebhookResult = { status: number; body: Record<string, unknown> };

export type StripeEventLike = {
  id: string;
  type: string;
  data: { object: unknown };
};

export type WebhookDeps = {
  secret: string | undefined;
  constructEvent: (raw: string, signature: string) => StripeEventLike;
  store: StripeSeatStore;
  now?: Date;
  loadSubscription?: (subscriptionId: string) => Promise<Record<string, unknown> | null>;
  scheduleSwitch?: (input: { subscriptionId: string; standardPriceId: string; switchAt: string }) => Promise<void>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringOf(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function idOf(value: unknown) {
  const direct = stringOf(value);
  if (direct) return direct;
  return stringOf(asRecord(value)?.id);
}

function metaOf(value: unknown) {
  const record = asRecord(value);
  const out: Record<string, string> = {};
  if (!record) return out;
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === "string") out[key] = entry;
  }
  return out;
}

function userIdOf(metas: Record<string, string>[], fallback?: unknown) {
  for (const meta of metas) {
    if (meta.user_id && UUID.test(meta.user_id)) return meta.user_id;
  }
  const extra = stringOf(fallback);
  return extra && UUID.test(extra) ? extra : null;
}

function productOf(metas: Record<string, string>[]) {
  for (const meta of metas) {
    if (meta.product) return meta.product;
  }
  return null;
}

function unixIso(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString();
}

function periodEndOf(subscription: Record<string, unknown> | null) {
  if (!subscription) return null;
  const direct = unixIso(subscription.current_period_end);
  if (direct) return direct;
  const items = asRecord(subscription.items);
  const data = Array.isArray(items?.data) ? items.data : [];
  for (const item of data) {
    const end = unixIso(asRecord(item)?.current_period_end);
    if (end) return end;
  }
  return null;
}

async function subscriptionRecord(
  value: unknown,
  load: WebhookDeps["loadSubscription"],
) {
  const record = asRecord(value);
  if (record && (record.object === "subscription" || record.items || record.status || record.current_period_end)) {
    return record;
  }
  const id = typeof value === "string" ? value : idOf(value);
  if (!id || !load) return null;
  return load(id);
}

function invoiceMetas(invoice: Record<string, unknown>) {
  const parent = asRecord(invoice.parent);
  const details = asRecord(parent?.subscription_details) ?? asRecord(invoice.subscription_details);
  const lines = asRecord(invoice.lines);
  const first = Array.isArray(lines?.data) ? asRecord(lines.data[0]) : null;
  return {
    metas: [metaOf(invoice.metadata), metaOf(details?.metadata), metaOf(first?.metadata)],
    subscriptionId: idOf(details?.subscription) ?? idOf(invoice.subscription),
  };
}

async function remember(
  store: StripeSeatStore,
  existing: SeatGrant | null,
  next: SeatGrant,
) {
  await store.writeSeat({
    userId: next.userId,
    activatedAt: next.activatedAt,
    seatPeriodEnd: next.seatPeriodEnd,
    source: next.source,
    lastReceiptId: next.lastReceiptId ?? existing?.lastReceiptId ?? null,
    stripeCustomerId: next.stripeCustomerId ?? existing?.stripeCustomerId ?? null,
    stripeSubscriptionId: next.stripeSubscriptionId ?? existing?.stripeSubscriptionId ?? null,
  });
}

async function grantActivation(
  store: StripeSeatStore,
  userId: string,
  receiptId: string | null,
  customerId: string | null,
  now: Date,
) {
  const existing = await store.readSeat(userId);
  await remember(store, existing, {
    userId,
    activatedAt: existing?.activatedAt ?? now.toISOString(),
    seatPeriodEnd: existing?.seatPeriodEnd ?? null,
    source: "card",
    lastReceiptId: receiptId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
  });
}

async function grantPeriod(
  store: StripeSeatStore,
  userId: string,
  periodEnd: string,
  receiptId: string | null,
  customerId: string | null,
  subscriptionId: string | null,
) {
  const existing = await store.readSeat(userId);
  await remember(store, existing, {
    userId,
    activatedAt: existing?.activatedAt ?? null,
    seatPeriodEnd: laterIso(existing?.seatPeriodEnd ?? null, periodEnd),
    source: "card",
    lastReceiptId: receiptId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
}

async function revokeSeat(store: StripeSeatStore, userId: string, at: Date) {
  const existing = await store.readSeat(userId);
  if (!existing) return;
  await remember(store, existing, {
    ...existing,
    seatPeriodEnd: revokeIso(existing.seatPeriodEnd, at),
  });
}

async function resolveUser(
  store: StripeSeatStore,
  metas: Record<string, string>[],
  fallback: unknown,
  subscriptionId: string | null,
) {
  const direct = userIdOf(metas, fallback);
  if (direct) return direct;
  if (subscriptionId) return store.findUserBySubscription(subscriptionId);
  return null;
}

export async function handleStripeWebhook(request: Request, deps: WebhookDeps): Promise<WebhookResult> {
  const secret = deps.secret?.trim() || "";
  if (!secret) return { status: 503, body: { error: "Card webhook is not configured." } };
  const signature = request.headers.get("stripe-signature");
  if (!signature) return { status: 400, body: { error: "Invalid Stripe signature." } };
  const raw = await request.text();
  let event: StripeEventLike;
  try {
    event = deps.constructEvent(raw, signature);
  } catch {
    return { status: 400, body: { error: "Invalid Stripe signature." } };
  }
  if (!event?.id || !event.type) return { status: 400, body: { error: "Invalid Stripe event." } };

  const claimed = await deps.store.claimEvent(event.id, event.type);
  if (!claimed) return { status: 200, body: { received: true, duplicate: true } };

  const now = deps.now ?? new Date();
  try {
    const outcome = await applyEvent(event, deps, now);
    return { status: 200, body: { received: true, ...outcome } };
  } catch (error) {
    await deps.store.releaseEvent(event.id).catch(() => undefined);
    console.error("stripe webhook failed", event.type, event.id, error instanceof Error ? error.name : "error");
    return { status: 500, body: { error: "Could not update the seat." } };
  }
}

async function applyEvent(event: StripeEventLike, deps: WebhookDeps, now: Date) {
  if (event.type === "checkout.session.completed") return grantFromSession(event, deps, now);
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    return applySubscription(event, deps, now);
  }
  if (event.type === "invoice.payment_failed") return applyPaymentFailed(event, deps, now);
  return { ignored: true };
}

async function grantFromSession(event: StripeEventLike, deps: WebhookDeps, now: Date) {
  const session = asRecord(event.data.object);
  if (!session) return { ignored: true };
  const metas = [metaOf(session.metadata)];
  if (productOf(metas) !== PRODUCT) return { ignored: true };
  if (session.payment_status === "unpaid") return { ignored: true, pending: true };

  const intent = metas[0]?.intent === "monthly" || session.mode === "subscription" ? "monthly" : "activate";
  const userId = await resolveUser(deps.store, metas, session.client_reference_id, idOf(session.subscription));
  if (!userId) throw new Error("Missing seat owner");

  const customerId = idOf(session.customer);
  const receiptId = idOf(session.payment_intent) ?? idOf(session.invoice) ?? stringOf(session.id);
  if (intent === "activate" && session.mode !== "subscription") {
    await grantActivation(deps.store, userId, receiptId, customerId, now);
    return { granted: "activate" };
  }

  const subscriptionId = idOf(session.subscription);
  const subscription = await subscriptionRecord(session.subscription, deps.loadSubscription);
  const periodEnd = periodEndOf(subscription) ?? addOneUtcMonth(now).toISOString();
  await grantPeriod(deps.store, userId, periodEnd, receiptId, customerId, subscriptionId);
  await maybeScheduleSwitch(deps, metas[0], subscriptionId, now);
  return { granted: "monthly" };
}

async function maybeScheduleSwitch(
  deps: WebhookDeps,
  meta: Record<string, string> | undefined,
  subscriptionId: string | null,
  now: Date,
) {
  const switchAt = meta?.switch_at;
  const switchPrice = meta?.switch_price;
  if (!deps.scheduleSwitch || !subscriptionId || !switchAt || !switchPrice) return;
  if (Date.parse(switchAt) <= now.getTime()) return;
  try {
    await deps.scheduleSwitch({ subscriptionId, standardPriceId: switchPrice, switchAt });
  } catch {
    console.error("stripe promo switch failed", subscriptionId);
  }
}

async function applySubscription(event: StripeEventLike, deps: WebhookDeps, now: Date) {
  const subscription = asRecord(event.data.object);
  if (!subscription) return { ignored: true };
  const metas = [metaOf(subscription.metadata)];
  if (productOf(metas) !== PRODUCT) return { ignored: true };
  const subscriptionId = stringOf(subscription.id);
  const userId = await resolveUser(deps.store, metas, null, subscriptionId);
  if (!userId) throw new Error("Missing seat owner");
  const status = stringOf(subscription.status) || "";
  const customerId = idOf(subscription.customer);
  if (event.type === "customer.subscription.deleted" || status === "canceled" || status === "unpaid" || status === "incomplete_expired" || status === "past_due" || status === "paused") {
    await revokeSeat(deps.store, userId, now);
    return { revoked: true };
  }
  if (status === "active" || status === "trialing") {
    const periodEnd = periodEndOf(subscription);
    if (!periodEnd) throw new Error("Missing period end");
    await grantPeriod(deps.store, userId, periodEnd, subscriptionId, customerId, subscriptionId);
    return { granted: "monthly" };
  }
  return { ignored: true };
}

async function applyPaymentFailed(event: StripeEventLike, deps: WebhookDeps, now: Date) {
  const invoice = asRecord(event.data.object);
  if (!invoice) return { ignored: true };
  const { metas, subscriptionId } = invoiceMetas(invoice);
  if (productOf(metas) !== PRODUCT) return { ignored: true };
  const userId = await resolveUser(deps.store, metas, null, subscriptionId);
  if (!userId) throw new Error("Missing seat owner");
  await revokeSeat(deps.store, userId, now);
  return { revoked: true };
}
