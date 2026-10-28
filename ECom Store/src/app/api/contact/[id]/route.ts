// PATCH /api/contact/[id] — admin triage. DELETE — admin removes spam.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const s = token ? await verifySessionToken(token) : null;
  return s?.role === "admin";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const patch: Partial<typeof messages.$inferInsert> = {};
  if (b.status) patch.status = String(b.status);
  const updated = await db.update(messages).set(patch).where(eq(messages.id, Number(id))).returning();
  if (!updated[0]) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ message: updated[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await params;
  await db.delete(messages).where(eq(messages.id, Number(id)));
  return NextResponse.json({ ok: true });
}
