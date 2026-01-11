import { useState, useCallback } from "react";
import type { AgentClient } from "shared";
import type { ComboboxOption } from "@/components/ui";
import { toast } from "@/lib/utils";
import {
  useAgentClients,
  useAssignAgentClient,
  useRemoveAgentClient,
  searchAvailableClientsForAgent,
} from "../../api";
import type {
  UseAgentClientsTabReturn,
  ClientModalState,
  ClientModalHandlers,
  ClientRemoveState,
  ClientRemoveHandlers,
  FormError,
} from "./types";

// =============================================================================
// useClientModalState
// =============================================================================

interface UseClientModalStateReturn {
  state: ClientModalState;
  handlers: ClientModalHandlers;
}

/**
 * Manages modal state for add client.
 * Single responsibility: track modal open/close.
 */
function useClientModalState(): UseClientModalStateReturn {
  const [state, setState] = useState<ClientModalState>({
    open: false,
    key: 0,
  });

  const openAdd = useCallback(() => {
    setState((prev) => ({ open: true, key: prev.key + 1 }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    state,
    handlers: { openAdd, close },
  };
}

// =============================================================================
// useClientRemoveState
// =============================================================================

interface UseClientRemoveStateReturn {
  state: ClientRemoveState;
  handlers: ClientRemoveHandlers;
  setIsRemoving: (value: boolean) => void;
}

/**
 * Manages remove confirmation state for clients.
 * Single responsibility: track remove dialog open/close and current client.
 */
function useClientRemoveState(): UseClientRemoveStateReturn {
  const [state, setState] = useState<ClientRemoveState>({
    open: false,
    client: null,
    isRemoving: false,
  });

  const openRemove = useCallback((client: AgentClient) => {
    setState({ open: true, client, isRemoving: false });
  }, []);

  const cancelRemove = useCallback(() => {
    setState({ open: false, client: null, isRemoving: false });
  }, []);

  const confirmRemove = useCallback(() => {
    // Just signal confirmation - actual mutation handled by parent
  }, []);

  const setIsRemoving = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isRemoving: value }));
  }, []);

  return {
    state,
    handlers: { openRemove, confirmRemove, cancelRemove },
    setIsRemoving,
  };
}

// =============================================================================
// useAgentClientsTab (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the clients tab.
 * Composes smaller, focused hooks for each concern.
 */
export function useAgentClientsTab(agentId: string): UseAgentClientsTabReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data, isLoading, isError, refetch } = useAgentClients(agentId);

  // ---------------------------------------------------------------------------
  // 2. Modal State (Add)
  // ---------------------------------------------------------------------------
  const modal = useClientModalState();

  // ---------------------------------------------------------------------------
  // 3. Remove State
  // ---------------------------------------------------------------------------
  const removeModal = useClientRemoveState();
  const removeMutation = useRemoveAgentClient();

  const confirmRemove = useCallback(() => {
    const client = removeModal.state.client;
    if (!client) return;

    removeModal.setIsRemoving(true);
    removeMutation.mutate(
      {
        agentId,
        clientId: client.clientId,
      },
      {
        onSuccess: () => {
          toast.success("Cliente removido");
          removeModal.handlers.cancelRemove();
        },
        onError: () => {
          toast.error("Error al remover cliente");
          removeModal.setIsRemoving(false);
        },
      }
    );
  }, [agentId, removeModal, removeMutation]);

  // ---------------------------------------------------------------------------
  // 4. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    clients: data?.data ?? [],
    isLoading,
    isError,
    refetch,

    // Add Modal
    modalState: modal.state,
    modalHandlers: modal.handlers,

    // Remove Dialog
    removeState: removeModal.state,
    removeHandlers: {
      openRemove: removeModal.handlers.openRemove,
      confirmRemove,
      cancelRemove: removeModal.handlers.cancelRemove,
    },
  };
}

// =============================================================================
// useAssignClientForm
// =============================================================================

export interface UseAssignClientFormReturn {
  selectedClient: ComboboxOption | null;
  setSelectedClient: (option: ComboboxOption | null) => void;
  onSearch: (query: string) => Promise<ComboboxOption[]>;
  isBusy: boolean;
  formError: FormError | null;
  clearFormError: () => void;
  onSubmit: () => Promise<void>;
}

/**
 * Manages the assign client form state and submission.
 * Uses async search for available clients instead of loading all clients upfront.
 */
export function useAssignClientForm(
  agentId: string,
  onSuccess: () => void
): UseAssignClientFormReturn {
  // ---------------------------------------------------------------------------
  // Form State
  // ---------------------------------------------------------------------------
  const [selectedClient, setSelectedClient] = useState<ComboboxOption | null>(
    null
  );
  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  // ---------------------------------------------------------------------------
  // Search Handler
  // ---------------------------------------------------------------------------
  const onSearch = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const result = await searchAvailableClientsForAgent(agentId, query);
      return result.data.map((c) => ({ value: c.id, label: c.name }));
    },
    [agentId]
  );

  // ---------------------------------------------------------------------------
  // Mutation
  // ---------------------------------------------------------------------------
  const assignMutation = useAssignAgentClient();
  const isBusy = assignMutation.isPending;

  // ---------------------------------------------------------------------------
  // Submit Handler
  // ---------------------------------------------------------------------------
  const onSubmit = useCallback(async () => {
    if (!selectedClient) {
      setFormError({
        title: "Error de validacion",
        description: "Debe seleccionar un cliente.",
      });
      return;
    }

    setFormError(null);

    try {
      await assignMutation.mutateAsync({
        agentId,
        clientId: selectedClient.value,
      });
      toast.success("Cliente asignado");
      onSuccess();
    } catch (error) {
      const err = error as Error;
      setFormError({
        title: "Error al asignar",
        description: err.message || "No se pudo asignar el cliente.",
      });
      toast.error("Error al asignar cliente");
    }
  }, [agentId, selectedClient, assignMutation, onSuccess]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    selectedClient,
    setSelectedClient,
    onSearch,
    isBusy,
    formError,
    clearFormError,
    onSubmit,
  };
}
