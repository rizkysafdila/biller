import { PageHeaderSkeleton, SessionListSkeleton } from "@/components/skeletons";

export default function SessionsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <SessionListSkeleton rows={5} />
    </div>
  );
}
