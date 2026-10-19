"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/native-select";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";
import { CATEGORIES } from "@/lib/constants";

type Skill = { id: number; name: string; category: string };

export type ProfileValues = {
  name: string;
  email: string;
  phone: string | null;
  dept: string | null;
  studyYear: number | null;
  bio: string | null;
};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null;
}

export function ProfileForm({
  profile,
  allSkills,
  mySkillIds,
}: {
  profile: ProfileValues;
  allSkills: Skill[];
  mySkillIds: number[];
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  const errors = state.fieldErrors ?? {};
  // After a failed save show what was typed; otherwise show the saved profile.
  const v = state.values ?? {
    name: profile.name,
    phone: profile.phone ?? "",
    dept: profile.dept ?? "",
    studyYear: profile.studyYear ? String(profile.studyYear) : "",
    bio: profile.bio ?? "",
  };
  const checked = new Set(state.skillIds ?? mySkillIds);

  const byCategory = allSkills.reduce((groups, skill) => {
    groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
    return groups;
  }, new Map<string, Skill[]>());

  return (
    <form action={formAction} key={JSON.stringify([state.values, mySkillIds])} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
          <CardDescription>
            Your email and phone are private — they are only shown to someone after a hire.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={v.name} aria-invalid={!!errors.name} required />
              <FieldError errors={errors.name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled readOnly />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={v.phone} aria-invalid={!!errors.phone} required />
              <FieldError errors={errors.phone} />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dept">Department</Label>
                <Input id="dept" name="dept" placeholder="e.g. CSE" defaultValue={v.dept} aria-invalid={!!errors.dept} />
                <FieldError errors={errors.dept} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="studyYear">Year</Label>
                <NativeSelect id="studyYear" name="studyYear" defaultValue={v.studyYear} aria-invalid={!!errors.studyYear}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={errors.studyYear} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">
              Bio <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="What you're good at, past work, tools you use…"
              defaultValue={v.bio}
              aria-invalid={!!errors.bio}
            />
            <FieldError errors={errors.bio} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Pick what you can offer. Clients see these on your profile and when you bid.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {[...byCategory].map(([category, list]) => (
            <fieldset key={category} className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-muted-foreground">{category}</legend>
              <div className="flex flex-wrap gap-2">
                {list.map((skill) => (
                  <label key={skill.id} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill.id}
                      defaultChecked={checked.has(skill.id)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex rounded-full border px-3 py-1 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                      {skill.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <FieldError errors={errors.skillIds} />

          <div className="flex flex-col gap-2 border-t pt-4">
            <Label htmlFor="newSkill">
              Add a skill that isn&apos;t listed <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="newSkill"
                name="newSkill"
                placeholder="e.g. Guitar lessons"
                defaultValue={state.values?.newSkill}
                aria-invalid={!!errors.newSkill}
                className="sm:flex-1"
              />
              <NativeSelect
                name="newSkillCategory"
                aria-label="Category for the new skill"
                defaultValue={state.values?.newSkillCategory ?? ""}
                aria-invalid={!!errors.newSkillCategory}
              >
                <option value="">Category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <FieldError errors={errors.newSkill ?? errors.newSkillCategory} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {state.saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400" role="status">
            <CheckCircle2 className="size-4" /> Profile saved
          </span>
        )}
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}
