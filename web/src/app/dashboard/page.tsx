import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  listBidsByFreelancer,
  listGigsByClient,
  type ClientGig,
  type FreelancerBid,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatRupees, timeFromNow } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard · UniGig" };

type Tab = "posted" | "bids";

/** What the client should do next on a gig they posted, if anything. */
function clientTodo(gig: ClientGig) {
  if (gig.status === "OPEN" && gig.pendingBidCount > 0)
    return `${gig.pendingBidCount} ${gig.pendingBidCount === 1 ? "bid" : "bids"} waiting — choose a student to hire`;
  if (gig.status === "IN_PROGRESS") return "Mark as completed once the work is delivered";
  if (gig.status === "COMPLETED" && gig.hiredName && !gig.reviewed) return `Leave a review for ${gig.hiredName}`;
  return null;
}

/** What the freelancer should do next on one of their bids, if anything. */
function freelancerTodo(bid: FreelancerBid) {
  if (bid.status === "ACCEPTED" && bid.gig.status === "IN_PROGRESS")
    return `You're hired — contact ${bid.clientName} to get started`;
  return null;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}

function Todo({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
      <ArrowRight className="size-4" />
      {text}
    </span>
  );
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
      <Button asChild size="sm">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

function PostedGigs({ gigs }: { gigs: ClientGig[] }) {
  if (gigs.length === 0) {
    return (
      <EmptyState
        title="You haven't posted any gigs yet"
        body="Need a logo, a website or some tutoring? Post a gig and let students bid."
        href="/gigs/new"
        cta="Post a gig"
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {gigs.map((gig) => {
        const todo = clientTodo(gig);
        return (
          <li key={gig.id}>
            <Link href={`/gigs/${gig.id}`} className="group block rounded-xl">
              <Card className="gap-2 py-4 transition-colors group-hover:border-foreground/30">
                <CardContent className="flex flex-col gap-2 px-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium">{gig.title}</span>
                    <span className="font-semibold tabular-nums">{formatRupees(gig.budget)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={gig.status} />
                    <Badge variant="outline">{gig.category}</Badge>
                    <span>Posted {timeFromNow(gig.createdAt)}</span>
                    <span>
                      · {gig.bidCount} {gig.bidCount === 1 ? "bid" : "bids"}
                    </span>
                    {gig.hiredName && <span>· Hired {gig.hiredName}</span>}
                  </div>
                  {todo && <Todo text={todo} />}
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MyBids({ bids }: { bids: FreelancerBid[] }) {
  if (bids.length === 0) {
    return (
      <EmptyState
        title="You haven't placed any bids yet"
        body="Browse open gigs and offer your skills to fellow students."
        href="/gigs"
        cta="Browse gigs"
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {bids.map((bid) => {
        const todo = freelancerTodo(bid);
        const finished = bid.status === "ACCEPTED" && bid.gig.status === "COMPLETED";
        return (
          <li key={bid.id}>
            <Link href={`/gigs/${bid.gig.id}`} className="group block rounded-xl">
              <Card
                className={cn(
                  "gap-2 py-4 transition-colors group-hover:border-foreground/30",
                  bid.status === "REJECTED" && "opacity-60",
                )}
              >
                <CardContent className="flex flex-col gap-2 px-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium">{bid.gig.title}</span>
                    <span className="font-semibold tabular-nums">{formatRupees(bid.amount)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {finished ? <StatusBadge status="COMPLETED" /> : <StatusBadge status={bid.status} />}
                    <Badge variant="outline">{bid.gig.category}</Badge>
                    <span>for {bid.clientName}</span>
                    <span className="flex items-center gap-1">
                      · <Clock className="size-3.5" /> {bid.timeframeDays} {bid.timeframeDays === 1 ? "day" : "days"}
                    </span>
                    <span>· Bid {timeFromNow(bid.createdAt)}</span>
                  </div>
                  {todo && <Todo text={todo} />}
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/dashboard");
  const tab: Tab = (await searchParams).tab === "bids" ? "bids" : "posted";

  const postedGigs = listGigsByClient(user.id);
  const myBids = listBidsByFreelancer(user.id);

  const activeGigs = postedGigs.filter((g) => g.status === "OPEN" || g.status === "IN_PROGRESS").length;
  const won = myBids.filter((b) => b.status === "ACCEPTED");
  const earned = won.filter((b) => b.gig.status === "COMPLETED").reduce((sum, b) => sum + b.amount, 0);
  const clientTodos = postedGigs.filter(clientTodo).length;
  const freelancerTodos = myBids.filter(freelancerTodo).length;

  const tabs: { id: Tab; label: string; count: number; todos: number }[] = [
    { id: "posted", label: "My posted gigs", count: postedGigs.length, todos: clientTodos },
    { id: "bids", label: "My bids", count: myBids.length, todos: freelancerTodos },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hi, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted-foreground">Everything you&apos;ve posted and bid on, in one place.</p>
        </div>
        <Button asChild>
          <Link href="/gigs/new">Post a gig</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Gigs posted" value={postedGigs.length} />
        <Stat label="Active gigs" value={activeGigs} />
        <Stat label="Bids placed" value={myBids.length} />
        <Stat label="Gigs won" value={won.length} />
        <Stat label="Earned" value={formatRupees(earned)} />
      </div>

      {user.rating > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          Your freelancer rating is <span className="font-medium text-foreground">{user.rating.toFixed(1)}</span>
        </p>
      )}

      <div className="flex flex-col gap-4">
        <nav className="inline-flex w-fit rounded-lg bg-muted p-1" aria-label="Dashboard sections">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.id === "posted" ? "/dashboard" : "/dashboard?tab=bids"}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span className="text-xs text-muted-foreground tabular-nums">{t.count}</span>
              {t.todos > 0 && (
                <span
                  className="size-2 rounded-full bg-amber-500"
                  aria-label={`${t.todos} ${t.todos === 1 ? "item needs" : "items need"} your attention`}
                />
              )}
            </Link>
          ))}
        </nav>

        {tab === "posted" ? <PostedGigs gigs={postedGigs} /> : <MyBids bids={myBids} />}
      </div>
    </div>
  );
}
