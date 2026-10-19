import Stripe from "stripe";

export function stripeServer() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-09-30.endive" });
}

export function appOrigin(request: Request) {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured?.trim()) return configured.trim().replace(/\/$/, "");
  return new URL(request.url).origin;
}
