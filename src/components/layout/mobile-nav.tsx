"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Pill, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/family", label: "Family", icon: Users },
  { href: "/dashboard/family/tree", label: "Tree", icon: GitBranch },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
  { href: "/dashboard/medicines", label: "Meds", icon: Pill },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px]",
                "text-muted-foreground hover:text-primary transition-all duration-150",
                isActive && "text-primary font-medium"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
