// POST /api/checkout
// Creates a Stripe Checkout Session for a one-time tier upgrade and
// returns the redirect URL. The user's Firebase UID and chosen tier
// are stored in the session metadata so the webhook can grant the upgrade.

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type { Tier } from "@/lib/types";

const PRICE_IDS: Record<Exclude<Tier, "free">, string | undefined> = {
  basic: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
  extended: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTENDED,
  full: process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL,
};

export async function POST(req: NextRequest) {
  try {
    const { tier, uid, email } = (await req.json()) as {
      tier: Exclude<Tier, "free">;
      uid: string;
      email?: string;
    };

    if (!tier || !uid) {
      return NextResponse.json({ error: "Missing tier or uid" }, { status: 400 });
    }
    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      return NextResponse.json({ error: `No price ID configured for tier '${tier}'` }, { status: 400 });
    }

    const stripe = getStripe();

    // Origin so we can build absolute redirect URLs that work locally and in prod.
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment", // one-time payment (not subscription)
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: { uid, tier },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
