"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { CATEGORIES, gigs } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type GigFormState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const gigSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(80, "Keep the title under 80 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Describe the work in at least 10 characters")
    .max(1000, "Keep the description under 1000 characters"),
  category: z.enum(CATEGORIES, "Pick a category"),
  budget: z.coerce
    .number("Enter a budget in rupees")
    .int("Use a whole number of rupees")
    .min(50, "Budget must be at least ₹50")
    .max(100000, "Budget can be at most ₹1,00,000"),
  // <input type="date"> sends "YYYY-MM-DD" or "" when left empty.
  deadline: z
    .string()
    .transform((s) => (s ? new Date(`${s}T23:59:59`) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Enter a valid date")
    .refine((d) => d === null || d >= startOfToday(), "Deadline can't be in the past"),
});

export async function createGig(_prev: GigFormState, formData: FormData): Promise<GigFormState> {
  const user = await requireUser("/gigs/new");
  const values = Object.fromEntries(
    ["title", "description", "category", "budget", "deadline"].map((k) => [k, String(formData.get(k) ?? "")]),
  );

  const parsed = gigSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const gig = db
    .insert(gigs)
    .values({ ...parsed.data, clientId: user.id })
    .returning({ id: gigs.id })
    .get();

  revalidatePath("/gigs");
  redirect(`/gigs/${gig.id}`);
}
