import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Client } from "shared";
import { useOpenState } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import {
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "../api";
import { clientFormSchema, type ClientFormData } from "./schema";
import {
  extractFormError,
  mapClientToFormValues,
  mapFormToRequest,
} from "./utils";
import type {
  UseClientDetailReturn,
  UseClientFormReturn,
  FormError,
  ModalState,
} from "./types";

// =============================================================================
// useModalState
// =============================================================================

/**
 * Manages modal state for the client detail page.
 * Single responsibility: track edit modal open/close state.
 */
export function useModalState(): ModalState {
  const editModal = useOpenState();
  return { editModal };
}

// =============================================================================
// useClientForm (for edit)
// =============================================================================

export function useClientForm(
  client: Client,
  open: boolean,
  onSuccess: () => void
): UseClientFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: mapClientToFormValues(client),
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset(mapClientToFormValues(client));
    }
  }, [open, client, reset]);

  const updateClient = useUpdateClient();
  const isBusy = isSubmitting || updateClient.isPending;

  const onSubmit = useCallback(
    async (data: ClientFormData) => {
      setFormError(null);

      try {
        const request = mapFormToRequest(data, client);

        if (Object.keys(request).length === 0) {
          toast.info("Sin cambios", {
            description: "No se detectaron cambios para guardar.",
          });
          onSuccess();
          return;
        }

        await updateClient.mutateAsync({ id: client.id, data: request });
        toast.success("Cliente actualizado");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [client, updateClient, onSuccess]
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
// useClientCreateForm (for create modal)
// =============================================================================

export function useClientCreateForm(
  open: boolean,
  onSuccess: (id: string) => void
): UseClientFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        isActive: true,
      });
    }
  }, [open, reset]);

  const createClient = useCreateClient();
  const isBusy = isSubmitting || createClient.isPending;

  const onSubmit = useCallback(
    async (data: ClientFormData) => {
      setFormError(null);

      try {
        const response = await createClient.mutateAsync({
          name: data.name,
        });
        toast.success("Cliente creado");
        onSuccess(response.id);
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [createClient, onSuccess]
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
// useClientDetail (Master Orchestration)
// =============================================================================

export function useClientDetail(clientId: string): UseClientDetailReturn {
  // 1. Data Fetching
  const { data: client, isLoading, isError, error } = useClient(clientId);

  // 2. Modal State
  const modalState = useModalState();

  // 3. Delete State
  const [deleteState, setDeleteState] = useState({
    open: false,
    isDeleting: false,
  });

  const deleteClient = useDeleteClient();
  const navigate = useNavigate();

  const openDelete = useCallback(() => {
    setDeleteState({ open: true, isDeleting: false });
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteState({ open: false, isDeleting: false });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!client) return;

    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    deleteClient.mutate(client.id, {
      onSuccess: () => {
        toast.success("Cliente eliminado");
        void navigate({ to: "/clients" });
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
  }, [client, deleteClient, navigate]);

  // 4. Navigation
  const navigateBack = useCallback(() => {
    void navigate({ to: "/clients" });
  }, [navigate]);

  return {
    client,
    isLoading,
    isError,
    error,
    modalState,
    deleteState,
    deleteHandlers: { openDelete, confirmDelete, cancelDelete },
    navigateBack,
  };
}
