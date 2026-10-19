import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BidStatus, GigStatus } from "@/lib/constants";

const styles: Record<GigStatus | BidStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  IN_PROGRESS: { label: "In progress", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  COMPLETED: { label: "Completed", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  CANCELLED: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  REJECTED: { label: "Not selected", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: GigStatus | BidStatus; className?: string }) {
  const { label, className: color } = styles[status];
  return (
    <Badge variant="secondary" className={cn("border-transparent", color, className)}>
      {label}
    </Badge>
  );
}
