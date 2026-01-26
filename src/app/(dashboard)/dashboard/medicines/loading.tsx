import { Skeleton } from "@/components/ui/skeleton";

export default function MedicinesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div>
        <Skeleton className="h-7 w-48 mb-3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
