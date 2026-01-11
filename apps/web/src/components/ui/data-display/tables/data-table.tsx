import {
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
  type ExpandedState,
  type OnChangeFn,
  type Row,
  type Table,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/inputs";
import {
  tableContainerVariants,
  tableScrollVariants,
  tableVariants,
  tableHeaderVariants,
  tableRowVariants,
  tableCellVariants,
} from "./data-table.variants";
import { ColumnHeader } from "./column-header";
import { Pagination } from "./pagination";

// ===========================================
// Types
// ===========================================

export interface DataTableProps<TData> extends HTMLAttributes<HTMLDivElement> {
  /** Array of data to display. */
  data: TData[];
  /** Column definitions using TanStack Table's ColumnDef. */
  // TanStack Table requires cell value type, but columns have varying types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  /** Function to get unique row ID. @default (row, index) => index */
  getRowId?: (row: TData, index: number) => string;
  /** Callback when a row is clicked. */
  onRowClick?: (row: TData) => void;

  // Server-side controlled state
  /** Current sorting state. */
  sorting?: SortingState;
  /** Callback when sorting changes. */
  onSortingChange?: OnChangeFn<SortingState>;
  /** Current pagination state. */
  pagination?: PaginationState;
  /** Callback when pagination changes. */
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Total page count (required for server-side pagination). */
  pageCount?: number;
  /** Current row selection state. */
  rowSelection?: RowSelectionState;
  /** Callback when row selection changes. */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  // Expansion state (optional)
  /** Current expansion state. */
  expanded?: ExpandedState;
  /** Callback when expansion changes. */
  onExpandedChange?: OnChangeFn<ExpandedState>;
  /** Function to render expanded row content. */
  renderExpandedRow?: (row: Row<TData>) => ReactNode;

  // Feature flags
  /** Enable row selection with checkboxes. @default false */
  enableRowSelection?: boolean;
  /** Enable column sorting. @default false */
  enableSorting?: boolean;
  /** Enable pagination footer. @default false */
  enablePagination?: boolean;

  // Customization
  /** Label for items in pagination (e.g., "claims"). @default "items" */
  itemName?: string;
  /** Total row count for pagination display (when server-side). */
  totalRows?: number;
  /** Content to show when data is empty. @default "No results." */
  emptyState?: ReactNode;
}

// ===========================================
// Helper Components
// ===========================================

interface SelectAllProps<TData> {
  table: Table<TData>;
}

/**
 * Header checkbox for selecting/deselecting all rows.
 */
function SelectAll<TData>({ table }: SelectAllProps<TData>) {
  const isAllSelected = table.getIsAllPageRowsSelected();
  const isSomeSelected = table.getIsSomePageRowsSelected();

  return (
    <Checkbox
      checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
      aria-label="Select all rows"
    />
  );
}

interface SelectRowProps<TData> {
  row: Row<TData>;
}

/**
 * Row checkbox for selecting individual rows.
 */
function SelectRow<TData>({ row }: SelectRowProps<TData>) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(checked) => row.toggleSelected(!!checked)}
      onClick={(e: MouseEvent) => e.stopPropagation()}
      aria-label="Select row"
    />
  );
}

// ===========================================
// Main Component
// ===========================================

/** Check if click target is an interactive element that should not trigger row navigation. */
function isInteractiveTarget(
  target: EventTarget | null,
  row: HTMLElement
): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const interactive = target.closest(
    'a,button,input,select,textarea,[role="button"],[role="link"],[data-row-nav="ignore"]'
  );
  // Exclude the row itself (which has role="button")
  return !!interactive && interactive !== row;
}

/**
 * A reusable data table component built on TanStack Table.
 * Supports server-side sorting, pagination, and row selection.
 *
 * @example
 * ```tsx
 * const columns = [
 *   columnHelper.accessor("name", { header: "Name" }),
 *   columnHelper.accessor("status", { header: "Status" }),
 * ];
 *
 * <DataTable
 *   data={claims}
 *   columns={columns}
 *   onRowClick={(row) => navigate({ to: `/claims/${row.id}` })}
 *   sorting={sorting}
 *   onSortingChange={setSorting}
 *   enableSorting
 * />
 * ```
 */
function DataTableRoot<TData>(
  {
    data,
    columns,
    getRowId,
    onRowClick,
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
    pageCount = -1,
    rowSelection,
    onRowSelectionChange,
    expanded,
    onExpandedChange,
    renderExpandedRow,
    enableRowSelection = false,
    enableSorting = false,
    enablePagination = false,
    itemName = "items",
    totalRows,
    emptyState,
    className,
    ...props
  }: DataTableProps<TData>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Determine if expansion is enabled
  const enableExpansion = expanded !== undefined;

  // TanStack Table returns non-memoizable functions, incompatible with React Compiler
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSubRows: (row) => (row as { subRows?: TData[] }).subRows,
    ...(enableExpansion && { getExpandedRowModel: getExpandedRowModel() }),

    // Server-side modes
    manualSorting: true,
    manualPagination: true,
    manualExpanding: false, // Client-side expansion

    // Controlled state (never pass undefined)
    state: {
      sorting: sorting ?? [],
      pagination: pagination ?? { pageIndex: 0, pageSize: 10 },
      rowSelection: rowSelection ?? {},
      ...(enableExpansion && { expanded }),
    },
    ...(onSortingChange && { onSortingChange }),
    ...(onPaginationChange && { onPaginationChange }),
    ...(onRowSelectionChange && { onRowSelectionChange }),
    ...(onExpandedChange && { onExpandedChange }),

    // Configuration
    enableRowSelection,
    enableSorting,
    enableSortingRemoval: false, // Only toggle asc/desc, never unsorted
    ...(getRowId && { getRowId }),
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();
  const selectedCount = Object.keys(rowSelection ?? {}).length;
  const displayTotalRows = totalRows ?? data.length;

  return (
    <div
      ref={ref}
      className={cn(tableContainerVariants(), className)}
      {...props}
    >
      <div className={tableScrollVariants()}>
        <table className={tableVariants()}>
          {/* Header */}
          <thead className={tableHeaderVariants()}>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const width =
                    header.id === "select"
                      ? "checkbox"
                      : header.id === "actions"
                        ? "actions"
                        : "auto";

                  const sortHandler = canSort
                    ? header.column.getToggleSortingHandler()
                    : undefined;

                  return (
                    <ColumnHeader
                      key={header.id}
                      sorted={canSort ? sorted : false}
                      {...(sortHandler && { onSort: sortHandler })}
                      width={width}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </ColumnHeader>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-text-muted"
                >
                  {emptyState ?? "No results."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelected = enableRowSelection
                  ? row.getIsSelected()
                  : false;
                const isExpanded = enableExpansion && row.getIsExpanded();
                const isChildRow = row.depth > 0;

                const handleRowClick = onRowClick
                  ? (e: MouseEvent<HTMLTableRowElement>) => {
                      if (isInteractiveTarget(e.target, e.currentTarget))
                        return;
                      onRowClick(row.original);
                    }
                  : undefined;

                const handleRowKeyDown = onRowClick
                  ? (e: KeyboardEvent<HTMLTableRowElement>) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row.original);
                      }
                    }
                  : undefined;

                return (
                  <Fragment key={row.id}>
                    <tr
                      data-selected={isSelected}
                      data-expanded={isExpanded}
                      className={cn(
                        tableRowVariants(),
                        isChildRow &&
                          "bg-surface-muted/50 h-12 border-l-2 border-primary/10",
                        onRowClick &&
                          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                      )}
                      onClick={handleRowClick}
                      onKeyDown={handleRowKeyDown}
                      tabIndex={onRowClick ? 0 : undefined}
                      role={onRowClick ? "button" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={tableCellVariants({
                            width:
                              cell.column.id === "select"
                                ? "checkbox"
                                : cell.column.id === "actions"
                                  ? "actions"
                                  : cell.column.id === "expand"
                                    ? "checkbox"
                                    : "auto",
                          })}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {/* Expanded row content */}
                    {isExpanded && renderExpandedRow && (
                      <tr className="bg-white">
                        <td colSpan={columns.length} className="p-0">
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {enablePagination && pagination && (
        <Pagination
          pageIndex={pagination.pageIndex}
          pageCount={table.getPageCount()}
          totalRows={displayTotalRows}
          selectedCount={selectedCount}
          itemName={itemName}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          pageSize={pagination.pageSize}
          {...(onPaginationChange && {
            onPageSizeChange: (size: number) =>
              onPaginationChange({ pageIndex: 0, pageSize: size }),
          })}
        />
      )}
    </div>
  );
}

// ===========================================
// Compound Component Export
// ===========================================

export const DataTable = Object.assign(
  forwardRef(DataTableRoot) as <TData>(
    props: DataTableProps<TData> & { ref?: React.ForwardedRef<HTMLDivElement> }
  ) => ReturnType<typeof DataTableRoot>,
  {
    SelectAll,
    SelectRow,
  }
);
