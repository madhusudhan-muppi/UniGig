import type { Metadata } from "next";
import { GigForm } from "@/components/gig-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Post a gig · UniGig" };

export default async function NewGigPage() {
  await requireUser("/gigs/new");
  // Local date as YYYY-MM-DD for the date picker's minimum.
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Post a gig</h1>
      <p className="mt-1 text-muted-foreground">
        Describe the work and set a budget. Students with the right skills will send you bids.
      </p>
      <div className="mt-6">
        <GigForm today={today} />
      </div>
    </div>
  );
}
