import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { listAllSkills, listUserSkills } from "@/db/queries";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit profile · UniGig" };

export default async function EditProfilePage() {
  const user = await requireUser("/profile");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
          <p className="mt-1 text-muted-foreground">This is what clients see when you bid on their gigs.</p>
        </div>
        <Link href={`/users/${user.id}`} className="text-sm underline underline-offset-4 hover:text-muted-foreground">
          View public profile
        </Link>
      </div>
      <ProfileForm
        profile={user}
        allSkills={listAllSkills()}
        mySkillIds={listUserSkills(user.id).map((s) => s.id)}
      />
    </div>
  );
}
