// Main Component (entry point for tab)
export { ClaimInvoicesTab } from "./components";

// Sub-Components
export {
  InvoicesTabHeader,
  InvoicesTable,
  InvoiceRowActions,
  InvoiceModal,
  InvoiceForm,
  InvoiceDeleteDialog,
} from "./components";

// Column Definitions
export { invoiceColumns, invoiceColumnHelper } from "./columns";

// Hooks
export { useInvoicesTab, useInvoiceForm } from "./hooks";

// Types
export type {
  FormError,
  InvoiceModalState,
  InvoiceModalHandlers,
  InvoiceDeleteState,
  InvoiceDeleteHandlers,
  UseInvoiceFormReturn,
  UseInvoicesTabReturn,
  InvoicesTabHeaderProps,
  InvoicesTableProps,
  InvoiceRowActionsProps,
  InvoiceModalProps,
  InvoiceFormProps,
  InvoiceDeleteDialogProps,
  ClaimInvoicesTabProps,
} from "./types";

// Schema
export { invoiceFormSchema } from "./schema";
export type { InvoiceFormData } from "./schema";
