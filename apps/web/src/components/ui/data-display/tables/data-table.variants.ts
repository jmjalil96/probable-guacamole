import { cva } from "class-variance-authority";

/** Container styles for the DataTable wrapper. */
export const tableContainerVariants = cva(
  "w-full overflow-hidden rounded-lg border border-border bg-background flex flex-col"
);

/** Scroll wrapper for horizontal overflow. */
export const tableScrollVariants = cva("flex-1 overflow-auto min-h-0");

/** Styles for the table element. */
export const tableVariants = cva("min-w-full border-collapse");

/** Header row styles. */
export const tableHeaderVariants = cva(
  "sticky top-0 z-10 h-12 border-b border-border bg-table-header-bg"
);

/** Header cell styles. */
export const tableHeaderCellVariants = cva(
  `whitespace-nowrap px-3 text-left text-xs font-semibold uppercase tracking-[0.04em] text-text-muted
   first:pl-3 last:pr-3 sm:px-4 sm:first:pl-4 sm:last:pr-4`,
  {
    variants: {
      sortable: {
        true: "transition-colors hover:text-primary",
        false: "",
      },
      sorted: {
        true: "text-primary",
        false: "",
      },
      width: {
        checkbox: "w-12",
        actions: "w-12",
        auto: "",
      },
    },
    defaultVariants: {
      sortable: false,
      sorted: false,
      width: "auto",
    },
  }
);

/** Body row styles with selection and hover states. */
export const tableRowVariants = cva(
  `h-14 border-b border-border/50 transition-colors last:border-b-0
   hover:bg-table-row-hover
   data-[selected=true]:bg-table-row-selected`
);

/** Body cell styles. */
export const tableCellVariants = cva(
  "whitespace-nowrap px-3 text-sm text-text first:pl-3 last:pr-3 sm:px-4 sm:first:pl-4 sm:last:pr-4",
  {
    variants: {
      width: {
        checkbox: "w-12",
        actions: "w-12",
        auto: "",
      },
    },
    defaultVariants: {
      width: "auto",
    },
  }
);

/** Footer/pagination container styles. */
export const tableFooterVariants = cva(
  "flex min-h-12 items-center justify-between gap-2 border-t border-border bg-table-header-bg px-3 text-sm text-text-muted sm:gap-4 sm:px-4"
);
