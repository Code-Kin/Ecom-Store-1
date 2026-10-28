// GET /api/products/[id] — single product + reviews. PATCH/DELETE — admin only.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews, orderItems, cartItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

async function adminSession(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (!token) return null;
  const s = await verifySessionToken(token);
  return s?.role === "admin" ? s : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  if (!pid) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const rows = await db.select().from(products).where(eq(products.id, pid)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const revs = await db.select().from(reviews).where(eq(reviews.productId, pid)).orderBy(desc(reviews.createdAt)).limit(20);
  // Related: same category, different id
  const related = await db.select().from(products).where(eq(products.category, rows[0].category)).limit(8);
  return NextResponse.json({
    product: rows[0],
    reviews: revs,
    related: related.filter((p) => p.id !== pid).slice(0, 4),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession(req))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const pid = Number(id);
  const b = await req.json();
  const patch: Partial<typeof products.$inferInsert> = {};
  if (b.name !== undefined) patch.name = String(b.name);
  if (b.description !== undefined) patch.description = String(b.description);
  if (b.priceCents !== undefined) patch.priceCents = Math.round(Number(b.priceCents));
  if (b.compareAtCents !== undefined) patch.compareAtCents = b.compareAtCents ? Math.round(Number(b.compareAtCents)) : null;
  if (b.category !== undefined) patch.category = String(b.category);
  if (b.imageUrl !== undefined) patch.imageUrl = String(b.imageUrl);
  if (b.stock !== undefined) patch.stock = Number(b.stock);
  if (b.sizes !== undefined) patch.sizes = String(b.sizes);
  if (b.featured !== undefined) patch.featured = Boolean(b.featured);
  if (b.isActive !== undefined) patch.isActive = Boolean(b.isActive);
  const updated = await db.update(products).set(patch).where(eq(products.id, pid)).returning();
  if (!updated[0]) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product: updated[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession(req))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const pid = Number(id);
  // Preserve order history: null out product refs in order items, clear cart refs + reviews.
  await db.update(orderItems).set({ productId: null }).where(eq(orderItems.productId, pid));
  await db.delete(cartItems).where(eq(cartItems.productId, pid));
  await db.delete(reviews).where(eq(reviews.productId, pid));
  const deleted = await db.delete(products).where(eq(products.id, pid)).returning();
  if (!deleted[0]) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
