import { AlertCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export interface LookupErrorProps {
  /** Error message to display */
  message: string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Whether a fetch is in progress (shows spinner) */
  isFetching?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A reusable error state component for failed async lookups.
 * Shows an error message with a retry button.
 */
export function LookupError({
  message,
  onRetry,
  isFetching = false,
  className,
}: LookupErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-alert/5 px-3 py-2 text-sm text-alert",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRetry}
        disabled={isFetching}
        className="shrink-0 text-alert hover:text-alert hover:bg-alert/10"
      >
        <RotateCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
        Reintentar
      </Button>
    </div>
  );
}
