// GET /api/admin/customers — customer directory with order history rollups.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const s = token ? await verifySessionToken(token) : null;
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search")?.trim() || "";
  const list = await db
    .select()
    .from(users)
    .where(search ? sql`${users.role} = 'customer' AND (${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})` : eq(users.role, "customer"))
    .orderBy(desc(users.createdAt))
    .limit(100);

  // Roll up orders per customer.
  const allOrders = await db.select().from(orders).limit(1000);
  const rollup: Record<number, { count: number; spent: number; last: string | null }> = {};
  for (const o of allOrders) {
    if (!o.userId) continue;
    const r = (rollup[o.userId] ||= { count: 0, spent: 0, last: null });
    r.count += 1;
    if (o.status !== "cancelled") r.spent += o.totalCents;
    if (!r.last || new Date(o.createdAt) > new Date(r.last)) r.last = o.createdAt.toISOString();
  }

  return NextResponse.json({
    customers: list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      city: u.city,
      zip: u.zip,
      createdAt: u.createdAt,
      orderCount: rollup[u.id]?.count || 0,
      totalSpentCents: rollup[u.id]?.spent || 0,
      lastOrderAt: rollup[u.id]?.last || null,
    })),
  });
}
