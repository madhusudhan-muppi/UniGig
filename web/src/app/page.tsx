import Link from "next/link";
import { ArrowRight, Handshake, Megaphone, MessageSquareText, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GigCard } from "@/components/gig-card";
import { getPlatformStats, listOpenGigs, listTopFreelancers } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { formatRupees, initials } from "@/lib/format";

const steps = [
  { icon: Megaphone, title: "Post a gig", body: "Describe the work — a logo, a website, tutoring — and set a budget." },
  { icon: MessageSquareText, title: "Get bids", body: "Students with the right skills send their price, timeline and pitch." },
  { icon: Handshake, title: "Hire", body: "Pick one bid. You both get each other's phone and email to get started." },
  { icon: Star, title: "Review", body: "Mark it done and rate the work. Good ratings help students win more gigs." },
];

export default async function Home() {
  const user = await getCurrentUser();
  const stats = getPlatformStats();
  const latest = listOpenGigs({ limit: 4 });
  const topFreelancers = listTopFreelancers(3);

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 pt-8 text-center sm:pt-12">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          A campus-only freelance and skill exchange
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Get things done by fellow students
        </h1>
        <p className="max-w-xl text-lg text-balance text-muted-foreground">
          Post a gig and let skilled students on campus bid for it — or put your own skills to work and earn.
          One account does both.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/gigs">Browse gigs</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={user ? "/gigs/new" : "/signup"}>{user ? "Post a gig" : "Join UniGig"}</Link>
          </Button>
        </div>
      </section>

      <section aria-label="UniGig in numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open gigs", value: stats.openGigs },
          { label: "Students", value: stats.students },
          { label: "Gigs completed", value: stats.completedGigs },
          { label: "Paid to students", value: formatRupees(stats.paidOut) },
        ].map((s) => (
          <Card key={s.label} className="gap-1 py-5 text-center">
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="text-2xl font-bold tabular-nums sm:text-3xl">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full gap-3 py-5">
                <CardContent className="flex flex-col gap-2 px-5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <step.icon className="size-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Latest open gigs</h2>
          <Link href="/gigs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            See all <ArrowRight className="size-4" />
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {latest.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No open gigs right now — be the first to post one.
          </div>
        )}
      </section>

      {topFreelancers.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Top-rated students</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {topFreelancers.map((f) => (
              <Link key={f.id} href={`/users/${f.id}`} className="group block rounded-xl">
                <Card className="py-4 transition-colors group-hover:border-foreground/30">
                  <CardContent className="flex items-center gap-3 px-4">
                    <Avatar>
                      <AvatarFallback>{initials(f.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{f.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">{f.rating.toFixed(1)}</span>
                        · {f.reviewCount} {f.reviewCount === 1 ? "review" : "reviews"}
                        {f.dept && ` · ${f.dept}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
