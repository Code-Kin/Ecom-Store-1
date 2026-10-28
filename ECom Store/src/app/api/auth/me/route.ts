// GET /api/auth/me — current session user. PATCH — update profile.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken, sessionCookieName, publicUser } from "@/lib/auth";

async function currentUser(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  return rows[0] || null;
}

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ user: publicUser(user) });
}

export async function PATCH(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json();
  const patch: Partial<typeof users.$inferInsert> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.phone === "string") patch.phone = body.phone;
  if (typeof body.address === "string") patch.address = body.address;
  if (typeof body.city === "string") patch.city = body.city;
  if (typeof body.zip === "string") patch.zip = body.zip;
  const updated = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
  return NextResponse.json({ user: publicUser(updated[0]) });
}
