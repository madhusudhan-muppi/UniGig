// Shared by the database schema and client components (keep free of server imports).

export const GIG_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type GigStatus = (typeof GIG_STATUSES)[number];

export const BID_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

export const CATEGORIES = [
  "Creative",
  "Programming",
  "Writing",
  "Tutoring",
  "Electronics",
  "Other",
] as const;
