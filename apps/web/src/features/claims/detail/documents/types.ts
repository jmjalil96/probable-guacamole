import type { ClaimFile } from "shared";

// =============================================================================
// Form Error (shared with invoices)
// =============================================================================

export interface FormError {
  title: string;
  description?: string;
  items?: string[];
}

// =============================================================================
// Modal State
// =============================================================================

export interface DocumentModalState {
  open: boolean;
  /** Key that increments on each open - use as component key to reset state */
  key: number;
}

export interface DocumentModalHandlers {
  open: () => void;
  close: () => void;
}

// =============================================================================
// Delete State
// =============================================================================

export interface DocumentDeleteState {
  open: boolean;
  document: ClaimFile | null;
  isDeleting: boolean;
}

export interface DocumentDeleteHandlers {
  openDelete: (document: ClaimFile) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseDocumentsTabReturn {
  // Data
  documents: ClaimFile[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;

  // Upload Modal
  modalState: DocumentModalState;
  modalHandlers: DocumentModalHandlers;

  // Delete Dialog
  deleteState: DocumentDeleteState;
  deleteHandlers: DocumentDeleteHandlers;

  // Download
  downloadDocument: (document: ClaimFile) => Promise<void>;
}

// =============================================================================
// Component Props
// =============================================================================

export interface DocumentsTabHeaderProps {
  count: number;
  onUpload: () => void;
}

export interface DocumentsTableProps {
  data: ClaimFile[];
  onDownload: (document: ClaimFile) => void;
  onDelete: (document: ClaimFile) => void;
  emptyState?: string;
}

export interface DocumentRowActionsProps {
  document: ClaimFile;
  onDownload: (document: ClaimFile) => void;
  onDelete: (document: ClaimFile) => void;
}

export interface DocumentUploadModalProps {
  open: boolean;
  claimId: string;
  onClose: () => void;
}

export interface DocumentDeleteDialogProps {
  open: boolean;
  document: ClaimFile | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ClaimDocumentsTabProps {
  claimId: string;
}
