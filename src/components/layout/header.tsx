import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">smart-med</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>
        <div className="md:hidden flex items-center gap-2">
          {user && <UserMenu user={user} />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
