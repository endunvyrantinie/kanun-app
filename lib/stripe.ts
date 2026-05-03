// Server-side Stripe client. Never import this from a client component.
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // No apiVersion pin — uses the account's default. Safe across SDK upgrades.
  _stripe = new Stripe(key);
  return _stripe;
}
