export default function GlucoseLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-8 w-12 bg-muted rounded animate-pulse mt-2" />
            <div className="h-3 w-10 bg-muted rounded animate-pulse mt-1" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="h-40 bg-muted/50 rounded animate-pulse" />
      </div>

      {/* List skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-16 bg-muted rounded animate-pulse" />
              <div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse mt-1" />
              </div>
            </div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
