import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ClientAdmin } from "shared";
import { useOpenState } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import { useClientAdmin, useUpdateClientAdmin } from "../api";
import { clientAdminFormSchema, type ClientAdminFormData } from "./schema";
import {
  extractFormError,
  mapClientAdminToFormValues,
  mapFormToRequest,
} from "./utils";
import type {
  UseClientAdminDetailReturn,
  UseClientAdminFormReturn,
  FormError,
  ModalState,
  TabState,
  ClientAdminDetailTab,
} from "./types";

// =============================================================================
// useTabState
// =============================================================================

export function useTabState(defaultTab: ClientAdminDetailTab = "general"): TabState {
  const [activeTab, setActiveTab] = useState<ClientAdminDetailTab>(defaultTab);

  return {
    activeTab,
    setActiveTab,
  };
}

// =============================================================================
// useModalState
// =============================================================================

export function useModalState(): ModalState {
  const editModal = useOpenState();
  return { editModal };
}

// =============================================================================
// useClientAdminForm
// =============================================================================

export function useClientAdminForm(
  clientAdmin: ClientAdmin,
  open: boolean,
  onSuccess: () => void
): UseClientAdminFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ClientAdminFormData>({
    resolver: zodResolver(clientAdminFormSchema),
    defaultValues: mapClientAdminToFormValues(clientAdmin),
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset(mapClientAdminToFormValues(clientAdmin));
    }
  }, [open, clientAdmin, reset]);

  const updateClientAdmin = useUpdateClientAdmin();
  const isBusy = isSubmitting || updateClientAdmin.isPending;

  const onSubmit = useCallback(
    async (data: ClientAdminFormData) => {
      setFormError(null);

      try {
        const request = mapFormToRequest(data, clientAdmin);

        if (Object.keys(request).length === 0) {
          toast.info("Sin cambios", {
            description: "No se detectaron cambios para guardar.",
          });
          onSuccess();
          return;
        }

        await updateClientAdmin.mutateAsync({ id: clientAdmin.id, data: request });
        toast.success("Administrador de cliente actualizado");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [clientAdmin, updateClientAdmin, onSuccess]
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
// useClientAdminDetail (Master Orchestration)
// =============================================================================

export function useClientAdminDetail(clientAdminId: string): UseClientAdminDetailReturn {
  // 1. Data Fetching
  const { data: clientAdmin, isLoading, isError, error } = useClientAdmin(clientAdminId);

  // 2. Tab State
  const tabState = useTabState();

  // 3. Modal State
  const modalState = useModalState();

  // 4. Navigation
  const navigate = useNavigate();

  const navigateBack = useCallback(() => {
    void navigate({ to: "/users" });
  }, [navigate]);

  return {
    clientAdmin,
    isLoading,
    isError,
    error,
    tabState,
    modalState,
    navigateBack,
  };
}
