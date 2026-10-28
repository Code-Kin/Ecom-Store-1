// POST /api/checkout — validates the bag, creates a pending order and a Stripe Checkout Session (ZAR, card only).
// The customer is redirected to Stripe's hosted, PCI-compliant page; we never touch card numbers.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, products, orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { FREE_DELIVERY_CENTS, DELIVERY_CENTS } from "@/lib/format";

type IncomingLine = { productId: number; quantity: number; size: string };

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Online payments are not configured yet. The store owner must add STRIPE_SECRET_KEY." },
        { status: 503 }
      );
    }

    const token = req.cookies.get(sessionCookieName())?.value;
    const sess = token ? await verifySessionToken(token) : null;
    const b = await req.json();
    const { shippingName, shippingAddress, shippingCity, shippingZip, customerEmail, guestItems } = b;

    if (!shippingName || !shippingAddress || !shippingCity || !shippingZip) {
      return NextResponse.json({ error: "Please complete the delivery address." }, { status: 400 });
    }
    const email = String(customerEmail || sess?.email || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required for order confirmation." }, { status: 400 });
    }

    // Logged-in users check out their server cart; guests send items explicitly.
    let lines: IncomingLine[] = [];
    if (sess) {
      const rows = await db.select().from(cartItems).where(eq(cartItems.userId, sess.id));
      lines = rows.map((r) => ({ productId: r.productId, quantity: r.quantity, size: r.size }));
    } else if (Array.isArray(guestItems)) {
      lines = guestItems.map((g: IncomingLine) => ({
        productId: Number(g.productId),
        quantity: Math.max(1, Math.min(99, Number(g.quantity || 1))),
        size: String(g.size || "M"),
      }));
    }
    if (lines.length === 0) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

    // Validate stock + price from the DB (never trust client prices).
    let subtotal = 0;
    const snaps: { productId: number; name: string; image: string; quantity: number; priceCents: number; size: string }[] = [];
    for (const line of lines) {
      const p = (await db.select().from(products).where(eq(products.id, line.productId)).limit(1))[0];
      if (!p || !p.isActive) return NextResponse.json({ error: "One of the items is no longer available." }, { status: 400 });
      if (p.stock < line.quantity) {
        return NextResponse.json({ error: `Only ${p.stock} left of "${p.name}". Please adjust your bag.` }, { status: 400 });
      }
      subtotal += p.priceCents * line.quantity;
      snaps.push({ productId: p.id, name: p.name, image: p.imageUrl, quantity: line.quantity, priceCents: p.priceCents, size: line.size });
    }
    const shipping = subtotal >= FREE_DELIVERY_CENTS ? 0 : DELIVERY_CENTS;
    const vat = Math.round((subtotal * 15) / 115); // VAT already included in prices
    const total = subtotal + shipping;

    const tracking = `SB-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    const order = (
      await db
        .insert(orders)
        .values({
          userId: sess?.id ?? null,
          status: "pending",
          totalCents: total,
          subtotalCents: subtotal,
          shippingCents: shipping,
          taxCents: vat,
          shippingName: String(shippingName),
          shippingAddress: String(shippingAddress),
          shippingCity: String(shippingCity),
          shippingZip: String(shippingZip),
          customerEmail: email,
          paymentMethod: "stripe_card",
          paymentStatus: "pending",
          trackingNumber: tracking,
        })
        .returning()
    )[0];
    for (const s of snaps) {
      await db.insert(orderItems).values({
        orderId: order.id, productId: s.productId, productName: s.name, productImage: s.image,
        quantity: s.quantity, priceCents: s.priceCents, size: s.size,
      });
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const lineItems = snaps.map((s) => ({
      quantity: s.quantity,
      price_data: {
        currency: "zar",
        unit_amount: s.priceCents,
        product_data: { name: `${s.name} (Size ${s.size})`, images: s.image ? [s.image] : undefined },
      },
    }));
    if (shipping > 0) {
      lineItems.push({ quantity: 1, price_data: { currency: "zar", unit_amount: shipping, product_data: { name: "Courier delivery", images: undefined } } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allowed_payment_method_types: ["card"], // cards only — Visa & Mastercard enforced on confirmation
      currency: "zar",
      customer_email: email,
      line_items: lineItems,
      metadata: { orderId: String(order.id) },
      payment_intent_data: { metadata: { orderId: String(order.id) }, description: `Sarah's Boutique order #${order.id}` },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
    });

    return NextResponse.json({ url: session.url, orderId: order.id }, { status: 201 });
  } catch (e) {
    console.error("checkout error", e);
    const msg = e instanceof Error ? e.message : "Checkout failed.";
    return NextResponse.json({ error: `Checkout failed: ${msg}` }, { status: 500 });
  }
}
