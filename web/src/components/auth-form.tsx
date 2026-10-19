"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup, type AuthFormState } from "@/app/actions/auth";

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
};

const signupFields: Field[] = [
  { name: "name", label: "Full name", autoComplete: "name", placeholder: "Alice" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "alice@uni.edu" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", placeholder: "98400 11101" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

const loginFields: Field[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "alice@uni.edu" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
];

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    isSignup ? signup : login,
    {},
  );
  const fields = isSignup ? signupFields : loginFields;
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{isSignup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup
            ? "Post gigs, bid on gigs, or both — one account does it all."
            : "Log in to post gigs and place bids."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}
          {fields.map((f) => {
            const error = state.fieldErrors?.[f.name]?.[0];
            return (
              <div key={f.name} className="flex flex-col gap-2">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  defaultValue={f.type === "password" ? undefined : state.values?.[f.name]}
                  aria-invalid={!!error}
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            );
          })}
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New to UniGig? "}
          <Link
            href={`${isSignup ? "/login" : "/signup"}${nextQuery}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
