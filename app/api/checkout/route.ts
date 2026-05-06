// POST /api/checkout
// Creates a Stripe Checkout Session for the single-tier "pro" upgrade.

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = (await req.json()) as {
      uid: string;
      email?: string;
    };

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
    if (!priceId) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_STRIPE_PRICE_PRO is not configured" },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: { uid, tier: "pro" },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
