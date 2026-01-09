import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useValidateResetToken, useConfirmPasswordReset } from "../api/hooks";
import {
  passwordFormSchema,
  type PasswordFormData,
  getAuthErrorMessage,
} from "../shared";

// =============================================================================
// Types
// =============================================================================

export type ResetPasswordState =
  | "loading"
  | "no-token"
  | "token-error"
  | "success"
  | "form";

export interface UseResetPasswordReturn {
  // State
  state: ResetPasswordState;

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
 * Orchestration hook for the reset password flow.
 * Manages token validation, form state, and password reset.
 */
export function useResetPassword(): UseResetPasswordReturn {
  const { token } = useSearch({ from: "/_guest/reset-password" });
  const validateToken = useValidateResetToken(token ?? "");
  const confirmReset = useConfirmPasswordReset();

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
      confirmReset.mutate({ token, password: data.password });
    },
    [token, confirmReset]
  );

  // Determine current state
  let state: ResetPasswordState;
  if (validateToken.isLoading) {
    state = "loading";
  } else if (!token) {
    state = "no-token";
  } else if (validateToken.isError) {
    state = "token-error";
  } else if (confirmReset.isSuccess) {
    state = "success";
  } else {
    state = "form";
  }

  const errorMessage = getAuthErrorMessage(
    confirmReset.error,
    "reset-password"
  );

  return {
    state,
    register,
    handleSubmit,
    errors,
    isPending: confirmReset.isPending,
    errorMessage,
    onSubmit,
  };
}
