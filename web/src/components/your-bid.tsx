import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { withdrawBid } from "@/app/actions/bids";
import type { Bid, GigStatus } from "@/db/schema";
import { formatRupees, timeFromNow } from "@/lib/format";

const statusNote = {
  PENDING: "Waiting for the client to choose a student.",
  ACCEPTED: "You got the gig! Get in touch with the client to start.",
  REJECTED: "The client chose another student this time.",
} as const;

/** A freelancer's own bid on a gig, with the option to withdraw while pending. */
export function YourBid({ bid, gigStatus }: { bid: Bid; gigStatus: GigStatus }) {
  const note =
    bid.status === "ACCEPTED" && gigStatus === "COMPLETED"
      ? "Gig completed — nice work!"
      : statusNote[bid.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Your bid</CardTitle>
          <StatusBadge status={bid.status} />
        </div>
        <CardDescription>{note}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-lg font-semibold tabular-nums">{formatRupees(bid.amount)}</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {bid.timeframeDays} {bid.timeframeDays === 1 ? "day" : "days"}
          </span>
          <span className="text-sm text-muted-foreground">Sent {timeFromNow(bid.createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-line">{bid.message}</p>
        {bid.status === "PENDING" && (
          <form action={withdrawBid.bind(null, bid.id)}>
            <Button type="submit" variant="outline" size="sm">
              Withdraw bid
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
