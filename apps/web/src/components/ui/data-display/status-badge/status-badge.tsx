import { cn } from "@/lib/utils";

export interface StatusBadgeProps<TStatus extends string = string> {
  status: TStatus;
  styles: Record<TStatus, string>;
  labels: Record<TStatus, string>;
  className?: string;
}

export function StatusBadge<TStatus extends string>({
  status,
  styles,
  labels,
  className,
}: StatusBadgeProps<TStatus>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
