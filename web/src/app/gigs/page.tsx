import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GigCard } from "@/components/gig-card";
import { NativeSelect } from "@/components/native-select";
import { GIG_SORTS, listOpenGigs, type GigSort } from "@/db/queries";
import { CATEGORIES } from "@/db/schema";

export const metadata: Metadata = { title: "Browse gigs · UniGig" };

type SearchParams = { q?: string; category?: string; sort?: string };

export default async function GigsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = (CATEGORIES as readonly string[]).includes(params.category ?? "") ? params.category : undefined;
  const sort: GigSort = params.sort && params.sort in GIG_SORTS ? (params.sort as GigSort) : "newest";
  const filtered = Boolean(q || category);

  const gigList = listOpenGigs({ q, category, sort });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Open gigs</h1>
          <p className="mt-1 text-muted-foreground">Find work that matches your skills and send a bid.</p>
        </div>
        <Button asChild>
          <Link href="/gigs/new">Post a gig</Link>
        </Button>
      </div>

      {/* Plain GET form: filters live in the URL, so results are shareable and work without JS. */}
      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search gigs, e.g. logo, python, tutoring"
            aria-label="Search gigs"
            className="pl-9"
          />
        </div>
        <NativeSelect name="category" defaultValue={category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="sort" defaultValue={sort} aria-label="Sort by">
          {Object.entries(GIG_SORTS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {gigList.length} open {gigList.length === 1 ? "gig" : "gigs"}
          {filtered && " match your search"}
        </span>
        {filtered && (
          <Link href="/gigs" className="underline underline-offset-4 hover:text-foreground">
            Clear filters
          </Link>
        )}
      </div>

      {gigList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {gigList.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No open gigs found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered ? "Try a different search or category." : "Be the first to post one."}
          </p>
        </div>
      )}
    </div>
  );
}
