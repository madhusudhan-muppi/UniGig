import Link from "next/link";
import { CalendarClock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { GigSummary } from "@/db/queries";
import { deadlineLabel, formatRupees, timeFromNow } from "@/lib/format";

export function GigCard({ gig, showStatus = false }: { gig: GigSummary; showStatus?: boolean }) {
  return (
    <Link href={`/gigs/${gig.id}`} className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <Card className="h-full gap-4 transition-colors group-hover:border-foreground/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="leading-snug">{gig.title}</CardTitle>
            <span className="shrink-0 font-semibold tabular-nums">{formatRupees(gig.budget)}</span>
          </div>
          <CardDescription className="line-clamp-2">{gig.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{gig.category}</Badge>
          {showStatus && <StatusBadge status={gig.status} />}
          {gig.deadline && gig.status === "OPEN" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {deadlineLabel(gig.deadline)}
            </span>
          )}
        </CardContent>
        <CardFooter className="mt-auto justify-between text-xs text-muted-foreground">
          <span>
            {gig.client.name}
            {gig.client.dept && ` · ${gig.client.dept}`} · {timeFromNow(gig.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {gig.bidCount} {gig.bidCount === 1 ? "bid" : "bids"}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
