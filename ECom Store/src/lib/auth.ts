// Auth helpers: password hashing (bcryptjs) + JWT sessions (jose) stored in httpOnly cookies.
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "sb_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sarahs-boutique-dev-secret-change-in-prod"
);

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role || "customer"),
    };
  } catch {
    return null;
  }
}

// Read current session from cookies (usable in server components + route handlers).
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Fetch the full user row for the current session.
export async function getSessionUserFull() {
  const session = await getSession();
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  return rows[0] || null;
}

export function sessionCookieName() {
  return COOKIE_NAME;
}

// Safe public shape (never leak password hash).
export function publicUser(u: { id: number; name: string; email: string; role: string; phone?: string | null; address?: string | null; city?: string | null; zip?: string | null; createdAt?: Date }) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? null,
    address: u.address ?? null,
    city: u.city ?? null,
    zip: u.zip ?? null,
    createdAt: u.createdAt ?? null,
  };
}
