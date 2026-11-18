import { Badge } from "@/components/ui/badge";
import { PRIORITIES, STATUSES, labelOf } from "@/lib/constants";

const statusVariant = {
  nowe: "blue",
  w_realizacji: "amber",
  zamkniete: "green",
} as const;

const priorityVariant = {
  niski: "gray",
  sredni: "amber",
  wysoki: "red",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariant[status as keyof typeof statusVariant] ?? "gray";
  return <Badge variant={variant}>{labelOf(STATUSES, status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant = priorityVariant[priority as keyof typeof priorityVariant] ?? "gray";
  return <Badge variant={variant}>{labelOf(PRIORITIES, priority)}</Badge>;
}
