import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Insurer } from "shared";
import { useOpenState } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import {
  useInsurer,
  useCreateInsurer,
  useUpdateInsurer,
  useDeleteInsurer,
} from "../api";
import { insurerFormSchema, type InsurerFormData } from "./schema";
import {
  extractFormError,
  mapInsurerToFormValues,
  mapFormToRequest,
} from "./utils";
import type {
  UseInsurerDetailReturn,
  UseInsurerFormReturn,
  FormError,
  ModalState,
} from "./types";

// =============================================================================
// useModalState
// =============================================================================

/**
 * Manages modal state for the insurer detail page.
 * Single responsibility: track edit modal open/close state.
 */
export function useModalState(): ModalState {
  const editModal = useOpenState();
  return { editModal };
}

// =============================================================================
// useInsurerForm (for edit)
// =============================================================================

export function useInsurerForm(
  insurer: Insurer,
  open: boolean,
  onSuccess: () => void
): UseInsurerFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<InsurerFormData>({
    resolver: zodResolver(insurerFormSchema),
    defaultValues: mapInsurerToFormValues(insurer),
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset(mapInsurerToFormValues(insurer));
    }
  }, [open, insurer, reset]);

  const updateInsurer = useUpdateInsurer();
  const isBusy = isSubmitting || updateInsurer.isPending;

  const onSubmit = useCallback(
    async (data: InsurerFormData) => {
      setFormError(null);

      try {
        const request = mapFormToRequest(data, insurer);

        if (Object.keys(request).length === 0) {
          toast.info("Sin cambios", {
            description: "No se detectaron cambios para guardar.",
          });
          onSuccess();
          return;
        }

        await updateInsurer.mutateAsync({ id: insurer.id, data: request });
        toast.success("Aseguradora actualizada");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [insurer, updateInsurer, onSuccess]
  );

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
// useInsurerCreateForm (for create modal)
// =============================================================================

export function useInsurerCreateForm(
  open: boolean,
  onSuccess: (id: string) => void
): UseInsurerFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<InsurerFormData>({
    resolver: zodResolver(insurerFormSchema),
    defaultValues: {
      name: "",
      code: null,
      email: null,
      phone: null,
      website: null,
      type: "COMPANIA_DE_SEGUROS",
      isActive: true,
    },
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        code: null,
        email: null,
        phone: null,
        website: null,
        type: "COMPANIA_DE_SEGUROS",
        isActive: true,
      });
    }
  }, [open, reset]);

  const createInsurer = useCreateInsurer();
  const isBusy = isSubmitting || createInsurer.isPending;

  const onSubmit = useCallback(
    async (data: InsurerFormData) => {
      setFormError(null);

      try {
        const response = await createInsurer.mutateAsync({
          name: data.name,
          code: data.code || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          website: data.website || undefined,
          type: data.type,
        });
        toast.success("Aseguradora creada");
        onSuccess(response.id);
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [createInsurer, onSuccess]
  );

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
// useInsurerDetail (Master Orchestration)
// =============================================================================

export function useInsurerDetail(insurerId: string): UseInsurerDetailReturn {
  // 1. Data Fetching
  const { data: insurer, isLoading, isError, error } = useInsurer(insurerId);

  // 2. Modal State
  const modalState = useModalState();

  // 3. Delete State
  const [deleteState, setDeleteState] = useState({
    open: false,
    isDeleting: false,
  });

  const deleteInsurer = useDeleteInsurer();
  const navigate = useNavigate();

  const openDelete = useCallback(() => {
    setDeleteState({ open: true, isDeleting: false });
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteState({ open: false, isDeleting: false });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!insurer) return;

    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    deleteInsurer.mutate(insurer.id, {
      onSuccess: () => {
        toast.success("Aseguradora eliminada");
        void navigate({ to: "/insurers" });
      },
      onError: (err) => {
        const formError = extractFormError(err);
        toast.error(
          formError.title,
          formError.description ? { description: formError.description } : {}
        );
        setDeleteState({ open: false, isDeleting: false });
      },
    });
  }, [insurer, deleteInsurer, navigate]);

  // 4. Navigation
  const navigateBack = useCallback(() => {
    void navigate({ to: "/insurers" });
  }, [navigate]);

  return {
    insurer,
    isLoading,
    isError,
    error,
    modalState,
    deleteState,
    deleteHandlers: { openDelete, confirmDelete, cancelDelete },
    navigateBack,
  };
}
