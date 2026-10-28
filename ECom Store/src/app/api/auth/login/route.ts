// POST /api/auth/login — verify credentials, issue session cookie. Works for customers + admins.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSessionToken, publicUser, sessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const rows = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const token = await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    const res = NextResponse.json({ user: publicUser(user) });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
