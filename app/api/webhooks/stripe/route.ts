// POST /api/webhooks/stripe
// Stripe sends events here when payments succeed/fail. We verify the
// signature using the webhook secret, then mark the user as upgraded
// in Firestore using the server-side Firebase Admin SDK.

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type Stripe from "stripe";
import type { Tier } from "@/lib/types";

// Force Node runtime — webhook needs raw body + Buffer
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      const tier = session.metadata?.tier as Tier | undefined;

      if (!uid || !tier || tier === "free") {
        console.error("Webhook missing uid or tier in session metadata");
        return NextResponse.json({ received: true });
      }

      const db = getAdminDb();
      await db.collection("users").doc(uid).set(
        {
          premium: true,
          tier,
          purchasedAt: new Date().toISOString(),
          stripeCustomerId: session.customer ?? null,
          stripeSessionId: session.id,
        },
        { merge: true },
      );
      console.log(`Granted ${tier} to user ${uid}`);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("Webhook handler error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
