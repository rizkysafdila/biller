import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalysisLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-6 w-48" />
      <div className="flex items-center justify-between">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="size-7 rounded-md" />
      </div>
      <Card>
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-40" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
