"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { CATEGORIES, skills, users, userSkills } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type ProfileFormState = {
  saved?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
  skillIds?: number[];
};

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((s) => s || null);

const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\- ]{7,15}$/, "Enter a valid phone number"),
    dept: optionalText(40, "Keep the department under 40 characters"),
    studyYear: z
      .string()
      .transform((s) => (s ? Number(s) : null))
      .refine((n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 5), "Pick a year from 1 to 5"),
    bio: optionalText(300, "Keep your bio under 300 characters"),
    skillIds: z.array(z.coerce.number().int().positive()).max(30, "Pick at most 30 skills"),
    newSkill: optionalText(30, "Keep the skill name under 30 characters"),
    newSkillCategory: z.enum(CATEGORIES).or(z.literal("")),
  })
  .refine((d) => !d.newSkill || d.newSkillCategory, {
    path: ["newSkillCategory"],
    message: "Pick a category for the new skill",
  });

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser("/profile");
  const values = Object.fromEntries(
    ["name", "phone", "dept", "studyYear", "bio", "newSkill", "newSkillCategory"].map((k) => [
      k,
      String(formData.get(k) ?? ""),
    ]),
  );
  const skillIds = formData.getAll("skills").map(Number);

  const parsed = profileSchema.safeParse({ ...values, skillIds });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values, skillIds };
  }
  const { newSkill, newSkillCategory, skillIds: chosen, ...profile } = parsed.data;

  db.transaction((tx) => {
    tx.update(users).set(profile).where(eq(users.id, user.id)).run();

    const ids = new Set(chosen);
    if (newSkill) {
      // Reuse an existing skill with the same name (case-insensitive) instead of duplicating it.
      const existing = tx
        .select({ id: skills.id })
        .from(skills)
        .where(sql`lower(${skills.name}) = ${newSkill.toLowerCase()}`)
        .get();
      ids.add(
        existing?.id ??
          tx
            .insert(skills)
            .values({ name: newSkill, category: newSkillCategory })
            .returning({ id: skills.id })
            .get().id,
      );
    }

    // Replace the user's skills with the chosen ones (ignoring ids that don't exist).
    const valid = ids.size
      ? tx.select({ id: skills.id }).from(skills).where(inArray(skills.id, [...ids])).all()
      : [];
    tx.delete(userSkills).where(eq(userSkills.userId, user.id)).run();
    if (valid.length) {
      tx.insert(userSkills)
        .values(valid.map((s) => ({ userId: user.id, skillId: s.id })))
        .run();
    }
  });

  revalidatePath("/", "layout");
  return { saved: true };
}
