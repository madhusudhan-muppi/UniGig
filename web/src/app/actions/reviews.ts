"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bids, gigs, reviews, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type ReviewFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
};

const reviewSchema = z.object({
  gigId: z.coerce.number().int().positive(),
  rating: z.coerce
    .number("Pick a rating from 1 to 5 stars")
    .int("Pick a rating from 1 to 5 stars")
    .min(1, "Pick a rating from 1 to 5 stars")
    .max(5, "Pick a rating from 1 to 5 stars"),
  comment: z.string().trim().max(500, "Keep your review under 500 characters"),
});

/** The client marks an in-progress gig as done once the work is delivered. */
export async function completeGig(gigId: number) {
  const user = await requireUser();

  const gig = db
    .update(gigs)
    .set({ status: "COMPLETED" })
    .where(and(eq(gigs.id, gigId), eq(gigs.clientId, user.id), eq(gigs.status, "IN_PROGRESS")))
    .returning({ id: gigs.id })
    .get();

  if (gig) revalidatePath(`/gigs/${gigId}`);
}

/**
 * The client reviews the hired freelancer once the gig is completed (one review per gig).
 * The freelancer's rating is then recalculated as the average of all their reviews —
 * the app-side version of the DA-2 trigger trg_update_freelancer_rating.
 */
export async function submitReview(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const user = await requireUser();
  const values = Object.fromEntries(
    ["gigId", "rating", "comment"].map((k) => [k, String(formData.get(k) ?? "")]),
  );

  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const { gigId, rating, comment } = parsed.data;

  const error = db.transaction((tx) => {
    const gig = tx
      .select({ status: gigs.status, clientId: gigs.clientId })
      .from(gigs)
      .where(eq(gigs.id, gigId))
      .get();
    if (!gig || gig.clientId !== user.id) return "Only the client who posted this gig can review it.";
    if (gig.status !== "COMPLETED") return "You can review the work once the gig is marked completed.";

    const hired = tx
      .select({ freelancerId: bids.freelancerId })
      .from(bids)
      .where(and(eq(bids.gigId, gigId), eq(bids.status, "ACCEPTED")))
      .get();
    if (!hired) return "Nobody was hired for this gig.";

    const existing = tx.select({ id: reviews.id }).from(reviews).where(eq(reviews.gigId, gigId)).get();
    if (existing) return "You have already reviewed this gig.";

    tx.insert(reviews)
      .values({ gigId, clientId: user.id, freelancerId: hired.freelancerId, rating, comment: comment || null })
      .run();

    tx.update(users)
      .set({
        rating: sql`(SELECT round(avg(${reviews.rating}), 2) FROM ${reviews} WHERE ${reviews.freelancerId} = ${hired.freelancerId})`,
      })
      .where(eq(users.id, hired.freelancerId))
      .run();
    return null;
  });

  if (error) return { error, values };

  revalidatePath(`/gigs/${gigId}`);
  return {};
}
