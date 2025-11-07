import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
      <Skeleton className="w-full h-48 sm:h-52 md:h-56 lg:h-60" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}
