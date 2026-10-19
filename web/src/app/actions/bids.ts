"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bids, gigs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { maxBidAmount } from "@/lib/constants";

export type BidFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
};

const bidSchema = z.object({
  amount: z.coerce
    .number("Enter your price in rupees")
    .int("Use a whole number of rupees")
    .min(1, "Price must be at least ₹1"),
  timeframeDays: z.coerce
    .number("Enter the number of days")
    .int("Use a whole number of days")
    .min(1, "At least 1 day")
    .max(365, "At most 365 days"),
  message: z
    .string()
    .trim()
    .min(10, "Tell the client a bit more (at least 10 characters)")
    .max(500, "Keep your message under 500 characters"),
});

/** Marketplace rules (DA-2 trg_validate_bid): open gig, not your own, once per gig, ≤150% of budget. */
export async function placeBid(_prev: BidFormState, formData: FormData): Promise<BidFormState> {
  const gigId = Number(formData.get("gigId"));
  if (!Number.isInteger(gigId) || gigId <= 0) return { error: "This gig no longer exists." };
  const user = await requireUser(`/gigs/${gigId}`);
  const values = Object.fromEntries(
    ["amount", "timeframeDays", "message"].map((k) => [k, String(formData.get(k) ?? "")]),
  );

  const parsed = bidSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // Check and insert in one transaction so the gig can't change in between.
  const error = db.transaction((tx) => {
    const gig = tx
      .select({ status: gigs.status, budget: gigs.budget, clientId: gigs.clientId })
      .from(gigs)
      .where(eq(gigs.id, gigId))
      .get();

    if (!gig) return "This gig no longer exists.";
    if (gig.clientId === user.id) return "You can't bid on your own gig.";
    if (gig.status !== "OPEN") return "This gig is no longer accepting bids.";

    const existing = tx
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.gigId, gigId), eq(bids.freelancerId, user.id)))
      .get();
    if (existing) return "You have already bid on this gig.";

    const maxAmount = maxBidAmount(gig.budget);
    if (parsed.data.amount > maxAmount) {
      return `Your price can be at most ₹${maxAmount.toLocaleString("en-IN")} (150% of the budget).`;
    }

    tx.insert(bids).values({ ...parsed.data, gigId, freelancerId: user.id }).run();
    return null;
  });

  if (error) return { error, values };

  revalidatePath(`/gigs/${gigId}`);
  revalidatePath("/gigs");
  return {};
}

/**
 * The "Hire" button (DA-2 sp_accept_bid): accept one bid, reject every other bid
 * on the gig and move the gig to IN_PROGRESS — all in one transaction.
 * Only the gig owner can hire, and only while the gig is open.
 */
export async function acceptBid(bidId: number) {
  const user = await requireUser();

  const gigId = db.transaction((tx) => {
    const row = tx
      .select({ gigId: bids.gigId, bidStatus: bids.status, gigStatus: gigs.status, clientId: gigs.clientId })
      .from(bids)
      .innerJoin(gigs, eq(gigs.id, bids.gigId))
      .where(eq(bids.id, bidId))
      .get();

    if (!row || row.clientId !== user.id || row.gigStatus !== "OPEN" || row.bidStatus !== "PENDING") {
      return null;
    }

    tx.update(bids).set({ status: "ACCEPTED" }).where(eq(bids.id, bidId)).run();
    tx.update(bids)
      .set({ status: "REJECTED" })
      .where(and(eq(bids.gigId, row.gigId), ne(bids.id, bidId)))
      .run();
    tx.update(gigs).set({ status: "IN_PROGRESS" }).where(eq(gigs.id, row.gigId)).run();
    return row.gigId;
  });

  if (gigId) {
    revalidatePath(`/gigs/${gigId}`);
    revalidatePath("/gigs");
  }
}

/** A freelancer can take back a bid while it is still pending. */
export async function withdrawBid(bidId: number) {
  const user = await requireUser();

  const bid = db
    .delete(bids)
    .where(and(eq(bids.id, bidId), eq(bids.freelancerId, user.id), eq(bids.status, "PENDING")))
    .returning({ gigId: bids.gigId })
    .get();

  if (bid) {
    revalidatePath(`/gigs/${bid.gigId}`);
    revalidatePath("/gigs");
  }
}
