// GET /api/reviews?productId= — list. POST — leave a review (logged in).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { desc, eq, sql, avg, count } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const pid = Number(req.nextUrl.searchParams.get("productId"));
  if (!pid) return NextResponse.json({ error: "productId required." }, { status: 400 });
  const rows = await db.select().from(reviews).where(eq(reviews.productId, pid)).orderBy(desc(reviews.createdAt)).limit(30);
  return NextResponse.json({ reviews: rows });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const s = token ? await verifySessionToken(token) : null;
  if (!s) return NextResponse.json({ error: "Please sign in to leave a review." }, { status: 401 });
  const { productId, rating, comment } = await req.json();
  const pid = Number(productId);
  const r = Math.max(1, Math.min(5, Number(rating || 5)));
  if (!pid) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  const inserted = await db
    .insert(reviews)
    .values({ productId: pid, userId: s.id, userName: s.name, rating: r, comment: String(comment || "").slice(0, 2000) })
    .returning();
  // Recompute product aggregate.
  const agg = await db.select({ a: avg(reviews.rating), c: count() }).from(reviews).where(eq(reviews.productId, pid));
  await db
    .update(products)
    .set({ rating: Number(Number(agg[0]?.a || r).toFixed(1)), reviewCount: Number(agg[0]?.c || 1) })
    .where(eq(products.id, pid));
  return NextResponse.json({ review: inserted[0] }, { status: 201 });
}
