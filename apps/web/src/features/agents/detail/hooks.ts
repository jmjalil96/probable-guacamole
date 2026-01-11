import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Agent } from "shared";
import { useOpenState } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import { useAgent, useUpdateAgent } from "../api";
import { agentFormSchema, type AgentFormData } from "./schema";
import {
  extractFormError,
  mapAgentToFormValues,
  mapFormToRequest,
} from "./utils";
import type {
  UseAgentDetailReturn,
  UseAgentFormReturn,
  FormError,
  ModalState,
  TabState,
  AgentDetailTab,
} from "./types";

// =============================================================================
// useTabState
// =============================================================================

export function useTabState(defaultTab: AgentDetailTab = "general"): TabState {
  const [activeTab, setActiveTab] = useState<AgentDetailTab>(defaultTab);

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
// useAgentForm
// =============================================================================

export function useAgentForm(
  agent: Agent,
  open: boolean,
  onSuccess: () => void
): UseAgentFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: mapAgentToFormValues(agent),
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset(mapAgentToFormValues(agent));
    }
  }, [open, agent, reset]);

  const updateAgent = useUpdateAgent();
  const isBusy = isSubmitting || updateAgent.isPending;

  const onSubmit = useCallback(
    async (data: AgentFormData) => {
      setFormError(null);

      try {
        const request = mapFormToRequest(data, agent);

        if (Object.keys(request).length === 0) {
          toast.info("Sin cambios", {
            description: "No se detectaron cambios para guardar.",
          });
          onSuccess();
          return;
        }

        await updateAgent.mutateAsync({ id: agent.id, data: request });
        toast.success("Agente actualizado");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [agent, updateAgent, onSuccess]
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
// useAgentDetail (Master Orchestration)
// =============================================================================

export function useAgentDetail(agentId: string): UseAgentDetailReturn {
  // 1. Data Fetching
  const { data: agent, isLoading, isError, error } = useAgent(agentId);

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
    agent,
    isLoading,
    isError,
    error,
    tabState,
    modalState,
    navigateBack,
  };
}
