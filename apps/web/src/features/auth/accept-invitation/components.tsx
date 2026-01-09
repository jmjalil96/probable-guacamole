import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button, FormField, PasswordInput } from "@/components/ui";
import type { UseAcceptInvitationFormReturn } from "./hooks";

// =============================================================================
// Types
// =============================================================================

export interface AcceptInvitationFormProps {
  register: UseAcceptInvitationFormReturn["register"];
  handleSubmit: UseAcceptInvitationFormReturn["handleSubmit"];
  errors: UseAcceptInvitationFormReturn["errors"];
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: UseAcceptInvitationFormReturn["onSubmit"];
}

// =============================================================================
// Form Component
// =============================================================================

function AcceptInvitationFormRoot({
  register,
  handleSubmit,
  errors,
  isPending,
  errorMessage,
  onSubmit,
}: AcceptInvitationFormProps) {
  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-5"
    >
      <FormField
        label="Contraseña"
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
        Crear cuenta
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// =============================================================================
// Footer Components
// =============================================================================

function AcceptInvitationFormFooter() {
  return (
    <>
      ¿Ya tienes una cuenta?{" "}
      <Link
        to="/login"
        className="font-semibold text-primary hover:text-primary-hover transition-colors"
      >
        Iniciar sesión
      </Link>
    </>
  );
}

function ErrorFooter() {
  return (
    <Link
      to="/login"
      className="font-semibold text-primary hover:text-primary-hover transition-colors"
    >
      Ir a iniciar sesión
    </Link>
  );
}

// =============================================================================
// Compound Export
// =============================================================================

export const AcceptInvitationForm = Object.assign(AcceptInvitationFormRoot, {
  Footer: AcceptInvitationFormFooter,
  ErrorFooter,
});
