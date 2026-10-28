// Stripe integration (ZAR). Secret key is read server-side from STRIPE_SECRET_KEY — never exposed to the browser.
import Stripe from "stripe";
import { db } from "@/db";
import { orders, orderItems, products, cartItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const ACCEPTED_BRANDS = ["visa", "mastercard"] as const;

let client: Stripe | null = null;
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export type FinalizeResult =
  | { ok: true; orderId: number; trackingNumber: string | null; totalCents: number; alreadyFinalized: boolean }
  | { ok: false; error: string; orderId?: number };

/**
 * Called from the success page and the webhook. Idempotent:
 *  - verifies the Checkout Session is paid
 *  - enforces Visa / Mastercard only (other brands are refunded automatically)
 *  - marks the order paid, decrements stock and clears the customer's cart
 */
export async function finalizeCheckoutSession(sessionId: string): Promise<FinalizeResult> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Stripe is not configured." };

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge"],
  });
  const orderId = Number(session.metadata?.orderId);
  if (!orderId) return { ok: false, error: "Order reference missing from payment session." };

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return { ok: false, error: "Order not found." };

  if (order.paymentStatus === "paid") {
    return { ok: true, orderId, trackingNumber: order.trackingNumber, totalCents: order.totalCents, alreadyFinalized: true };
  }
  if (session.payment_status !== "paid") {
    return { ok: false, error: "Payment has not been completed.", orderId };
  }

  // Enforce card brand: Visa & Mastercard only.
  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const charge = pi && typeof pi.latest_charge === "object" ? (pi.latest_charge as Stripe.Charge | null) : null;
  const card = charge?.payment_method_details?.card;
  const brand = card?.brand || "";
  if (!ACCEPTED_BRANDS.includes(brand as (typeof ACCEPTED_BRANDS)[number])) {
    if (pi) await stripe.refunds.create({ payment_intent: pi.id }).catch(() => {});
    await db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: "refunded", notes: `Refunded: ${brand || "unknown"} card not accepted (Visa/Mastercard only)` })
      .where(eq(orders.id, orderId));
    return { ok: false, error: "Sorry, we only accept Visa and Mastercard. Your payment has been refunded in full.", orderId };
  }

  // Mark paid + processing.
  await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      status: "processing",
      notes: `Stripe ${pi?.id || session.id} · ${brand.toUpperCase()} •••• ${card?.last4 || "????"}`,
    })
    .where(eq(orders.id, orderId));

  // Decrement stock for each purchased item.
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (!it.productId) continue;
    await db
      .update(products)
      .set({ stock: sql`GREATEST(0, ${products.stock} - ${it.quantity})` })
      .where(eq(products.id, it.productId));
  }
  if (order.userId) await db.delete(cartItems).where(eq(cartItems.userId, order.userId));

  return { ok: true, orderId, trackingNumber: order.trackingNumber, totalCents: order.totalCents, alreadyFinalized: false };
}
