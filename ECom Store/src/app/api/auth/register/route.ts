// POST /api/auth/register — customer registration with hashed password + session cookie.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSessionToken, publicUser, sessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const passwordHash = await hashPassword(String(password));
    const inserted = await db
      .insert(users)
      .values({ name: String(name).trim(), email: cleanEmail, passwordHash, role: "customer" })
      .returning();
    const user = inserted[0];
    const token = await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
