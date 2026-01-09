import type { ClaimInvoice } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { InvoiceFormData } from "./schema";

// =============================================================================
// Form Error
// =============================================================================

export interface FormError {
  title: string;
  description?: string;
  items?: string[];
}

// =============================================================================
// Modal State
// =============================================================================

export interface InvoiceModalState {
  open: boolean;
  invoice: ClaimInvoice | null; // null = create, value = edit
  /** Key that increments on each open - use as component key to reset state */
  key: number;
}

export interface InvoiceModalHandlers {
  openAdd: () => void;
  openEdit: (invoice: ClaimInvoice) => void;
  close: () => void;
}

// =============================================================================
// Delete State
// =============================================================================

export interface InvoiceDeleteState {
  open: boolean;
  invoice: ClaimInvoice | null;
  isDeleting: boolean;
}

export interface InvoiceDeleteHandlers {
  openDelete: (invoice: ClaimInvoice) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

// =============================================================================
// Form Hook Return Type
// =============================================================================

export interface UseInvoiceFormReturn {
  control: Control<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  handleSubmit: UseFormHandleSubmit<InvoiceFormData>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  clearFormError: () => void;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseInvoicesTabReturn {
  // Data
  invoices: ClaimInvoice[];
  total: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;

  // Add/Edit Modal
  modalState: InvoiceModalState;
  modalHandlers: InvoiceModalHandlers;

  // Delete Dialog
  deleteState: InvoiceDeleteState;
  deleteHandlers: InvoiceDeleteHandlers;
}

// =============================================================================
// Component Props
// =============================================================================

export interface InvoicesTabHeaderProps {
  total: string;
  onAdd: () => void;
}

export interface InvoicesTableProps {
  data: ClaimInvoice[];
  onEdit: (invoice: ClaimInvoice) => void;
  onDelete: (invoice: ClaimInvoice) => void;
  emptyState?: string;
}

export interface InvoiceRowActionsProps {
  invoice: ClaimInvoice;
  onEdit: (invoice: ClaimInvoice) => void;
  onDelete: (invoice: ClaimInvoice) => void;
}

export interface InvoiceModalProps {
  open: boolean;
  invoice: ClaimInvoice | null;
  claimId: string;
  onClose: () => void;
}

export interface InvoiceFormProps {
  control: Control<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  onSubmit: (e: React.FormEvent) => void;
}

export interface InvoiceDeleteDialogProps {
  open: boolean;
  invoice: ClaimInvoice | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ClaimInvoicesTabProps {
  claimId: string;
}
