import type { ClaimStatus, ClaimDetail } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { SelectOption } from "@/components/ui";
import type { EditClaimForm } from "./schema";

// =============================================================================
// Transition Error
// =============================================================================

export interface TransitionError {
  title: string;
  description: string;
  items: string[];
}

// =============================================================================
// Tab State
// =============================================================================

export type ClaimDetailTab =
  | "general"
  | "documents"
  | "invoices"
  | "notes"
  | "audit";

export interface TabState {
  activeTab: ClaimDetailTab;
  setActiveTab: (tab: ClaimDetailTab) => void;
}

// =============================================================================
// Modal State
// =============================================================================

export interface ModalState {
  editModal: {
    open: boolean;
    /** Key that increments on each open - use as component key to reset state */
    key: number;
    onOpen: () => void;
    onClose: () => void;
  };
}

// =============================================================================
// Transition State & Handlers
// =============================================================================

export interface TransitionModalConfig {
  targetStatus: ClaimStatus;
  title: string;
  description?: string;
}

export interface TransitionState {
  isTransitioning: boolean;
  transitionError: TransitionError | null;
  reasonModal: TransitionModalConfig | null;
  confirmModal: TransitionModalConfig | null;
  reason: string;
}

export interface TransitionHandlers {
  handleTransition: (targetStatus: ClaimStatus) => void;
  setReason: (reason: string) => void;
  handleReasonModalConfirm: () => void;
  handleReasonModalClose: () => void;
  handleConfirmModalConfirm: () => void;
  handleConfirmModalClose: () => void;
  dismissError: () => void;
}

// =============================================================================
// Edit Form State & Handlers
// =============================================================================

export interface FormError {
  title: string;
  description?: string;
  items?: string[];
}

export interface EditFormState {
  control: Control<EditClaimForm>;
  errors: FieldErrors<EditClaimForm>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
}

export interface EditFormHandlers {
  handleSubmit: UseFormHandleSubmit<EditClaimForm>;
  onSubmit: (data: EditClaimForm) => Promise<void>;
  clearFormError: () => void;
}

export interface PolicyLookupState {
  options: SelectOption[];
  isLoading: boolean;
  isFetching: boolean;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseClaimDetailReturn {
  // Data (claim is undefined while loading or on error)
  claim: ClaimDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Tab State
  tabState: TabState;

  // Modal State
  modalState: ModalState;

  // Transitions
  transitionState: TransitionState;
  transitionHandlers: TransitionHandlers;

  // Navigation
  navigateBack: () => void;
}

// =============================================================================
// Layout Props (grouped, like ClaimsViewLayoutProps)
// =============================================================================

export interface ClaimDetailLayoutProps {
  claim: ClaimDetail;
  tabState: TabState;
  modalState: ModalState;
  transitionState: TransitionState;
  transitionHandlers: TransitionHandlers;
  policyLookup?: PolicyLookupState;
  onBack?: () => void;
}
