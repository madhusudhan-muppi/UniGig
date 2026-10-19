import { sql } from "drizzle-orm";
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

// Roles overlap: every user can post gigs (client) and bid on gigs (freelancer),
// so there is no user_type column like in the DA-2 Oracle schema.

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: text("phone"),
    dept: text("dept"),
    studyYear: integer("study_year"),
    bio: text("bio"),
    // Average of reviews received as a freelancer; recalculated on every review.
    rating: real("rating").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    check("users_study_year", sql`${t.studyYear} IS NULL OR ${t.studyYear} BETWEEN 1 AND 5`),
    check("users_rating", sql`${t.rating} BETWEEN 0 AND 5`),
  ],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
});

// Resolves the M:N relationship USER --HAS-- SKILL.
export const userSkills = sqliteTable(
  "user_skills",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
);

export const GIG_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type GigStatus = (typeof GIG_STATUSES)[number];

export const CATEGORIES = [
  "Creative",
  "Programming",
  "Writing",
  "Tutoring",
  "Electronics",
  "Other",
] as const;

export const gigs = sqliteTable(
  "gigs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    // Budget in whole rupees.
    budget: integer("budget").notNull(),
    status: text("status", { enum: GIG_STATUSES }).notNull().default("OPEN"),
    deadline: integer("deadline", { mode: "timestamp" }),
    clientId: integer("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [check("gigs_budget", sql`${t.budget} > 0`)],
);

export const BID_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type BidStatus = (typeof BID_STATUSES)[number];

export const bids = sqliteTable(
  "bids",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gigId: integer("gig_id")
      .notNull()
      .references(() => gigs.id, { onDelete: "cascade" }),
    freelancerId: integer("freelancer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    message: text("message").notNull(),
    timeframeDays: integer("timeframe_days").notNull(),
    status: text("status", { enum: BID_STATUSES }).notNull().default("PENDING"),
    createdAt: createdAt(),
  },
  (t) => [
    // A freelancer can bid only once per gig.
    unique("bids_once_per_gig").on(t.gigId, t.freelancerId),
    check("bids_amount", sql`${t.amount} > 0`),
    check("bids_timeframe", sql`${t.timeframeDays} > 0`),
  ],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // One review per gig.
    gigId: integer("gig_id")
      .notNull()
      .unique()
      .references(() => gigs.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    freelancerId: integer("freelancer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: createdAt(),
  },
  (t) => [check("reviews_rating", sql`${t.rating} BETWEEN 1 AND 5`)],
);

export type User = typeof users.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Gig = typeof gigs.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Review = typeof reviews.$inferSelect;
