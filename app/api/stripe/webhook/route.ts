import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { schedulePromoSwitch } from "@/lib/renoxis/stripe-schedule";
import { supabaseStripeSeatStore } from "@/lib/renoxis/stripe-seat-store";
import { stripeServer } from "@/lib/renoxis/stripe-client";
import { handleStripeWebhook } from "@/lib/renoxis/stripe-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = stripeServer();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Card webhook is not configured." }, { status: 503 });
  }
  let store;
  try {
    store = supabaseStripeSeatStore(createAdminClient());
  } catch {
    return NextResponse.json({ error: "Seat records are not configured." }, { status: 503 });
  }
  const result = await handleStripeWebhook(request, {
    secret,
    constructEvent: (raw, signature) => stripe.webhooks.constructEvent(raw, signature, secret),
    store,
    loadSubscription: async (subscriptionId) => {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription as unknown as Record<string, unknown>;
    },
    scheduleSwitch: (input) => schedulePromoSwitch(stripe, input),
  });
  return NextResponse.json(result.body, { status: result.status });
}
