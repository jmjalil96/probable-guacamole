import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, FormField, Input } from "@/components/ui";
import { StatusView } from "../shared";
import type { UseForgotPasswordFormReturn } from "./hooks";

// =============================================================================
// ForgotPasswordForm Types
// =============================================================================

export interface ForgotPasswordFormProps {
  register: UseForgotPasswordFormReturn["register"];
  handleSubmit: UseForgotPasswordFormReturn["handleSubmit"];
  errors: UseForgotPasswordFormReturn["errors"];
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: UseForgotPasswordFormReturn["onSubmit"];
}

// =============================================================================
// ForgotPasswordForm Component
// =============================================================================

function ForgotPasswordFormRoot({
  register,
  handleSubmit,
  errors,
  isPending,
  errorMessage,
  onSubmit,
}: ForgotPasswordFormProps) {
  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="flex flex-col gap-5"
    >
      <FormField
        label="Correo electrónico"
        htmlFor="email"
        error={errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          placeholder="tu@empresa.com"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          error={!!errors.email}
          {...register("email")}
        />
      </FormField>

      {errorMessage && <p className="text-sm text-alert">{errorMessage}</p>}

      <Button type="submit" loading={isPending} className="w-full">
        Enviar enlace
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

function ForgotPasswordFormFooter() {
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

export const ForgotPasswordForm = Object.assign(ForgotPasswordFormRoot, {
  Footer: ForgotPasswordFormFooter,
});

// =============================================================================
// EmailSentView Component
// =============================================================================

function EmailSentViewRoot() {
  return (
    <StatusView
      variant="info"
      message="El enlace expirará en 1 hora. Si no recibes el correo, revisa tu carpeta de spam."
    />
  );
}

function EmailSentViewFooter() {
  return (
    <Link
      to="/login"
      className="font-semibold text-primary hover:text-primary-hover transition-colors"
    >
      Volver a iniciar sesión
    </Link>
  );
}

export const EmailSentView = Object.assign(EmailSentViewRoot, {
  Footer: EmailSentViewFooter,
});
