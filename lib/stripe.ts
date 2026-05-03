// Server-side Stripe client. Never import this from a client component.
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, {
    // Pin a known API version so behaviour doesn't change underneath us
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });
  return _stripe;
}
