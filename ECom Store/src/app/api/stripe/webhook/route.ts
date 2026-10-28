// POST /api/stripe/webhook — Stripe calls this on checkout.session.completed so orders finalize
// even if the customer closes the browser before returning. Requires STRIPE_WEBHOOK_SECRET.
import { NextRequest, NextResponse } from "next/server";
import { getStripe, finalizeCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });

  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();
  try {
    const event = stripe.webhooks.constructEvent(body, sig, secret);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as { id: string };
      await finalizeCheckoutSession(session.id);
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("webhook error", e);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
}
