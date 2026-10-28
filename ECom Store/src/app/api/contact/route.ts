// POST /api/contact — public contact/feedback form. GET — admin inbox.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { verifySessionToken, sessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const { name, email, subject, message, type, rating } = b;
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    const inserted = await db
      .insert(messages)
      .values({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        subject: String(subject || "").slice(0, 200),
        message: String(message).slice(0, 5000),
        type: type === "feedback" ? "feedback" : "contact",
        rating: rating ? Math.max(1, Math.min(5, Number(rating))) : null,
      })
      .returning();
    return NextResponse.json({ ok: true, message: inserted[0] }, { status: 201 });
  } catch (e) {
    console.error("contact POST error", e);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const s = token ? await verifySessionToken(token) : null;
  if (!s || s.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || "";
  const status = sp.get("status") || "";
  const conds = [];
  if (type) conds.push(eq(messages.type, type));
  if (status) conds.push(eq(messages.status, status));
  const rows = await db
    .select()
    .from(messages)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(messages.createdAt))
    .limit(200);
  return NextResponse.json({ messages: rows });
}
