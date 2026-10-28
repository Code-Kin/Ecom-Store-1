// GET /api/orders — own orders (customer) or all orders with ?all=1 (admin).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const sess = await verifySessionToken(token);
  if (!sess) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const wantAll = sp.get("all") === "1";
  const status = sp.get("status") || "";

  let list;
  if (wantAll) {
    if (sess.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    list = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
  } else {
    list = await db.select().from(orders).where(eq(orders.userId, sess.id)).orderBy(desc(orders.createdAt)).limit(100);
  }
  const filtered = status ? list.filter((o) => o.status === status) : list;
  const ids = filtered.map((o) => o.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  const byOrder: Record<number, typeof items> = {};
  for (const it of items) {
    (byOrder[it.orderId] ||= []).push(it);
  }
  return NextResponse.json({ orders: filtered.map((o) => ({ ...o, items: byOrder[o.id] || [] })) });
}
