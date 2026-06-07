import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function ParticipantAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback
        style={{ backgroundColor: color }}
        className="text-[0.7rem] font-semibold text-white"
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
