import type { Client } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { OpenState } from "@/lib/hooks";
import type { ClientFormData } from "./schema";

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

export interface ModalState {
  editModal: OpenState;
}

// =============================================================================
// Delete State
// =============================================================================

export interface DeleteState {
  open: boolean;
  isDeleting: boolean;
}

// =============================================================================
// Form Return Type
// =============================================================================

export interface UseClientFormReturn {
  control: Control<ClientFormData>;
  handleSubmit: UseFormHandleSubmit<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  clearFormError: () => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseClientDetailReturn {
  // Data
  client: Client | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Modal State
  modalState: ModalState;

  // Delete State
  deleteState: DeleteState;
  deleteHandlers: {
    openDelete: () => void;
    confirmDelete: () => void;
    cancelDelete: () => void;
  };

  // Navigation
  navigateBack: () => void;
}
