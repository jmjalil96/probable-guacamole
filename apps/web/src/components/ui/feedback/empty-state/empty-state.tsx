import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white py-12 text-center",
        className
      )}
    >
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
