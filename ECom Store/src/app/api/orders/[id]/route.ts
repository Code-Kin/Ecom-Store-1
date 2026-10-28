// GET /api/orders/[id] — order detail (owner or admin). PATCH — admin updates, or owner cancel.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

async function sess(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  return token ? verifySessionToken(token) : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await sess(req);
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  const oid = Number(id);
  const rows = await db.select().from(orders).where(eq(orders.id, oid)).limit(1);
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (s.role !== "admin" && order.userId !== s.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, oid));
  return NextResponse.json({ order: { ...order, items } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await sess(req);
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;
  const oid = Number(id);
  const rows = await db.select().from(orders).where(eq(orders.id, oid)).limit(1);
  const order = rows[0];
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const b = await req.json();

  if (s.role === "admin") {
    const patch: Partial<typeof orders.$inferInsert> = {};
    if (b.status) patch.status = String(b.status);
    if (b.trackingNumber !== undefined) patch.trackingNumber = b.trackingNumber ? String(b.trackingNumber) : null;
    if (b.paymentStatus) patch.paymentStatus = String(b.paymentStatus);
    if (b.notes !== undefined) patch.notes = b.notes ? String(b.notes) : null;
    const updated = await db.update(orders).set(patch).where(eq(orders.id, oid)).returning();
    return NextResponse.json({ order: updated[0] });
  }

  // Customers may only cancel their own pending/processing orders.
  if (order.userId !== s.id) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (b.status === "cancelled" && ["pending", "processing"].includes(order.status)) {
    const updated = await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, oid)).returning();
    return NextResponse.json({ order: updated[0] });
  }
  return NextResponse.json({ error: "Only cancellation of new orders is allowed." }, { status: 403 });
}
