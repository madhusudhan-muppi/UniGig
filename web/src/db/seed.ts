// Seeds the database with the DA-2 sample dataset (01_schema_and_data.sql).
// Dates are relative to "now" so the demo always has fresh open gigs.
// Run: npm run db:seed   (wipes existing data first)
import { avg, count as sqlCount, eq, sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { bids, gigs, reviews, sessions, skills, userSkills, users } from "./schema";
import type { GigStatus, BidStatus } from "./schema";

export const DEMO_PASSWORD = "password123";

const day = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * day);

const seedUsers = [
  { key: "U01", name: "Alice", phone: "9840011101", dept: "CSE", studyYear: 3 },
  { key: "U02", name: "Bob", phone: "9840022202", dept: "Design", studyYear: 2 },
  { key: "U03", name: "Charan", phone: "9840033303", dept: "CSE", studyYear: 4 },
  { key: "U04", name: "Divya", phone: "9840044404", dept: "ECE", studyYear: 3 },
  { key: "U05", name: "Eshwar", phone: "9840055505", dept: "Mechanical", studyYear: 2 },
  { key: "U06", name: "Fathima", phone: "9840066606", dept: "English", studyYear: 3 },
  { key: "U07", name: "Gokul", phone: "9840077707", dept: "CSE", studyYear: 1 },
  { key: "U08", name: "Harini", phone: "9840088808", dept: "Biotech", studyYear: 4 },
  { key: "U09", name: "Irfan", phone: "9840099909", dept: "CSE", studyYear: 2 },
  { key: "U10", name: "Janani", phone: "9840010010", dept: "Design", studyYear: 3 },
];

const seedSkills = [
  { key: "S01", name: "Photoshop", category: "Creative" },
  { key: "S02", name: "Logo Design", category: "Creative" },
  { key: "S03", name: "Python", category: "Programming" },
  { key: "S04", name: "Web Development", category: "Programming" },
  { key: "S05", name: "Content Writing", category: "Writing" },
  { key: "S06", name: "Maths Tutoring", category: "Tutoring" },
  { key: "S07", name: "Video Editing", category: "Creative" },
  { key: "S08", name: "Data Analysis", category: "Programming" },
  { key: "S09", name: "Circuit Design", category: "Electronics" },
  { key: "S10", name: "UI/UX Design", category: "Creative" },
];

const seedUserSkills: [string, string][] = [
  ["U02", "S01"], ["U02", "S02"], ["U02", "S07"],
  ["U03", "S03"], ["U03", "S04"], ["U03", "S08"],
  ["U04", "S09"], ["U04", "S06"],
  ["U06", "S05"],
  ["U09", "S03"], ["U09", "S04"],
  ["U10", "S01"], ["U10", "S02"], ["U10", "S07"],
  // Roles overlap: Gokul hires for his gigs but also offers web development.
  ["U07", "S04"],
];

type SeedGig = {
  key: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: GigStatus;
  postedDaysAgo: number;
  deadlineInDays: number;
  client: string;
};

const seedGigs: SeedGig[] = [
  { key: "G01", title: "Chess club logo", description: "Need a logo for the campus chess club", category: "Creative", budget: 500, status: "COMPLETED", postedDaysAgo: 50, deadlineInDays: -43, client: "U01" },
  { key: "G02", title: "Portfolio website", description: "Personal portfolio site with 4 pages", category: "Programming", budget: 2500, status: "COMPLETED", postedDaysAgo: 48, deadlineInDays: -36, client: "U05" },
  { key: "G03", title: "Attendance tracker script", description: "Python script to summarise club attendance sheets", category: "Programming", budget: 1200, status: "COMPLETED", postedDaysAgo: 46, deadlineInDays: -39, client: "U07" },
  { key: "G04", title: "Symposium poster", description: "A3 poster for the biotech symposium", category: "Creative", budget: 700, status: "COMPLETED", postedDaysAgo: 45, deadlineInDays: -40, client: "U08" },
  { key: "G05", title: "Club blog articles", description: "Three 800-word articles for the literary club blog", category: "Writing", budget: 900, status: "COMPLETED", postedDaysAgo: 43, deadlineInDays: -33, client: "U01" },
  { key: "G06", title: "Line follower circuit", description: "Arduino line-follower circuit for the robotics club", category: "Electronics", budget: 1800, status: "COMPLETED", postedDaysAgo: 41, deadlineInDays: -31, client: "U05" },
  { key: "G13", title: "Newsletter proofreading", description: "Proofread the monthly newsletter", category: "Writing", budget: 400, status: "CANCELLED", postedDaysAgo: 36, deadlineInDays: -31, client: "U05" },
  { key: "G07", title: "Fest promo video", description: "60-second promo video for the cultural fest", category: "Creative", budget: 1500, status: "IN_PROGRESS", postedDaysAgo: 14, deadlineInDays: 16, client: "U08" },
  { key: "G08", title: "Event registration site", description: "Registration portal for tech fest events", category: "Programming", budget: 3000, status: "IN_PROGRESS", postedDaysAgo: 12, deadlineInDays: 18, client: "U07" },
  { key: "G09", title: "Linear algebra tutoring", description: "Four tutoring sessions before CAT-1", category: "Tutoring", budget: 800, status: "OPEN", postedDaysAgo: 6, deadlineInDays: 23, client: "U05" },
  { key: "G10", title: "Pitch deck design", description: "10-slide deck for a startup pitch", category: "Creative", budget: 1000, status: "OPEN", postedDaysAgo: 4, deadlineInDays: 16, client: "U01" },
  { key: "G11", title: "Survey data analysis", description: "Analyse 300 lab survey responses and chart results", category: "Programming", budget: 1800, status: "OPEN", postedDaysAgo: 3, deadlineInDays: 22, client: "U08" },
  { key: "G12", title: "App UI mockups", description: "Figma mockups for a campus lost-and-found app", category: "Creative", budget: 2000, status: "OPEN", postedDaysAgo: 1, deadlineInDays: 27, client: "U07" },
];

// [gig, freelancer, amount, message, days, status] — bid placed a day after the gig.
const seedBids: [string, string, number, string, number, BidStatus][] = [
  ["G01", "U02", 450, "I can draw it", 3, "ACCEPTED"],
  ["G01", "U10", 480, "Minimal logo in 4 days", 4, "REJECTED"],
  ["G02", "U03", 2300, "Responsive site with contact form", 7, "ACCEPTED"],
  ["G02", "U09", 2000, "Can build with HTML and CSS", 10, "REJECTED"],
  ["G03", "U09", 1000, "Pandas script, done in 4 days", 4, "ACCEPTED"],
  ["G03", "U03", 1300, "Script plus a small dashboard", 3, "REJECTED"],
  ["G04", "U10", 650, "Poster with 2 revisions", 2, "ACCEPTED"],
  ["G04", "U02", 700, "Poster in 3 days", 3, "REJECTED"],
  ["G05", "U06", 850, "Well-researched articles", 5, "ACCEPTED"],
  ["G06", "U04", 1700, "Tested circuit with documentation", 6, "ACCEPTED"],
  ["G07", "U02", 1400, "Motion graphics promo", 7, "ACCEPTED"],
  ["G07", "U10", 1500, "Cinematic promo video", 6, "REJECTED"],
  ["G08", "U03", 2800, "Full-stack portal with admin page", 12, "ACCEPTED"],
  ["G08", "U09", 2600, "Portal with Google Sheets backend", 14, "REJECTED"],
  ["G09", "U04", 750, "Four one-hour sessions", 10, "PENDING"],
  ["G10", "U02", 950, "Clean corporate deck", 4, "PENDING"],
  ["G10", "U10", 900, "Modern deck with icons", 5, "PENDING"],
  ["G11", "U03", 1500, "Analysis with charts and report", 6, "PENDING"],
  ["G11", "U09", 1400, "Python analysis notebook", 7, "PENDING"],
];

// [gig, rating, comment] — client and freelancer come from the gig and its accepted bid.
const seedReviews: [string, number, string][] = [
  ["G01", 5, "Great logo, delivered early"],
  ["G02", 4, "Clean site, small delays"],
  ["G03", 5, "Script works perfectly"],
  ["G04", 4, "Nice poster, quick turnaround"],
  ["G05", 5, "Well written and on time"],
  ["G06", 3, "Circuit worked after one revision"],
];

function main() {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  db.transaction((tx) => {
    // Clear in child-to-parent order.
    tx.delete(reviews).run();
    tx.delete(bids).run();
    tx.delete(gigs).run();
    tx.delete(userSkills).run();
    tx.delete(skills).run();
    tx.delete(sessions).run();
    tx.delete(users).run();
    // Restart AUTOINCREMENT ids at 1.
    tx.run(sql`DELETE FROM sqlite_sequence`);

    const userIds = new Map<string, number>();
    for (const { key, ...u } of seedUsers) {
      const row = tx
        .insert(users)
        .values({
          ...u,
          email: `${u.name.toLowerCase()}@uni.edu`,
          passwordHash,
          createdAt: daysFromNow(-60),
        })
        .returning({ id: users.id })
        .get();
      userIds.set(key, row.id);
    }

    const skillIds = new Map<string, number>();
    for (const { key, ...s } of seedSkills) {
      const row = tx.insert(skills).values(s).returning({ id: skills.id }).get();
      skillIds.set(key, row.id);
    }

    tx.insert(userSkills)
      .values(seedUserSkills.map(([u, s]) => ({ userId: userIds.get(u)!, skillId: skillIds.get(s)! })))
      .run();

    const gigIds = new Map<string, number>();
    const gigPosted = new Map<string, number>();
    for (const g of seedGigs) {
      const row = tx
        .insert(gigs)
        .values({
          title: g.title,
          description: g.description,
          category: g.category,
          budget: g.budget,
          status: g.status,
          deadline: daysFromNow(g.deadlineInDays),
          clientId: userIds.get(g.client)!,
          createdAt: daysFromNow(-g.postedDaysAgo),
        })
        .returning({ id: gigs.id })
        .get();
      gigIds.set(g.key, row.id);
      gigPosted.set(g.key, g.postedDaysAgo);
    }

    const hired = new Map<string, string>();
    for (const [gig, freelancer, amount, message, timeframeDays, status] of seedBids) {
      tx.insert(bids)
        .values({
          gigId: gigIds.get(gig)!,
          freelancerId: userIds.get(freelancer)!,
          amount,
          message,
          timeframeDays,
          status,
          createdAt: daysFromNow(-gigPosted.get(gig)! + 1),
        })
        .run();
      if (status === "ACCEPTED") hired.set(gig, freelancer);
    }

    for (const [gig, rating, comment] of seedReviews) {
      const g = seedGigs.find((x) => x.key === gig)!;
      tx.insert(reviews)
        .values({
          gigId: gigIds.get(gig)!,
          clientId: userIds.get(g.client)!,
          freelancerId: userIds.get(hired.get(gig)!)!,
          rating,
          comment,
          createdAt: daysFromNow(g.deadlineInDays - 1),
        })
        .run();
    }

    // Each freelancer's rating = average of the reviews they received.
    for (const id of userIds.values()) {
      const { value } = tx
        .select({ value: avg(reviews.rating) })
        .from(reviews)
        .where(eq(reviews.freelancerId, id))
        .get()!;
      const rating = value ? Math.round(Number(value) * 100) / 100 : 0;
      tx.update(users).set({ rating }).where(eq(users.id, id)).run();
    }
  });

  const count = (t: SQLiteTable) => db.select({ n: sqlCount() }).from(t).get()!.n;
  console.log("Seeded UniGig database:");
  console.table({
    users: count(users),
    skills: count(skills),
    user_skills: count(userSkills),
    gigs: count(gigs),
    bids: count(bids),
    reviews: count(reviews),
  });
  console.log(`Log in as any user, e.g. alice@uni.edu / ${DEMO_PASSWORD}`);
}

main();
