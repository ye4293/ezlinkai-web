import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function LogLoading() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-10" />
        </div>

        <Separator />

        {/* Filter bar skeleton */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-[260px]" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-md border">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b bg-muted/50 px-4 py-3">
            {[40, 100, 80, 80, 120, 80, 80, 80, 80].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: w }} />
            ))}
          </div>

          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b px-4 py-3 last:border-0"
            >
              {[40, 100, 80, 80, 120, 80, 80, 80, 80].map((w, j) => (
                <Skeleton key={j} className="h-4" style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
