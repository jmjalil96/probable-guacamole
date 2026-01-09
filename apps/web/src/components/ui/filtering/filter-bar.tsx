import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * A horizontal bar for organizing filter controls.
 * Use compound components for layout: `FilterBar.Divider` and `FilterBar.Spacer`.
 *
 * @example
 * ```tsx
 * <FilterBar>
 *   <SearchInput />
 *   <FilterBar.Divider />
 *   <DateRangePicker />
 *   <FilterBar.Spacer />
 *   <ViewToggle />
 * </FilterBar>
 * ```
 */
const FilterBarRoot = forwardRef<HTMLDivElement, FilterBarProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-14 items-center gap-3 border-b border-border bg-background px-4 sm:gap-4 sm:px-6 lg:px-8",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
FilterBarRoot.displayName = "FilterBar";

/** A vertical divider line for separating filter groups. */
function Divider() {
  return <div className="h-6 w-px bg-border" />;
}
Divider.displayName = "FilterBar.Divider";

/** A flexible spacer that pushes subsequent items to the right. */
function Spacer() {
  return <div className="flex-1" />;
}
Spacer.displayName = "FilterBar.Spacer";

export const FilterBar = Object.assign(FilterBarRoot, {
  Divider,
  Spacer,
});
