import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { bids, gigs, reviews, users } from "./schema";

const bidCount = sql<number>`(SELECT count(*) FROM bids WHERE bids.gig_id = ${gigs.id})`.mapWith(Number);

const gigSummary = {
  id: gigs.id,
  title: gigs.title,
  description: gigs.description,
  category: gigs.category,
  budget: gigs.budget,
  status: gigs.status,
  deadline: gigs.deadline,
  createdAt: gigs.createdAt,
  client: { id: users.id, name: users.name, dept: users.dept },
  bidCount,
};

export type GigSummary = Awaited<ReturnType<typeof listOpenGigs>>[number];

export const GIG_SORTS = {
  newest: { label: "Newest first", orderBy: [desc(gigs.createdAt)] },
  "budget-high": { label: "Budget: high to low", orderBy: [desc(gigs.budget), desc(gigs.createdAt)] },
  "budget-low": { label: "Budget: low to high", orderBy: [asc(gigs.budget), desc(gigs.createdAt)] },
  deadline: { label: "Deadline: soonest", orderBy: [sql`${gigs.deadline} IS NULL`, asc(gigs.deadline)] },
} as const;

export type GigSort = keyof typeof GIG_SORTS;

/** Open gigs for the browse page, optionally filtered by text and category. */
export function listOpenGigs({
  q,
  category,
  sort = "newest",
  limit,
}: { q?: string; category?: string; sort?: GigSort; limit?: number } = {}) {
  const search = q?.trim().toLowerCase();
  const query = db
    .select(gigSummary)
    .from(gigs)
    .innerJoin(users, eq(users.id, gigs.clientId))
    .where(
      and(
        eq(gigs.status, "OPEN"),
        category ? eq(gigs.category, category) : undefined,
        // instr() instead of LIKE so % and _ in the search box are matched literally.
        search
          ? sql`(instr(lower(${gigs.title}), ${search}) > 0 OR instr(lower(${gigs.description}), ${search}) > 0)`
          : undefined,
      ),
    )
    .orderBy(...GIG_SORTS[sort].orderBy);
  return (limit ? query.limit(limit) : query).all();
}

/** One gig with its client's details, or undefined. */
export function getGig(id: number) {
  return db
    .select({
      ...gigSummary,
      clientId: gigs.clientId,
      client: {
        id: users.id,
        name: users.name,
        dept: users.dept,
        studyYear: users.studyYear,
        rating: users.rating,
      },
    })
    .from(gigs)
    .innerJoin(users, eq(users.id, gigs.clientId))
    .where(eq(gigs.id, id))
    .get();
}

const reviewCount = sql<number>`(SELECT count(*) FROM ${reviews} WHERE ${reviews.freelancerId} = ${users.id})`.mapWith(Number);

/** All bids on a gig with the bidder's profile: accepted, then pending, then rejected; oldest first. */
export function listBidsForGig(gigId: number) {
  return db
    .select({
      id: bids.id,
      amount: bids.amount,
      message: bids.message,
      timeframeDays: bids.timeframeDays,
      status: bids.status,
      createdAt: bids.createdAt,
      freelancer: {
        id: users.id,
        name: users.name,
        dept: users.dept,
        studyYear: users.studyYear,
        rating: users.rating,
        reviewCount,
      },
    })
    .from(bids)
    .innerJoin(users, eq(users.id, bids.freelancerId))
    .where(eq(bids.gigId, gigId))
    .orderBy(
      sql`CASE ${bids.status} WHEN 'ACCEPTED' THEN 0 WHEN 'PENDING' THEN 1 ELSE 2 END`,
      asc(bids.createdAt),
    )
    .all();
}

export type GigBid = ReturnType<typeof listBidsForGig>[number];

/** The bid a user placed on a gig, if any. */
export function getUserBid(gigId: number, userId: number) {
  return db
    .select()
    .from(bids)
    .where(and(eq(bids.gigId, gigId), eq(bids.freelancerId, userId)))
    .get();
}
