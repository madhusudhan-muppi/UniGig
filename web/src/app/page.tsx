import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Get things done by fellow students
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Post a gig — a logo, a website, tutoring — and let skilled students on campus bid
        for it. Or put your own skills to work and earn.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/gigs">Browse gigs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/gigs/new">Post a gig</Link>
        </Button>
      </div>
    </section>
  );
}
