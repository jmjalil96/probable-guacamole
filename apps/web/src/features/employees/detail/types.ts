import type { Employee } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { OpenState } from "@/lib/hooks";
import type { EmployeeFormData } from "./schema";

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
// Form Return Type
// =============================================================================

export interface UseEmployeeFormReturn {
  control: Control<EmployeeFormData>;
  handleSubmit: UseFormHandleSubmit<EmployeeFormData>;
  errors: FieldErrors<EmployeeFormData>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  clearFormError: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseEmployeeDetailReturn {
  // Data
  employee: Employee | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Modal State
  modalState: ModalState;

  // Navigation
  navigateBack: () => void;
}
