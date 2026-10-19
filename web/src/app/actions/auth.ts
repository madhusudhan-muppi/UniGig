"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, safeNext } from "@/lib/auth";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
};

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\- ]{7,15}$/, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

// Echo text fields back so the form keeps them after an error (never the password).
const keepValues = (formData: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = keepValues(formData, ["name", "email", "phone"]);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { name, email, phone, password } = parsed.data;
  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists"] }, values };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db
    .insert(users)
    .values({ name, email, phone, passwordHash })
    .returning({ id: users.id })
    .get();

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = keepValues(formData, ["email"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { email, password } = parsed.data;
  const user = db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .get();

  // Same message for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password", values };
  }

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
