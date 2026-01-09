import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, type LoginRequest } from "shared";
import { useLogin } from "../api/hooks";
import { getAuthErrorMessage } from "../shared";

// =============================================================================
// Types
// =============================================================================

export interface UseLoginFormReturn {
  // Form
  register: ReturnType<typeof useForm<LoginRequest>>["register"];
  handleSubmit: ReturnType<typeof useForm<LoginRequest>>["handleSubmit"];
  errors: ReturnType<typeof useForm<LoginRequest>>["formState"]["errors"];

  // Mutation state
  isPending: boolean;
  errorMessage: string | null;

  // Handlers
  onSubmit: (data: LoginRequest) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Orchestration hook for the login form.
 * Manages form state, validation, and login mutation.
 */
export function useLoginForm(): UseLoginFormReturn {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
  });

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data);
  };

  const errorMessage = getAuthErrorMessage(login.error, "login");

  return {
    register,
    handleSubmit,
    errors,
    isPending: login.isPending,
    errorMessage,
    onSubmit,
  };
}
