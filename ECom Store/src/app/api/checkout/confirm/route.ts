// GET /api/checkout/confirm?session_id= — verifies a Stripe Checkout Session after redirect and finalizes the order.
import { NextRequest, NextResponse } from "next/server";
import { finalizeCheckoutSession } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  try {
    const r = await finalizeCheckoutSession(sessionId);
    if (!r.ok) return NextResponse.json({ error: r.error, orderId: r.orderId }, { status: 402 });
    return NextResponse.json(r);
  } catch (e) {
    console.error("confirm error", e);
    return NextResponse.json({ error: "Could not verify payment." }, { status: 500 });
  }
}
