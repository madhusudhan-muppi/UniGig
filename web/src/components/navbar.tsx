import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Uni<span className="text-primary/60">Gig</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/gigs">Browse gigs</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/gigs/new">Post a gig</Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
