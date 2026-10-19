import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";
import type { Review } from "@/db/schema";
import { timeFromNow } from "@/lib/format";

/** A client's review of the freelancer they hired for this gig. */
export function ReviewCard({
  review,
  freelancerName,
}: {
  review: Pick<Review, "rating" | "comment" | "createdAt"> & { clientName: string };
  freelancerName?: string;
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">
          {freelancerName ? `Review for ${freelancerName}` : "Client review"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <RatingStars value={review.rating} />
          <span className="text-sm font-medium">{review.rating}/5</span>
        </div>
        {review.comment && <p className="text-sm leading-relaxed whitespace-pre-line">“{review.comment}”</p>}
        <p className="text-xs text-muted-foreground">
          {review.clientName} · {timeFromNow(review.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
