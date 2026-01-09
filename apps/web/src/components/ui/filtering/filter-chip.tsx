import { forwardRef, type HTMLAttributes } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChipProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** The filter field name (e.g., "Status", "Date"). */
  label: string;
  /** The filter value to display (e.g., "Open", "Last 7 days"). */
  value?: string;
  /** Callback when the remove button is clicked. If omitted, no remove button is shown. */
  onRemove?: () => void;
}

/**
 * A removable chip displaying an active filter.
 *
 * @example
 * ```tsx
 * <FilterChip label="Status" value="Open" onRemove={() => clearFilter("status")} />
 * <FilterChip label="Assigned to me" onRemove={() => clearFilter("assignee")} />
 * ```
 */
export const FilterChip = forwardRef<HTMLDivElement, FilterChipProps>(
  ({ label, value, onRemove, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full",
          "border border-primary/20 bg-primary/5 px-2.5 py-1",
          "text-xs font-medium tracking-tight",
          "transition-all duration-200 ease-out",
          "hover:border-primary/30 hover:bg-primary/10",
          className
        )}
        {...props}
      >
        <span className="text-text-muted">{label}</span>
        {value && (
          <>
            <span className="text-text-muted/50">:</span>
            <span className="text-text">{value}</span>
          </>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}${value ? `: ${value}` : ""} filter`}
            className={cn(
              "-mr-0.5 ml-0.5 flex h-4 w-4 items-center justify-center",
              "rounded-full text-text-muted/70",
              "transition-all duration-150",
              "hover:bg-alert/10 hover:text-alert",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
          >
            <X size={12} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

FilterChip.displayName = "FilterChip";
