// /api/cart — server cart for logged-in users (guest carts use localStorage client-side).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

async function session(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function GET(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const rows = await db
    .select({
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      size: cartItems.size,
      name: products.name,
      image: products.imageUrl,
      priceCents: products.priceCents,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, s.id));
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { productId, quantity, size } = await req.json();
  const pid = Number(productId);
  const qty = Math.max(1, Math.min(99, Number(quantity || 1)));
  const sz = String(size || "M");
  if (!pid) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  const prod = await db.select().from(products).where(eq(products.id, pid)).limit(1);
  if (!prod[0]) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, s.id), eq(cartItems.productId, pid), eq(cartItems.size, sz)))
    .limit(1);
  if (existing[0]) {
    const nextQty = Math.min(prod[0].stock, existing[0].quantity + qty);
    await db.update(cartItems).set({ quantity: nextQty }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId: s.id, productId: pid, quantity: Math.min(qty, Math.max(prod[0].stock, 1)), size: sz });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { productId, size, quantity } = await req.json();
  const qty = Math.max(1, Math.min(99, Number(quantity || 1)));
  await db
    .update(cartItems)
    .set({ quantity: qty })
    .where(and(eq(cartItems.userId, s.id), eq(cartItems.productId, Number(productId)), eq(cartItems.size, String(size || "M"))));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  if (sp.get("all") === "1") {
    await db.delete(cartItems).where(eq(cartItems.userId, s.id));
    return NextResponse.json({ ok: true });
  }
  const pid = Number(sp.get("productId"));
  const size = String(sp.get("size") || "M");
  if (!pid) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, s.id), eq(cartItems.productId, pid), eq(cartItems.size, size)));
  return NextResponse.json({ ok: true });
}
