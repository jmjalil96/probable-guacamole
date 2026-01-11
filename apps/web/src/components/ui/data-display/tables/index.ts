// Main component
export { DataTable, type DataTableProps } from "./data-table";

// Sub-components
export { ColumnHeader, type ColumnHeaderProps } from "./column-header";
export { Pagination, type PaginationProps } from "./pagination";
export { ExpandToggle, type ExpandToggleProps } from "./expand-toggle";

// Variants (for custom implementations)
export {
  tableContainerVariants,
  tableScrollVariants,
  tableVariants,
  tableHeaderVariants,
  tableHeaderCellVariants,
  tableRowVariants,
  tableCellVariants,
  tableFooterVariants,
} from "./data-table.variants";

// Re-export TanStack Table utilities for convenience
export {
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
  type ExpandedState,
  type Row,
  type Table,
} from "@tanstack/react-table";
