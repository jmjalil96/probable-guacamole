// Main Component (entry point for tab)
export { ClaimDocumentsTab } from "./components";

// Sub-Components
export {
  DocumentsTabHeader,
  DocumentRowActions,
  DocumentsTable,
  DocumentUploadModal,
  DocumentDeleteDialog,
} from "./components";

// Column Definitions
export { documentColumns, documentColumnHelper } from "./columns";

// Hooks
export { useDocumentsTab, useDocumentUpload } from "./hooks";

// Types
export type {
  FormError,
  DocumentModalState,
  DocumentModalHandlers,
  DocumentDeleteState,
  DocumentDeleteHandlers,
  UseDocumentsTabReturn,
  DocumentsTabHeaderProps,
  DocumentsTableProps,
  DocumentRowActionsProps,
  DocumentUploadModalProps,
  DocumentDeleteDialogProps,
  ClaimDocumentsTabProps,
} from "./types";
