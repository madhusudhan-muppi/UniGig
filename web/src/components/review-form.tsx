"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview, type ReviewFormState } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

const LABELS = ["", "Poor", "Below expectations", "Okay", "Good", "Excellent"];

export function ReviewForm({ gigId, freelancerName }: { gigId: number; freelancerName: string }) {
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(submitReview, {});
  const [rating, setRating] = useState(Number(state.values?.rating) || 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  const errors = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate {freelancerName}&apos;s work</CardTitle>
        <CardDescription>Your review appears on their profile and updates their rating.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="gigId" value={gigId} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Rating</legend>
            <div className="flex items-center gap-3">
              {/* Real radio buttons (keyboard and no-JS friendly) drawn as stars. */}
              <div className="flex" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                    <input
                      type="radio"
                      name="rating"
                      value={n}
                      className="peer sr-only"
                      defaultChecked={rating === n}
                      onChange={() => setRating(n)}
                      required
                    />
                    <Star
                      className={cn(
                        "size-7 rounded-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                        n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                      )}
                    />
                    <span className="sr-only">
                      {n} {n === 1 ? "star" : "stars"}
                    </span>
                  </label>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{LABELS[shown]}</span>
            </div>
            {errors.rating?.[0] && <p className="text-sm text-destructive">{errors.rating[0]}</p>}
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment">
              Comment <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="comment"
              name="comment"
              rows={3}
              placeholder="How was the work, communication and timing?"
              defaultValue={state.values?.comment}
            />
            {errors.comment?.[0] && <p className="text-sm text-destructive">{errors.comment[0]}</p>}
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
