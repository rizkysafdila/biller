import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { SessionListSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Card className="border-0">
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>

      <SessionListSkeleton />
    </div>
  );
}
