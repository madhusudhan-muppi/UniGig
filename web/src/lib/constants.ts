// Shared by the database schema and client components (keep free of server imports).

export const GIG_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type GigStatus = (typeof GIG_STATUSES)[number];

export const BID_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

/** A bid may ask for at most 150% of the gig budget (rule from DA-2 trg_validate_bid). */
export const maxBidAmount = (budget: number) => Math.floor(budget * 1.5);

export const CATEGORIES = [
  "Creative",
  "Programming",
  "Writing",
  "Tutoring",
  "Electronics",
  "Other",
] as const;
