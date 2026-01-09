import { forwardRef, type ReactNode, type ThHTMLAttributes } from "react";
import { type VariantProps } from "class-variance-authority";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { tableHeaderCellVariants } from "./data-table.variants";

export interface ColumnHeaderProps
  extends
    Omit<ThHTMLAttributes<HTMLTableCellElement>, "children">,
    Pick<VariantProps<typeof tableHeaderCellVariants>, "width"> {
  children: ReactNode;
  /** Current sort direction, or false if not sorted. */
  sorted?: false | "asc" | "desc";
  /** Callback when header is clicked for sorting. Receives the click event. */
  onSort?: (event: unknown) => void;
  /** Additional class names. */
  className?: string;
}

/**
 * A sortable column header cell for DataTable.
 * Displays a sort indicator that rotates based on sort direction.
 * Sortable headers render a button for keyboard accessibility.
 *
 * @example
 * ```tsx
 * <ColumnHeader sorted="asc" onSort={() => handleSort("name")}>
 *   Name
 * </ColumnHeader>
 * ```
 */
export const ColumnHeader = forwardRef<HTMLTableCellElement, ColumnHeaderProps>(
  ({ children, sorted = false, onSort, width, className, ...props }, ref) => {
    const isSortable = !!onSort;
    const isSorted = sorted !== false;

    const content = (
      <>
        <span>{children}</span>
        {isSortable && (
          <ChevronUp
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 transition-all duration-150",
              isSorted ? "opacity-100" : "opacity-40",
              sorted === "desc" && "rotate-180"
            )}
          />
        )}
      </>
    );

    return (
      <th
        ref={ref}
        className={cn(
          tableHeaderCellVariants({
            sortable: isSortable,
            sorted: isSorted,
            width,
          }),
          className
        )}
        aria-sort={
          sorted === "asc"
            ? "ascending"
            : sorted === "desc"
              ? "descending"
              : undefined
        }
        {...props}
      >
        {isSortable ? (
          <button
            type="button"
            onClick={onSort}
            className={cn(
              "flex w-full items-center gap-1.5 text-left",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
            )}
          >
            {content}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">{content}</div>
        )}
      </th>
    );
  }
);

ColumnHeader.displayName = "ColumnHeader";
