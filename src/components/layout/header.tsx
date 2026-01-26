import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">smart-med</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
            Dashboard
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary">
            Login
          </Link>
          <ThemeToggle />
        </nav>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
