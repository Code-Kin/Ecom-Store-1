// GET /api/admin/stats — dashboard analytics: revenue, orders, inventory, trends.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, users, messages } from "@/db/schema";
import { desc, eq, sql, count, sum, avg } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const s = token ? await verifySessionToken(token) : null;
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  // KPI totals (exclude cancelled from revenue).
  const revenueRows = await db
    .select({ total: sum(orders.totalCents) })
    .from(orders)
    .where(sql`${orders.status} != 'cancelled'`);
  const orderCountRows = await db.select({ c: count() }).from(orders);
  const customerRows = await db.select({ c: count() }).from(users).where(eq(users.role, "customer"));
  const avgRows = await db
    .select({ a: avg(orders.totalCents) })
    .from(orders)
    .where(sql`${orders.status} != 'cancelled'`);

  // Revenue by day (last 14 days).
  const daily = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'MM-DD')`,
      total: sum(orders.totalCents),
      count: count(),
    })
    .from(orders)
    .where(sql`${orders.createdAt} >= now() - interval '14 days' AND ${orders.status} != 'cancelled'`)
    .groupBy(sql`to_char(${orders.createdAt}, 'MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'MM-DD')`);

  // Orders by status.
  const byStatus = await db
    .select({ status: orders.status, c: count() })
    .from(orders)
    .groupBy(orders.status);

  // Top products by units sold.
  const top = await db
    .select({
      productId: orderItems.productId,
      name: orderItems.productName,
      image: orderItems.productImage,
      units: sum(orderItems.quantity),
      revenue: sum(sql`${orderItems.quantity} * ${orderItems.priceCents}`),
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.productName, orderItems.productImage)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(6);

  // Low stock + out of stock.
  const lowStock = await db
    .select()
    .from(products)
    .where(sql`${products.stock} <= 6 AND ${products.isActive} = true`)
    .orderBy(products.stock)
    .limit(8);

  const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6);

  const unreadMessages = await db.select({ c: count() }).from(messages).where(eq(messages.status, "new"));

  const inventoryRows = await db.select({ total: sum(products.stock), skus: count() }).from(products).where(eq(products.isActive, true));

  return NextResponse.json({
    kpis: {
      revenueCents: Number(revenueRows[0]?.total || 0),
      orderCount: Number(orderCountRows[0]?.c || 0),
      customerCount: Number(customerRows[0]?.c || 0),
      avgOrderCents: Math.round(Number(avgRows[0]?.a || 0)),
      unreadMessages: Number(unreadMessages[0]?.c || 0),
      inventoryUnits: Number(inventoryRows[0]?.total || 0),
      activeSkus: Number(inventoryRows[0]?.skus || 0),
    },
    daily: daily.map((d) => ({ day: d.day, totalCents: Number(d.total || 0), count: Number(d.count || 0) })),
    byStatus: byStatus.map((b) => ({ status: b.status, count: Number(b.c) })),
    topProducts: top.map((t) => ({
      productId: t.productId,
      name: t.name,
      image: t.image,
      units: Number(t.units || 0),
      revenueCents: Number(t.revenue || 0),
    })),
    lowStock,
    recentOrders,
  });
}
