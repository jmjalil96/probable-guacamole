import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetRequestSchema, type PasswordResetRequest } from "shared";
import { useRequestPasswordReset } from "../api/hooks";
import { getAuthErrorMessage } from "../shared";

// =============================================================================
// Types
// =============================================================================

export interface UseForgotPasswordFormReturn {
  // Form
  register: ReturnType<typeof useForm<PasswordResetRequest>>["register"];
  handleSubmit: ReturnType<
    typeof useForm<PasswordResetRequest>
  >["handleSubmit"];
  errors: ReturnType<
    typeof useForm<PasswordResetRequest>
  >["formState"]["errors"];

  // State
  isSubmitted: boolean;
  isPending: boolean;
  errorMessage: string | null;

  // Handlers
  onSubmit: (data: PasswordResetRequest) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Orchestration hook for the forgot password form.
 * Manages form state, validation, and password reset request.
 */
export function useForgotPasswordForm(): UseForgotPasswordFormReturn {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const requestReset = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const onSubmit = useCallback(
    (data: PasswordResetRequest) => {
      requestReset.mutate(data, {
        onSuccess: () => setIsSubmitted(true),
      });
    },
    [requestReset]
  );

  const errorMessage = getAuthErrorMessage(
    requestReset.error,
    "forgot-password"
  );

  return {
    register,
    handleSubmit,
    errors,
    isSubmitted,
    isPending: requestReset.isPending,
    errorMessage,
    onSubmit,
  };
}
