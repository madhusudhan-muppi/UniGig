import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BidForm } from "@/components/bid-form";
import { BidList } from "@/components/bid-list";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ContactCard } from "@/components/contact-card";
import { ReviewCard } from "@/components/review-card";
import { ReviewForm } from "@/components/review-form";
import { StatusBadge } from "@/components/status-badge";
import { YourBid } from "@/components/your-bid";
import { cancelGig } from "@/app/actions/gigs";
import { completeGig } from "@/app/actions/reviews";
import { getContact, getGig, getHire, getReview, getUserBid, listBidsForGig } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { deadlineLabel, formatDate, formatRupees, timeFromNow } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

const loadGig = async (params: Props["params"]) => {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? getGig(id) : undefined;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gig = await loadGig(params);
  return { title: gig ? `${gig.title} · UniGig` : "Gig not found · UniGig" };
}

export default async function GigPage({ params }: Props) {
  const gig = await loadGig(params);
  if (!gig) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === gig.clientId;
  const myBid = user && !isOwner ? getUserBid(gig.id, user.id) : undefined;
  // Contact details are revealed only between the client and the hired freelancer.
  const hire = gig.status === "IN_PROGRESS" || gig.status === "COMPLETED" ? getHire(gig.id) : undefined;
  const clientContact = myBid?.status === "ACCEPTED" ? getContact(gig.clientId) : undefined;
  const review = gig.status === "COMPLETED" ? getReview(gig.id) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/gigs"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to gigs
      </Link>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={gig.status} />
            <Badge variant="outline">{gig.category}</Badge>
            {isOwner && <Badge variant="secondary">Your gig</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{gig.title}</h1>
          <p className="text-sm text-muted-foreground">
            Posted {timeFromNow(gig.createdAt)} · {gig.bidCount} {gig.bidCount === 1 ? "bid" : "bids"}
          </p>
          <Separator />
          <p className="leading-relaxed whitespace-pre-line">{gig.description}</p>

          <section className="mt-4 flex flex-col gap-4">
            {isOwner ? (
              <>
                {hire && gig.status === "COMPLETED" && !review && (
                  <ReviewForm gigId={gig.id} freelancerName={hire.freelancer.name} />
                )}
                {review && <ReviewCard review={review} freelancerName={hire?.freelancer.name} />}
                {hire && (
                  <ContactCard
                    title={`You hired ${hire.freelancer.name}`}
                    description={
                      gig.status === "COMPLETED"
                        ? `Completed for ${formatRupees(hire.amount)}.`
                        : `Agreed price ${formatRupees(hire.amount)}, ${hire.timeframeDays} ${hire.timeframeDays === 1 ? "day" : "days"} to deliver. Contact them to get started, then mark the gig completed once the work is delivered.`
                    }
                    contact={hire.freelancer}
                  />
                )}
                <h2 className="text-xl font-semibold tracking-tight">
                  Bids <span className="text-muted-foreground">({gig.bidCount})</span>
                </h2>
                <BidList bids={listBidsForGig(gig.id)} budget={gig.budget} canHire={gig.status === "OPEN"} />
              </>
            ) : myBid ? (
              <>
                {review && <ReviewCard review={review} freelancerName={hire?.freelancer.name} />}
                {clientContact && (
                  <ContactCard
                    title={gig.status === "COMPLETED" ? "Your client" : "You're hired!"}
                    description={
                      gig.status === "COMPLETED"
                        ? "The client marked this gig completed."
                        : "Reach out to the client to agree on the details and get started."
                    }
                    contact={clientContact}
                  />
                )}
                <YourBid bid={myBid} gigStatus={gig.status} />
              </>
            ) : gig.status !== "OPEN" ? (
              <>
                {review && <ReviewCard review={review} freelancerName={hire?.freelancer.name} />}
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  This gig is no longer accepting bids.
                </p>
              </>
            ) : user ? (
              <BidForm gigId={gig.id} budget={gig.budget} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
                <p className="font-medium">Interested in this gig?</p>
                <Button asChild>
                  <Link href={`/login?next=${encodeURIComponent(`/gigs/${gig.id}`)}`}>Log in to place a bid</Link>
                </Button>
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-3xl font-bold tabular-nums">{formatRupees(gig.budget)}</span>
              {gig.deadline && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" />
                  {formatDate(gig.deadline)}
                  {gig.status === "OPEN" && ` · ${deadlineLabel(gig.deadline)}`}
                </span>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Posted by</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <span className="font-medium">{gig.client.name}</span>
              <span className="text-sm text-muted-foreground">
                {[gig.client.dept, gig.client.studyYear && `Year ${gig.client.studyYear}`]
                  .filter(Boolean)
                  .join(" · ") || "UniGig member"}
              </span>
              {gig.client.rating > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  {gig.client.rating.toFixed(1)} as a freelancer
                </span>
              )}
            </CardContent>
          </Card>

          {isOwner && (gig.status === "OPEN" || gig.status === "IN_PROGRESS") && (
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Manage gig</CardTitle>
              </CardHeader>
              <CardContent>
                {gig.status === "OPEN" ? (
                  <form action={cancelGig.bind(null, gig.id)}>
                    <ConfirmSubmit
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive"
                      pendingLabel="Cancelling…"
                      confirm="Cancel this gig? It will be removed from the browse page and pending bids will be declined."
                    >
                      Cancel gig
                    </ConfirmSubmit>
                  </form>
                ) : (
                  <form action={completeGig.bind(null, gig.id)} className="flex flex-col gap-2">
                    <ConfirmSubmit
                      size="sm"
                      className="w-full"
                      pendingLabel="Saving…"
                      confirm="Mark this gig as completed? Do this once the work has been delivered."
                    >
                      Mark as completed
                    </ConfirmSubmit>
                    <p className="text-xs text-muted-foreground">
                      Once completed, you can leave a review for the freelancer.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
