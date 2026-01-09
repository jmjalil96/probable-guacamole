import { forwardRef, type HTMLAttributes } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tableFooterVariants } from "./data-table.variants";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  /** Current page index (0-based). */
  pageIndex: number;
  /** Total number of pages. */
  pageCount: number;
  /** Total number of rows across all pages. */
  totalRows: number;
  /** Number of currently selected rows. */
  selectedCount?: number;
  /** Label for items (e.g., "claims", "invoices"). @default "items" */
  itemName?: string;
  /** Whether previous page is available. */
  canPreviousPage: boolean;
  /** Whether next page is available. */
  canNextPage: boolean;
  /** Callback to go to previous page. */
  onPreviousPage: () => void;
  /** Callback to go to next page. */
  onNextPage: () => void;
  /** Current page size. */
  pageSize?: number;
  /** Callback when page size changes. */
  onPageSizeChange?: (size: number) => void;
  /** Available page size options. @default [10, 20, 50, 100] */
  pageSizeOptions?: number[];
}

/**
 * Pagination footer for DataTable.
 * Shows selection count and page navigation controls.
 *
 * @example
 * ```tsx
 * <Pagination
 *   pageIndex={0}
 *   pageCount={5}
 *   totalRows={50}
 *   selectedCount={3}
 *   itemName="claims"
 *   canPreviousPage={false}
 *   canNextPage={true}
 *   onPreviousPage={() => table.previousPage()}
 *   onNextPage={() => table.nextPage()}
 * />
 * ```
 */
export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      pageIndex,
      pageCount,
      totalRows,
      selectedCount = 0,
      itemName = "items",
      canPreviousPage,
      canNextPage,
      onPreviousPage,
      onNextPage,
      pageSize,
      onPageSizeChange,
      pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
      className,
      ...props
    },
    ref
  ) => {
    const displayPage = pageIndex + 1;
    const showPageSizeSelector =
      pageSize !== undefined && onPageSizeChange !== undefined;

    return (
      <div
        ref={ref}
        className={cn(tableFooterVariants(), className)}
        {...props}
      >
        {/* Left: Selection/count info */}
        <div className="font-medium">
          {selectedCount > 0
            ? `${selectedCount} de ${totalRows.toLocaleString()} seleccionados`
            : `${totalRows.toLocaleString()} ${itemName}`}
        </div>

        {/* Right: Page size selector + Page navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Page size selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-2">
              <span className="hidden text-text-muted sm:inline">
                Filas por página
              </span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                aria-label="Filas por página"
                className={cn(
                  "h-8 rounded-md border border-border bg-background px-2 text-sm tabular-nums",
                  "transition-colors",
                  "hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                )}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={!canPreviousPage}
              aria-label="Página anterior"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background",
                "transition-colors",
                "hover:border-primary",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>

            <span className="px-1 tabular-nums sm:px-2">
              <span className="sm:hidden">
                {pageCount > 0 ? `${displayPage}/${pageCount}` : displayPage}
              </span>
              <span className="hidden sm:inline">
                {pageCount > 0
                  ? `Página ${displayPage} de ${pageCount}`
                  : `Página ${displayPage}`}
              </span>
            </span>

            <button
              type="button"
              onClick={onNextPage}
              disabled={!canNextPage}
              aria-label="Página siguiente"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background",
                "transition-colors",
                "hover:border-primary",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

Pagination.displayName = "Pagination";
