import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useValidateInvitation,
  useAcceptInvitation as useAcceptInvitationMutation,
} from "../api/hooks";
import {
  passwordFormSchema,
  type PasswordFormData,
  getAuthErrorMessage,
} from "../shared";

// =============================================================================
// Types
// =============================================================================

export type AcceptInvitationState =
  | "loading"
  | "no-token"
  | "token-error"
  | "form";

export interface UseAcceptInvitationFormReturn {
  // State
  state: AcceptInvitationState;
  roleName: string | undefined;

  // Form
  register: ReturnType<typeof useForm<PasswordFormData>>["register"];
  handleSubmit: ReturnType<typeof useForm<PasswordFormData>>["handleSubmit"];
  errors: ReturnType<typeof useForm<PasswordFormData>>["formState"]["errors"];

  // Mutation state
  isPending: boolean;
  errorMessage: string | null;

  // Handlers
  onSubmit: (data: PasswordFormData) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Orchestration hook for the accept invitation flow.
 * Manages token validation, form state, and invitation acceptance.
 */
export function useAcceptInvitationForm(): UseAcceptInvitationFormReturn {
  const { token } = useSearch({ from: "/_guest/accept-invitation" });
  const validateInvitation = useValidateInvitation(token ?? "");
  const acceptInvitation = useAcceptInvitationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onSubmit = useCallback(
    (data: PasswordFormData) => {
      if (!token) return;
      acceptInvitation.mutate({ token, password: data.password });
    },
    [token, acceptInvitation]
  );

  // Extract role name from validation response
  const roleName = validateInvitation.data?.role?.displayName;

  // Determine current state
  let state: AcceptInvitationState;
  if (validateInvitation.isLoading) {
    state = "loading";
  } else if (!token) {
    state = "no-token";
  } else if (validateInvitation.isError) {
    state = "token-error";
  } else {
    state = "form";
  }

  const errorMessage = getAuthErrorMessage(
    acceptInvitation.error,
    "accept-invitation"
  );

  return {
    state,
    roleName,
    register,
    handleSubmit,
    errors,
    isPending: acceptInvitation.isPending,
    errorMessage,
    onSubmit,
  };
}
