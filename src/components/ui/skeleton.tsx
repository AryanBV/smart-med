import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        shimmer && [
          "before:absolute before:inset-0 before:-translate-x-full",
          "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:animate-shimmer"
        ],
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
