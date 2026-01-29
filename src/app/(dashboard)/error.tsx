"use client";

import Link from "next/link";

export default function DashboardError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard Error</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Something went wrong loading this page. You can try again or return to the dashboard.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 min-h-[44px]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 border rounded-md hover:bg-muted min-h-[44px] flex items-center"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
