import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";
import { getProfile, listReviewsForFreelancer, listUserSkills } from "@/db/queries";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, initials, timeFromNow } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

const loadProfile = async (params: Props["params"]) => {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? getProfile(id) : undefined;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await loadProfile(params);
  return { title: profile ? `${profile.name} · UniGig` : "User not found · UniGig" };
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default async function ProfilePage({ params }: Props) {
  const profile = await loadProfile(params);
  if (!profile) notFound();

  const isMe = (await getCurrentUser())?.id === profile.id;
  const skills = listUserSkills(profile.id);
  const reviews = listReviewsForFreelancer(profile.id);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 text-xl">
                <AvatarFallback>{initials(profile.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
                <span className="text-sm text-muted-foreground">
                  {[profile.dept, profile.studyYear && `Year ${profile.studyYear}`, `Joined ${formatDate(profile.createdAt)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {profile.reviewCount > 0 ? (
                  <span className="flex items-center gap-2 text-sm">
                    <RatingStars value={profile.rating} />
                    <span className="font-medium">{profile.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({profile.reviewCount} {profile.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">No reviews yet</span>
                )}
              </div>
            </div>
            {isMe && (
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">Edit profile</Link>
              </Button>
            )}
          </div>

          {profile.bio && <p className="leading-relaxed whitespace-pre-line">{profile.bio}</p>}

          <div className="flex gap-8">
            <Stat label="Gigs completed" value={profile.gigsCompleted} />
            <Stat label="Gigs posted" value={profile.gigsPosted} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card className="h-fit gap-3">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s.id} variant="secondary" title={s.category}>
                    {s.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isMe ? (
                  <>
                    No skills yet.{" "}
                    <Link href="/profile" className="underline underline-offset-4">
                      Add some
                    </Link>{" "}
                    so clients know what you offer.
                  </>
                ) : (
                  "No skills listed yet."
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Reviews <span className="text-muted-foreground">({reviews.length})</span>
          </h2>
          {reviews.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Card className="gap-2 py-4">
                    <CardContent className="flex flex-col gap-2 px-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/gigs/${review.gig.id}`} className="font-medium hover:underline">
                          {review.gig.title}
                        </Link>
                        <RatingStars value={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-sm leading-relaxed whitespace-pre-line">“{review.comment}”</p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {review.clientName} · {timeFromNow(review.createdAt)}
                      </span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No reviews yet. Reviews appear here after completed gigs.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
