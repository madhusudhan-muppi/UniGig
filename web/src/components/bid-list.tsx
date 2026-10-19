import { Clock, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { GigBid } from "@/db/queries";
import { formatRupees, initials, timeFromNow } from "@/lib/format";

export function FreelancerRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount === 0) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  return (
    <span className="flex items-center gap-1 text-xs">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

/** The gig owner's view of every bid on their gig. */
export function BidList({ bids, budget }: { bids: GigBid[]; budget: number }) {
  if (bids.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="font-medium">No bids yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Students will see your gig on the browse page. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {bids.map((bid) => {
        const diff = bid.amount - budget;
        return (
          <li key={bid.id}>
            <Card className={bid.status === "REJECTED" ? "opacity-60" : undefined}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(bid.freelancer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{bid.freelancer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[bid.freelancer.dept, bid.freelancer.studyYear && `Year ${bid.freelancer.studyYear}`]
                          .filter(Boolean)
                          .join(" · ") || "UniGig member"}
                      </span>
                      <FreelancerRating rating={bid.freelancer.rating} reviewCount={bid.freelancer.reviewCount} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-semibold tabular-nums">{formatRupees(bid.amount)}</span>
                    <span className="text-xs text-muted-foreground">
                      {diff === 0
                        ? "at budget"
                        : diff < 0
                          ? `${formatRupees(-diff)} under budget`
                          : `${formatRupees(diff)} over budget`}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{bid.message}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <StatusBadge status={bid.status} />
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {bid.timeframeDays} {bid.timeframeDays === 1 ? "day" : "days"}
                  </span>
                  <span>Bid {timeFromNow(bid.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
