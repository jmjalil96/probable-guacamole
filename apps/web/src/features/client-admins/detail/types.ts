import type { ClientAdmin } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { OpenState } from "@/lib/hooks";
import type { ClientAdminFormData } from "./schema";

// =============================================================================
// Form Error
// =============================================================================

export interface FormError {
  title: string;
  description?: string;
  items?: string[];
}

// =============================================================================
// Tab State
// =============================================================================

export type ClientAdminDetailTab = "general" | "clients";

export interface TabState {
  activeTab: ClientAdminDetailTab;
  setActiveTab: (tab: ClientAdminDetailTab) => void;
}

// =============================================================================
// Modal State
// =============================================================================

export interface ModalState {
  editModal: OpenState;
}

// =============================================================================
// Form Return Type
// =============================================================================

export interface UseClientAdminFormReturn {
  control: Control<ClientAdminFormData>;
  handleSubmit: UseFormHandleSubmit<ClientAdminFormData>;
  errors: FieldErrors<ClientAdminFormData>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  clearFormError: () => void;
  onSubmit: (data: ClientAdminFormData) => Promise<void>;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseClientAdminDetailReturn {
  // Data
  clientAdmin: ClientAdmin | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Tab State
  tabState: TabState;

  // Modal State
  modalState: ModalState;

  // Navigation
  navigateBack: () => void;
}
