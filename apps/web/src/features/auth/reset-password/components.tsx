import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, FormField, PasswordInput } from "@/components/ui";
import type { UseResetPasswordReturn } from "./hooks";

// =============================================================================
// Types
// =============================================================================

export interface ResetPasswordFormProps {
  register: UseResetPasswordReturn["register"];
  handleSubmit: UseResetPasswordReturn["handleSubmit"];
  errors: UseResetPasswordReturn["errors"];
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: UseResetPasswordReturn["onSubmit"];
}

// =============================================================================
// Form Component
// =============================================================================

function ResetPasswordFormRoot({
  register,
  handleSubmit,
  errors,
  isPending,
  errorMessage,
  onSubmit,
}: ResetPasswordFormProps) {
  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-5"
    >
      <FormField
        label="Nueva contraseña"
        htmlFor="password"
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          placeholder="Mínimo 12 caracteres"
          autoComplete="new-password"
          error={!!errors.password}
          {...register("password")}
        />
      </FormField>

      {errorMessage && <p className="text-sm text-alert">{errorMessage}</p>}

      <Button type="submit" loading={isPending} className="w-full">
        Restablecer contraseña
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// =============================================================================
// Footer Components
// =============================================================================

function ResetPasswordFormFooter() {
  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a iniciar sesión
    </Link>
  );
}

function SuccessFooter() {
  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
    >
      Iniciar sesión
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function ErrorFooter() {
  return (
    <Link
      to="/forgot-password"
      className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
    >
      Solicitar nuevo enlace
    </Link>
  );
}

// =============================================================================
// Compound Export
// =============================================================================

export const ResetPasswordForm = Object.assign(ResetPasswordFormRoot, {
  Footer: ResetPasswordFormFooter,
  SuccessFooter,
  ErrorFooter,
});
