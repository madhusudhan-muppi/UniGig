import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE = "unigig_session";
const SESSION_DAYS = 30;

// The cookie holds a random token; the database only stores its SHA-256 hash,
// so a leaked database can't be used to log in as anyone.
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Starts a session for the user. Call only from a server action or route handler. */
export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.insert(sessions).values({ id: hashToken(token), userId, expiresAt }).run();

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Ends the current session. Call only from a server action or route handler. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  store.delete(SESSION_COOKIE);
}

/** The logged-in user (without password hash), or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db
    .select({
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        dept: users.dept,
        studyYear: users.studyYear,
        bio: users.bio,
        rating: users.rating,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashToken(token)))
    .get();

  if (!row || row.expiresAt < new Date()) return null;
  return row.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** The logged-in user, or redirect to /login (coming back to `returnTo` afterwards). */
export async function requireUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  return user;
}

/** Only allow same-site relative paths as post-login redirects. */
export function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
