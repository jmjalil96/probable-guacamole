import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface ExpandToggleProps {
  /** Whether the row is currently expanded. */
  isExpanded: boolean;
  /** Whether the row can be expanded (has sub-rows). */
  canExpand: boolean;
  /** Callback when the toggle is clicked. */
  onToggle: () => void;
  /** Nesting depth for indentation (0 = top level). */
  depth?: number;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Toggle button for expanding/collapsing table rows.
 * Shows a chevron that rotates when expanded.
 * Returns an empty spacer if the row cannot expand.
 */
export function ExpandToggle({
  isExpanded,
  canExpand,
  onToggle,
  depth = 0,
}: ExpandToggleProps) {
  const indent = depth * 24;

  if (!canExpand) {
    return (
      <span
        className="inline-block w-6"
        style={{ marginLeft: indent }}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded",
        "text-text-muted transition-colors",
        "hover:bg-surface-hover hover:text-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
      style={{ marginLeft: indent }}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? "Collapse row" : "Expand row"}
    >
      <ChevronRight
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          isExpanded && "rotate-90"
        )}
      />
    </button>
  );
}
