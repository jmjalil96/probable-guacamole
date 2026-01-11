import type { Agent } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { OpenState } from "@/lib/hooks";
import type { AgentFormData } from "./schema";

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

export type AgentDetailTab = "general" | "clients";

export interface TabState {
  activeTab: AgentDetailTab;
  setActiveTab: (tab: AgentDetailTab) => void;
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

export interface UseAgentFormReturn {
  control: Control<AgentFormData>;
  handleSubmit: UseFormHandleSubmit<AgentFormData>;
  errors: FieldErrors<AgentFormData>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  clearFormError: () => void;
  onSubmit: (data: AgentFormData) => Promise<void>;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseAgentDetailReturn {
  // Data
  agent: Agent | undefined;
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
