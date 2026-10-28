// GET /api/products — catalog with search / filter / sort. POST — create (admin only).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

async function isAdmin(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (!token) return false;
  const s = await verifySessionToken(token);
  return s?.role === "admin";
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search")?.trim() || "";
    const category = sp.get("category") || "";
    const sort = sp.get("sort") || "featured";
    const featuredOnly = sp.get("featured") === "1";
    const includeInactive = sp.get("includeInactive") === "1";
    const limit = Math.min(Number(sp.get("limit") || 60), 100);
    const minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) * 100 : null;
    const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) * 100 : null;

    const conds = [];
    if (!includeInactive) conds.push(eq(products.isActive, true));
    if (category && category !== "All") conds.push(eq(products.category, category));
    if (featuredOnly) conds.push(eq(products.featured, true));
    if (search) {
      conds.push(or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`), ilike(products.category, `%${search}%`)));
    }
    if (minPrice !== null) conds.push(gte(products.priceCents, minPrice));
    if (maxPrice !== null) conds.push(lte(products.priceCents, maxPrice));

    let orderBy: ReturnType<typeof asc> | ReturnType<typeof desc> | ReturnType<typeof sql> = desc(products.createdAt);
    if (sort === "price-asc") orderBy = asc(products.priceCents);
    else if (sort === "price-desc") orderBy = desc(products.priceCents);
    else if (sort === "rating") orderBy = desc(products.rating);
    else if (sort === "newest") orderBy = desc(products.createdAt);
    else if (sort === "featured") orderBy = sql`${products.featured} DESC, ${products.rating} DESC`;

    const where = conds.length ? and(...conds) : undefined;
    const rows = await db.select().from(products).where(where).orderBy(orderBy).limit(limit);
    return NextResponse.json({ products: rows });
  } catch (e) {
    console.error("products GET error", e);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.name || b.priceCents === undefined) {
      return NextResponse.json({ error: "Name and price are required." }, { status: 400 });
    }
    const inserted = await db
      .insert(products)
      .values({
        name: String(b.name),
        description: String(b.description || ""),
        priceCents: Math.round(Number(b.priceCents)),
        compareAtCents: b.compareAtCents ? Math.round(Number(b.compareAtCents)) : null,
        category: String(b.category || "Dresses"),
        imageUrl: String(b.imageUrl || ""),
        stock: Number(b.stock ?? 0),
        sizes: String(b.sizes || "XS,S,M,L,XL"),
        featured: Boolean(b.featured),
        isActive: b.isActive !== false,
        rating: Number(b.rating || 4.5),
        reviewCount: Number(b.reviewCount || 0),
      })
      .returning();
    return NextResponse.json({ product: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error("products POST error", e);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
