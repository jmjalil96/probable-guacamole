import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { UseFormSetValue, UseFormClearErrors } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ClaimFileCategory } from "shared";
import type { SelectOption } from "@/components/ui";
import type { UploadAdapter } from "@/components/file-uploader";
import { useFileUpload } from "@/components/file-uploader";
import { useExitConfirmation } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import { handleMutationError } from "@/lib/api";
import type { LookupState } from "../shared";
import { CLAIM_FILE_CATEGORIES, CLAIM_CATEGORY_ICONS } from "../shared";
import {
  useClaimClients,
  useClaimAffiliates,
  useClaimPatients,
  useCreateClaim,
  useCreatePendingUpload,
} from "../api";
import { newClaimSchema } from "./schema";
import type { NewClaimForm } from "./schema";
import type { UseNewClaimReturn } from "./types";

// =============================================================================
// Types (Cascading Selects)
// =============================================================================

export interface UseCascadingSelectsOptions {
  clientId: string;
  affiliateId: string;
  setValue: UseFormSetValue<NewClaimForm>;
  clearErrors: UseFormClearErrors<NewClaimForm>;
}

export interface UseCascadingSelectsReturn {
  clientOptions: SelectOption[];
  affiliateOptions: SelectOption[];
  patientOptions: SelectOption[];
  clients: LookupState;
  affiliates: LookupState;
  patients: LookupState;
}

// =============================================================================
// useCascadingSelects Hook
// =============================================================================

/**
 * Manages cascading select behavior and lookup API orchestration.
 * Resets child selects when parent selection changes.
 */
export function useCascadingSelects({
  clientId,
  affiliateId,
  setValue,
  clearErrors,
}: UseCascadingSelectsOptions): UseCascadingSelectsReturn {
  // ---------------------------------------------------------------------------
  // API Hooks
  // ---------------------------------------------------------------------------
  const clients = useClaimClients();
  const affiliates = useClaimAffiliates(clientId);
  const patients = useClaimPatients(affiliateId);

  // ---------------------------------------------------------------------------
  // Cascading Select Reset
  // ---------------------------------------------------------------------------
  const prevClientId = useRef(clientId);
  const prevAffiliateId = useRef(affiliateId);

  useEffect(() => {
    if (prevClientId.current !== clientId) {
      setValue("affiliateId", "");
      setValue("patientId", "");
      clearErrors(["affiliateId", "patientId"]);
      prevClientId.current = clientId;
    }
  }, [clientId, setValue, clearErrors]);

  useEffect(() => {
    if (prevAffiliateId.current !== affiliateId) {
      setValue("patientId", "");
      clearErrors("patientId");
      prevAffiliateId.current = affiliateId;
    }
  }, [affiliateId, setValue, clearErrors]);

  // ---------------------------------------------------------------------------
  // Transform API Responses to SelectOption Format
  // ---------------------------------------------------------------------------
  const clientOptions = useMemo<SelectOption[]>(
    () =>
      clients.data?.data.map((c) => ({
        value: c.id,
        label: c.name,
      })) ?? [],
    [clients.data]
  );

  const affiliateOptions = useMemo<SelectOption[]>(
    () =>
      affiliates.data?.data.map((a) => ({
        value: a.id,
        label: a.name,
      })) ?? [],
    [affiliates.data]
  );

  const patientOptions = useMemo<SelectOption[]>(
    () =>
      patients.data?.data.map((p) => ({
        value: p.id,
        label: p.name,
        ...(p.relationship && { description: p.relationship }),
      })) ?? [],
    [patients.data]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    clientOptions,
    affiliateOptions,
    patientOptions,
    clients: {
      isLoading: clients.isLoading,
      isFetching: clients.isFetching,
      isError: clients.isError,
      refetch: () => void clients.refetch(),
    },
    affiliates: {
      isLoading: affiliates.isLoading,
      isFetching: affiliates.isFetching,
      isError: affiliates.isError,
      refetch: () => void affiliates.refetch(),
    },
    patients: {
      isLoading: patients.isLoading,
      isFetching: patients.isFetching,
      isError: patients.isError,
      refetch: () => void patients.refetch(),
    },
  };
}

// =============================================================================
// usePendingUploadAdapter Hook
// =============================================================================

interface PendingUploadResult {
  pendingUploadId: string;
}

/**
 * Adapter for pre-claim file uploads (2-step flow).
 * Files are uploaded first, then associated with the claim when created.
 */
function usePendingUploadAdapter(
  sessionKey: string
): UploadAdapter<ClaimFileCategory, PendingUploadResult> {
  const createPendingUpload = useCreatePendingUpload();

  return useMemo(
    () => ({
      getUploadUrl: async (file: File, category?: ClaimFileCategory) => {
        const response = await createPendingUpload.mutateAsync({
          sessionKey,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          ...(category && { category }),
        });

        return {
          uploadUrl: response.uploadUrl,
          result: { pendingUploadId: response.pendingUploadId },
        };
      },

      // No confirm step for pre-claim flow
      confirmUpload: undefined,

      getSubmitValue: (result: PendingUploadResult) => result.pendingUploadId,
    }),
    [sessionKey, createPendingUpload]
  );
}

// =============================================================================
// useNewClaimForm Hook (Master)
// =============================================================================

/**
 * Main orchestration hook for the new claim form.
 * Composes smaller, focused hooks and returns grouped interfaces.
 * Pattern: Mirrors use-claim-detail.ts
 */
export function useNewClaimForm(): UseNewClaimReturn {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // 1. Form Setup
  // ---------------------------------------------------------------------------
  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NewClaimForm>({
    resolver: zodResolver(newClaimSchema),
    defaultValues: {
      clientId: "",
      affiliateId: "",
      patientId: "",
      description: "",
    },
  });

  const clientId = useWatch({ control, name: "clientId" });
  const affiliateId = useWatch({ control, name: "affiliateId" });

  // ---------------------------------------------------------------------------
  // 2. Compose Domain Hooks
  // ---------------------------------------------------------------------------
  const [sessionKey] = useState(() => crypto.randomUUID());
  const uploadAdapter = usePendingUploadAdapter(sessionKey);
  const fileUploadHook = useFileUpload({ adapter: uploadAdapter });
  const createClaim = useCreateClaim();

  const selects = useCascadingSelects({
    clientId,
    affiliateId,
    setValue,
    clearErrors,
  });

  const exitConfirmation = useExitConfirmation({
    isDirty,
    hasFiles: fileUploadHook.files.length > 0,
    onExit: () => void navigate({ to: "/" }),
  });

  // ---------------------------------------------------------------------------
  // 3. Derived State
  // ---------------------------------------------------------------------------
  const isBusy = isSubmitting || createClaim.isPending;
  const canSubmit =
    !isBusy && !fileUploadHook.isUploading && !fileUploadHook.hasErrors;

  // ---------------------------------------------------------------------------
  // 4. Submit Handler
  // ---------------------------------------------------------------------------
  const onSubmit = useCallback(
    async (data: NewClaimForm) => {
      if (fileUploadHook.isUploading) {
        toast.warning("Espere a que los archivos terminen de subirse");
        return;
      }
      if (fileUploadHook.hasErrors) {
        toast.error("Algunos archivos fallaron", {
          description:
            "Reintente o elimine los archivos con error antes de continuar",
        });
        return;
      }

      try {
        await createClaim.mutateAsync({
          ...data,
          pendingUploadIds: fileUploadHook.getUploadResults(),
        });
        toast.success("Reclamo creado exitosamente");
        void navigate({ to: "/" });
      } catch (error) {
        handleMutationError(error);
      }
    },
    [fileUploadHook, createClaim, navigate]
  );

  // ---------------------------------------------------------------------------
  // 5. Return Grouped Interface
  // ---------------------------------------------------------------------------

  // Combine file upload hook with categories for the UI
  const fileUpload = useMemo(
    () => ({
      ...fileUploadHook,
      categories: CLAIM_FILE_CATEGORIES,
      categoryIcons: CLAIM_CATEGORY_ICONS,
    }),
    [fileUploadHook]
  );

  return {
    formState: {
      control,
      errors,
      handleSubmit,
    },
    headerState: {
      isBusy,
      canSubmit,
    },
    headerHandlers: {
      onCancel: exitConfirmation.requestExit,
    },
    selectsState: {
      clientId,
      affiliateId,
      clientOptions: selects.clientOptions,
      affiliateOptions: selects.affiliateOptions,
      patientOptions: selects.patientOptions,
      clients: selects.clients,
      affiliates: selects.affiliates,
      patients: selects.patients,
    },
    fileUpload,
    exitDialog: {
      open: exitConfirmation.showDialog,
      onClose: exitConfirmation.cancelExit,
      onConfirm: exitConfirmation.confirmExit,
    },
    onSubmit,
  };
}
