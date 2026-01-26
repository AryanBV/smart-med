import { Skeleton } from "@/components/ui/skeleton";

export default function InteractionsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      <Skeleton className="h-24 w-full rounded-lg" />

      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid gap-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
