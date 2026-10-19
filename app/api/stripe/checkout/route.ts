import { apixisSubOf } from "@/lib/apixis-login";
import { failure, json, session as requireSession } from "@/lib/renoxis/http";
import { appOrigin, stripeServer } from "@/lib/renoxis/stripe-client";
import {
  cardCheckoutConfigured,
  checkoutSessionParams,
  integrationIdentifier,
  priceMatchesSelection,
  selectCardPrice,
  type CardIntent,
} from "@/lib/renoxis/stripe-prices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGN_IN = "/login?next=%2Fdashboard%3Fboard%3DConnections";

export async function POST(request: Request) {
  try {
    const { user } = await requireSession(request);
    if (!user.email || !apixisSubOf(user)) {
      return json({ error: "Sign in with Apixis ID to pay by card.", redirect: SIGN_IN }, 401);
    }
    let intent: CardIntent | "" = "";
    try {
      const body = await request.json();
      intent = body?.intent === "activate" || body?.intent === "monthly" ? body.intent : "";
    } catch {
      intent = "";
    }
    if (!intent) return json({ error: "Choose the start fee or the monthly plan." }, 400);

    const selection = selectCardPrice(intent);
    const stripe = stripeServer();
    if (!cardCheckoutConfigured() || !stripe || !selection.priceId) {
      return json({ error: "Card checkout is not configured. Nothing was charged." }, 503);
    }

    const price = await stripe.prices.retrieve(selection.priceId);
    if (
      !priceMatchesSelection(
        {
          unit_amount: price.unit_amount,
          currency: price.currency,
          type: price.type,
          recurring: price.recurring ? { interval: price.recurring.interval } : null,
        },
        selection,
      )
    ) {
      return json({ error: "This card price does not match the Renoxis price. Nothing was charged." }, 409);
    }

    const checkout = await stripe.checkout.sessions.create(
      checkoutSessionParams({
        selection,
        userId: user.id,
        email: user.email,
        origin: appOrigin(request),
        integrationIdentifier: integrationIdentifier(),
      }),
    );
    if (!checkout.url?.startsWith("https://checkout.stripe.com/")) {
      return json({ error: "Card checkout did not start. Nothing was charged." }, 502);
    }
    return json({ url: checkout.url });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    if (code) console.error("checkout session failed", code);
    if (error instanceof Error && (error.message === "AUTH" || error.message === "ORIGIN")) return failure(error);
    return json({ error: "Card checkout did not start. Nothing was charged." }, 502);
  }
}
