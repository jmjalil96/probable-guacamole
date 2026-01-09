import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { ClaimStatus, ClaimDetail } from "shared";
import { isClaimReasonRequired } from "shared";
import type { SelectOption } from "@/components/ui";
import { useOpenState } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import { STATUS_LABELS } from "../shared";
import {
  useClaim,
  useUpdateClaim,
  useClaimPolicies,
  useReviewClaim,
  useSubmitClaim,
  useReturnClaim,
  useRequestInfo,
  useProvideInfo,
  useSettleClaim,
  useCancelClaim,
} from "../api";
import { editClaimSchema, type EditClaimForm } from "./schema";
import {
  extractTransitionError,
  extractFormError,
  mapClaimToFormValues,
  mapFormToRequest,
} from "./utils";
import type {
  ClaimDetailTab,
  TabState,
  ModalState,
  TransitionModalConfig,
  TransitionState,
  TransitionHandlers,
  FormError,
  PolicyLookupState,
  UseClaimDetailReturn,
} from "./types";

// =============================================================================
// useTabState
// =============================================================================

/**
 * Manages tab state for the claim detail page.
 * Single responsibility: track which tab is active.
 */
export function useTabState(defaultTab: ClaimDetailTab = "general"): TabState {
  const [activeTab, setActiveTab] = useState<ClaimDetailTab>(defaultTab);

  return {
    activeTab,
    setActiveTab,
  };
}

// =============================================================================
// useModalState
// =============================================================================

/**
 * Manages modal state for the claim detail page.
 * Single responsibility: track edit modal open/close state.
 */
export function useModalState(): ModalState {
  const editModal = useOpenState();
  return { editModal };
}

// =============================================================================
// useTransitionModals
// =============================================================================

interface UseTransitionModalsReturn {
  reasonModal: TransitionModalConfig | null;
  confirmModal: TransitionModalConfig | null;
  reason: string;
  setReason: (reason: string) => void;
  openReasonModal: (config: TransitionModalConfig) => void;
  closeReasonModal: () => void;
  openConfirmModal: (config: TransitionModalConfig) => void;
  closeConfirmModal: () => void;
}

/**
 * Manages modal state for transition dialogs.
 * Single responsibility: reason/confirm modal open/close state.
 */
function useTransitionModals(): UseTransitionModalsReturn {
  const [reasonModal, setReasonModal] = useState<TransitionModalConfig | null>(
    null
  );
  const [confirmModal, setConfirmModal] =
    useState<TransitionModalConfig | null>(null);
  const [reason, setReason] = useState("");

  const openReasonModal = useCallback((config: TransitionModalConfig) => {
    setReasonModal(config);
    setReason("");
  }, []);

  const closeReasonModal = useCallback(() => {
    setReasonModal(null);
    setReason("");
  }, []);

  const openConfirmModal = useCallback((config: TransitionModalConfig) => {
    setConfirmModal(config);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(null);
  }, []);

  return {
    reasonModal,
    confirmModal,
    reason,
    setReason,
    openReasonModal,
    closeReasonModal,
    openConfirmModal,
    closeConfirmModal,
  };
}

// =============================================================================
// useTransitionMutations
// =============================================================================

interface ExecuteTransitionParams {
  claimId: string;
  currentStatus: ClaimStatus;
  targetStatus: ClaimStatus;
  reason: string | undefined;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

interface UseTransitionMutationsReturn {
  execute: (params: ExecuteTransitionParams) => void;
  isPending: boolean;
}

/**
 * Composes all 7 transition mutations into a single execute function.
 * Single responsibility: mutation execution.
 */
function useTransitionMutations(): UseTransitionMutationsReturn {
  const reviewClaim = useReviewClaim();
  const submitClaim = useSubmitClaim();
  const returnClaim = useReturnClaim();
  const requestInfo = useRequestInfo();
  const provideInfo = useProvideInfo();
  const settleClaim = useSettleClaim();
  const cancelClaim = useCancelClaim();

  const isPending =
    reviewClaim.isPending ||
    submitClaim.isPending ||
    returnClaim.isPending ||
    requestInfo.isPending ||
    provideInfo.isPending ||
    settleClaim.isPending ||
    cancelClaim.isPending;

  const execute = useCallback(
    ({
      claimId,
      currentStatus,
      targetStatus,
      reason,
      onSuccess,
      onError,
    }: ExecuteTransitionParams) => {
      const mutationOpts = { onSuccess, onError };

      switch (targetStatus) {
        case "IN_REVIEW":
          reviewClaim.mutate({ id: claimId }, mutationOpts);
          break;
        case "SUBMITTED":
          if (currentStatus === "PENDING_INFO") {
            provideInfo.mutate(
              { id: claimId, data: { reason: reason! } },
              mutationOpts
            );
          } else {
            submitClaim.mutate({ id: claimId }, mutationOpts);
          }
          break;
        case "RETURNED":
          returnClaim.mutate(
            { id: claimId, data: { reason: reason! } },
            mutationOpts
          );
          break;
        case "PENDING_INFO":
          requestInfo.mutate(
            { id: claimId, data: { reason: reason! } },
            mutationOpts
          );
          break;
        case "SETTLED":
          settleClaim.mutate({ id: claimId }, mutationOpts);
          break;
        case "CANCELLED":
          cancelClaim.mutate(
            { id: claimId, data: { reason: reason! } },
            mutationOpts
          );
          break;
      }
    },
    [
      reviewClaim,
      submitClaim,
      returnClaim,
      requestInfo,
      provideInfo,
      settleClaim,
      cancelClaim,
    ]
  );

  return { execute, isPending };
}

// =============================================================================
// useTransitions
// =============================================================================

const TRANSITION_CONFIG: Record<
  string,
  { title: string; description?: string }
> = {
  RETURNED: {
    title: "Devolver Reclamo",
    description: "El reclamo será devuelto al cliente.",
  },
  PENDING_INFO: {
    title: "Solicitar Información",
    description: "El reclamo quedará pendiente hasta recibir respuesta.",
  },
  SUBMITTED_FROM_PENDING: {
    title: "Reenviar Reclamo",
    description: "Proporcione la información solicitada.",
  },
  CANCELLED: {
    title: "Cancelar Reclamo",
    description: "Esta acción no se puede deshacer.",
  },
  IN_REVIEW: {
    title: "Enviar a Revisión",
    description: "El reclamo será enviado para revisión.",
  },
  SUBMITTED: {
    title: "Enviar Reclamo",
    description: "El reclamo será enviado a la aseguradora.",
  },
  SETTLED: {
    title: "Liquidar Reclamo",
    description: "El reclamo será marcado como liquidado.",
  },
};

export interface UseTransitionsReturn {
  transitionState: TransitionState;
  transitionHandlers: TransitionHandlers;
}

/**
 * Orchestrates claim status transitions.
 * Composes useTransitionMutations and useTransitionModals.
 */
export function useTransitions(
  claim: ClaimDetail | undefined
): UseTransitionsReturn {
  // ---------------------------------------------------------------------------
  // Compose Sub-Hooks
  // ---------------------------------------------------------------------------
  const mutations = useTransitionMutations();
  const modals = useTransitionModals();
  const [transitionError, setTransitionError] = useState<ReturnType<
    typeof extractTransitionError
  > | null>(null);

  // ---------------------------------------------------------------------------
  // Get Modal Config
  // ---------------------------------------------------------------------------
  const getModalConfig = useCallback(
    (targetStatus: ClaimStatus): TransitionModalConfig => {
      if (!claim) {
        return { targetStatus, title: "Confirmar Transición" };
      }
      const configKey =
        targetStatus === "SUBMITTED" && claim.status === "PENDING_INFO"
          ? "SUBMITTED_FROM_PENDING"
          : targetStatus;
      const config = TRANSITION_CONFIG[configKey];

      return {
        targetStatus,
        title: config?.title ?? "Confirmar Transición",
        ...(config?.description && { description: config.description }),
      };
    },
    [claim]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleTransition = useCallback(
    (targetStatus: ClaimStatus) => {
      if (!claim) return;
      const needsReason = isClaimReasonRequired(claim.status, targetStatus);
      const config = getModalConfig(targetStatus);

      if (needsReason) {
        modals.openReasonModal(config);
      } else {
        modals.openConfirmModal(config);
      }
    },
    [claim, getModalConfig, modals]
  );

  const executeTransition = useCallback(
    (targetStatus: ClaimStatus, reason?: string) => {
      if (!claim) return;
      if (mutations.isPending) return;

      mutations.execute({
        claimId: claim.id,
        currentStatus: claim.status,
        targetStatus,
        reason,
        onSuccess: () => {
          setTransitionError(null);
          toast.success("Estado actualizado", {
            description: `Reclamo ${STATUS_LABELS[targetStatus].toLowerCase()}`,
          });
          modals.closeReasonModal();
          modals.closeConfirmModal();
        },
        onError: (err) => {
          const error = extractTransitionError(err);
          setTransitionError(error);
          modals.closeConfirmModal();
          toast.error(error.title);
        },
      });
    },
    [claim, mutations, modals]
  );

  const handleReasonModalConfirm = useCallback(() => {
    if (!modals.reasonModal || !modals.reason.trim()) return;
    executeTransition(modals.reasonModal.targetStatus, modals.reason.trim());
  }, [modals.reasonModal, modals.reason, executeTransition]);

  const handleConfirmModalConfirm = useCallback(() => {
    if (!modals.confirmModal) return;
    executeTransition(modals.confirmModal.targetStatus);
  }, [modals.confirmModal, executeTransition]);

  const dismissError = useCallback(() => {
    setTransitionError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Return Grouped State & Handlers
  // ---------------------------------------------------------------------------
  return {
    transitionState: {
      isTransitioning: mutations.isPending,
      transitionError,
      reasonModal: modals.reasonModal,
      confirmModal: modals.confirmModal,
      reason: modals.reason,
    },
    transitionHandlers: {
      handleTransition,
      setReason: modals.setReason,
      handleReasonModalConfirm,
      handleReasonModalClose: modals.closeReasonModal,
      handleConfirmModalConfirm,
      handleConfirmModalClose: modals.closeConfirmModal,
      dismissError,
    },
  };
}

// =============================================================================
// useEditClaimForm
// =============================================================================

export interface UseEditClaimFormReturn {
  control: Control<EditClaimForm>;
  handleSubmit: UseFormHandleSubmit<EditClaimForm>;
  errors: FieldErrors<EditClaimForm>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  clearFormError: () => void;
  onSubmit: (data: EditClaimForm) => Promise<void>;
}

/**
 * Manages the edit claim form state, validation, and submission.
 * Single responsibility: form state and submission.
 */
export function useEditClaimForm(
  claim: ClaimDetail,
  open: boolean,
  onSuccess: () => void
): UseEditClaimFormReturn {
  // ---------------------------------------------------------------------------
  // Form Setup
  // ---------------------------------------------------------------------------
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditClaimForm>({
    resolver: zodResolver(editClaimSchema),
    defaultValues: mapClaimToFormValues(claim),
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset(mapClaimToFormValues(claim));
    }
  }, [open, claim, reset]);

  // ---------------------------------------------------------------------------
  // Mutation
  // ---------------------------------------------------------------------------
  const updateClaim = useUpdateClaim();
  const isBusy = isSubmitting || updateClaim.isPending;

  // ---------------------------------------------------------------------------
  // Submit Handler
  // ---------------------------------------------------------------------------
  const onSubmit = useCallback(
    async (data: EditClaimForm) => {
      setFormError(null);

      try {
        const request = mapFormToRequest(data, claim);

        if (Object.keys(request).length === 0) {
          toast.info("Sin cambios", {
            description: "No se detectaron cambios para guardar.",
          });
          onSuccess();
          return;
        }

        await updateClaim.mutateAsync({ id: claim.id, data: request });
        toast.success("Reclamo actualizado");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [claim, updateClaim, onSuccess]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    control,
    handleSubmit,
    errors,
    isDirty,
    isBusy,
    formError,
    clearFormError,
    onSubmit,
  };
}

// =============================================================================
// usePolicyLookup
// =============================================================================

/**
 * Fetches and formats policy options for a client.
 * Single responsibility: policy lookup for edit form.
 */
export function usePolicyLookup(clientId: string): PolicyLookupState {
  const query = useClaimPolicies(clientId);

  const options = useMemo<SelectOption[]>(() => {
    if (!query.data?.data) return [];
    return query.data.data.map((p) => ({
      value: p.id,
      label: p.policyNumber,
    }));
  }, [query.data]);

  return {
    options,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

// =============================================================================
// useClaimDetail (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the claim detail page.
 * Composes smaller, focused hooks for each concern.
 * Pattern: Mirrors use-claims-list.ts
 */
export function useClaimDetail(claimId: string): UseClaimDetailReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data: claim, isLoading, isError, error } = useClaim(claimId);

  // ---------------------------------------------------------------------------
  // 2. Compose Domain Hooks
  // ---------------------------------------------------------------------------
  const tabState = useTabState();
  const modalState = useModalState();
  const transitions = useTransitions(claim);

  // ---------------------------------------------------------------------------
  // 3. Navigation
  // ---------------------------------------------------------------------------
  const navigate = useNavigate();

  const navigateBack = useCallback(() => {
    void navigate({ to: "/claims" });
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // 4. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    claim,
    isLoading,
    isError,
    error,

    // Tab State
    tabState,

    // Modal State
    modalState,

    // Transitions
    transitionState: transitions.transitionState,
    transitionHandlers: transitions.transitionHandlers,

    // Navigation
    navigateBack,
  };
}
