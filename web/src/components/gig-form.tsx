"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import { createGig, type GigFormState } from "@/app/actions/gigs";
import { CATEGORIES } from "@/lib/constants";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null;
}

export function GigForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState<GigFormState, FormData>(createGig, {});
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    // key resets uncontrolled inputs to the returned values after each submit.
    <form action={formAction} key={JSON.stringify(values)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Logo for the photography club"
          defaultValue={values.title}
          aria-invalid={!!errors.title}
          required
        />
        <FieldError errors={errors.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="What do you need, what should be delivered, any style or tools to use…"
          defaultValue={values.description}
          aria-invalid={!!errors.description}
          required
        />
        <FieldError errors={errors.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <NativeSelect
            id="category"
            name="category"
            defaultValue={values.category ?? ""}
            aria-invalid={!!errors.category}
            required
          >
            <option value="" disabled>
              Choose…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={errors.category} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="budget">Budget (₹)</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            inputMode="numeric"
            min={50}
            max={100000}
            step={1}
            placeholder="500"
            defaultValue={values.budget}
            aria-invalid={!!errors.budget}
            required
          />
          <FieldError errors={errors.budget} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="deadline">
            Deadline <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            min={today}
            defaultValue={values.deadline}
            aria-invalid={!!errors.deadline}
          />
          <FieldError errors={errors.deadline} />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Posting…" : "Post gig"}
      </Button>
    </form>
  );
}
