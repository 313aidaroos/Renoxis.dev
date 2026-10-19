import Stripe from "stripe";

function priceIdOf(price: unknown) {
  if (typeof price === "string") return price;
  if (price && typeof price === "object" && "id" in price && typeof price.id === "string") return price.id;
  return null;
}

/**
 * A promo subscription bills the promo price until PROMO_END, then the standard price.
 * Called from the webhook after checkout.session.completed. Failures are logged there.
 */
export async function schedulePromoSwitch(
  stripe: Stripe,
  input: { subscriptionId: string; standardPriceId: string; switchAt: string },
) {
  const switchAt = Date.parse(input.switchAt);
  if (!Number.isFinite(switchAt)) return;
  const end = Math.floor(switchAt / 1000);
  const created = await stripe.subscriptionSchedules.create({ from_subscription: input.subscriptionId });
  const phase = created.phases[0];
  if (!phase || end <= phase.start_date) return;
  const items = phase.items.flatMap((item) => {
    const price = priceIdOf(item.price);
    return price ? [{ price, quantity: item.quantity ?? 1 }] : [];
  });
  if (!items.length) return;
  await stripe.subscriptionSchedules.update(created.id, {
    end_behavior: "release",
    proration_behavior: "none",
    phases: [
      {
        items,
        start_date: phase.start_date,
        end_date: end,
        proration_behavior: "none",
      },
      {
        items: [{ price: input.standardPriceId, quantity: 1 }],
        proration_behavior: "none",
      },
    ],
  });
}
