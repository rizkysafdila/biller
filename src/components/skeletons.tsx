import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Reusable loading placeholders that mirror the real pages, so route-level
// `loading.tsx` files show an instant, layout-matching skeleton during
// client-side transitions.

export function SessionRowSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-1.5 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="size-5 rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="size-5 rounded-md" />
      </CardContent>
    </Card>
  );
}

export function SessionListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SessionRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-7 w-16 rounded-lg" />
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="mt-1 h-9 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
