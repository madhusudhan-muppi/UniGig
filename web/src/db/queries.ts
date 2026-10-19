import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { bids, gigs, reviews, users } from "./schema";

// Raw subqueries name "gigs.id" explicitly: drizzle leaves columns unqualified in
// single-table selects, which would be ambiguous inside a subquery that joins tables.
const bidCount = sql<number>`(SELECT count(*) FROM bids WHERE bids.gig_id = gigs.id)`.mapWith(Number);

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

const reviewCount = sql<number>`(SELECT count(*) FROM reviews WHERE reviews.freelancer_id = users.id)`.mapWith(Number);

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

/** Name, email and phone of a user — only shown to the other side of a hire. */
export function getContact(userId: number) {
  return db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .get();
}

export type Contact = NonNullable<ReturnType<typeof getContact>>;

/** The accepted bid on a gig and the hired freelancer's contact details, if someone was hired. */
export function getHire(gigId: number) {
  return db
    .select({
      bidId: bids.id,
      amount: bids.amount,
      timeframeDays: bids.timeframeDays,
      freelancer: { id: users.id, name: users.name, email: users.email, phone: users.phone },
    })
    .from(bids)
    .innerJoin(users, eq(users.id, bids.freelancerId))
    .where(and(eq(bids.gigId, gigId), eq(bids.status, "ACCEPTED")))
    .get();
}

/** The review left on a gig, with the reviewer's name, if any. */
export function getReview(gigId: number) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      clientName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.clientId))
    .where(eq(reviews.gigId, gigId))
    .get();
}

// Active work first (open, then in progress), then finished gigs; newest first within each.
const statusOrder = (column: typeof gigs.status) =>
  sql`CASE ${column} WHEN 'OPEN' THEN 0 WHEN 'IN_PROGRESS' THEN 1 WHEN 'COMPLETED' THEN 2 ELSE 3 END`;

/** Every gig a user has posted, with bid counts, who was hired and whether it was reviewed. */
export function listGigsByClient(userId: number) {
  return db
    .select({
      id: gigs.id,
      title: gigs.title,
      category: gigs.category,
      budget: gigs.budget,
      status: gigs.status,
      deadline: gigs.deadline,
      createdAt: gigs.createdAt,
      bidCount,
      pendingBidCount: sql<number>`(SELECT count(*) FROM bids WHERE bids.gig_id = gigs.id AND bids.status = 'PENDING')`.mapWith(Number),
      hiredName: sql<string | null>`(SELECT u.name FROM bids b JOIN users u ON u.id = b.freelancer_id WHERE b.gig_id = gigs.id AND b.status = 'ACCEPTED')`,
      reviewed: sql<boolean>`EXISTS (SELECT 1 FROM reviews r WHERE r.gig_id = gigs.id)`.mapWith(Boolean),
    })
    .from(gigs)
    .where(eq(gigs.clientId, userId))
    .orderBy(statusOrder(gigs.status), desc(gigs.createdAt))
    .all();
}

export type ClientGig = ReturnType<typeof listGigsByClient>[number];

/** Every bid a user has placed, with the gig and its client. */
export function listBidsByFreelancer(userId: number) {
  return db
    .select({
      id: bids.id,
      amount: bids.amount,
      timeframeDays: bids.timeframeDays,
      status: bids.status,
      createdAt: bids.createdAt,
      gig: {
        id: gigs.id,
        title: gigs.title,
        category: gigs.category,
        budget: gigs.budget,
        status: gigs.status,
      },
      clientName: users.name,
    })
    .from(bids)
    .innerJoin(gigs, eq(gigs.id, bids.gigId))
    .innerJoin(users, eq(users.id, gigs.clientId))
    .where(eq(bids.freelancerId, userId))
    .orderBy(
      sql`CASE ${bids.status} WHEN 'ACCEPTED' THEN 0 WHEN 'PENDING' THEN 1 ELSE 2 END`,
      statusOrder(gigs.status),
      desc(bids.createdAt),
    )
    .all();
}

export type FreelancerBid = ReturnType<typeof listBidsByFreelancer>[number];
