import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="text-6xl font-bold text-muted-foreground/40">404</span>
      <h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="max-w-sm text-muted-foreground">
        The gig or profile may have been removed, or the link is wrong.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/gigs">Browse gigs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
