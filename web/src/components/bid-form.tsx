"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { placeBid, type BidFormState } from "@/app/actions/bids";
import { maxBidAmount } from "@/lib/constants";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null;
}

export function BidForm({ gigId, budget }: { gigId: number; budget: number }) {
  const [state, formAction, pending] = useActionState<BidFormState, FormData>(placeBid, {});
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const max = maxBidAmount(budget);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place a bid</CardTitle>
        <CardDescription>
          The client sees your price, timeline and message, and picks one student to hire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} key={JSON.stringify(values)} className="flex flex-col gap-4">
          <input type="hidden" name="gigId" value={gigId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Your price (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                step={1}
                defaultValue={values.amount ?? String(budget)}
                aria-invalid={!!errors.amount}
                required
              />
              <p className="text-xs text-muted-foreground">
                Budget ₹{budget.toLocaleString("en-IN")} · max ₹{max.toLocaleString("en-IN")}
              </p>
              <FieldError errors={errors.amount} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timeframeDays">Days to deliver</Label>
              <Input
                id="timeframeDays"
                name="timeframeDays"
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                step={1}
                placeholder="3"
                defaultValue={values.timeframeDays}
                aria-invalid={!!errors.timeframeDays}
                required
              />
              <FieldError errors={errors.timeframeDays} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Message to the client</Label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Why you're a good fit: related work, how you'll approach it, what you'll deliver…"
              defaultValue={values.message}
              aria-invalid={!!errors.message}
              required
            />
            <FieldError errors={errors.message} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Sending…" : "Send bid"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
