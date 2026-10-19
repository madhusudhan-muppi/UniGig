import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in · UniGig" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));

  return (
    <div className="py-8">
      <AuthForm mode="login" next={next ? safeNext(next) : undefined} />
    </div>
  );
}
