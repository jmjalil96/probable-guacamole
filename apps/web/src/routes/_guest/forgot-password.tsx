import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { passwordResetRequestSchema, type PasswordResetRequest } from "shared";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, FormField, Input } from "@/components/ui";
import { useRequestPasswordReset } from "@/lib/auth";
import { isApiError } from "@/lib/api";

export const Route = createFileRoute("/_guest/forgot-password")({
  component: ForgotPasswordPage,
});

function BrandContent() {
  return (
    <>
      <div className="max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
          Recupera el acceso a tu cuenta
        </h2>
        <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
          Te enviaremos un enlace para restablecer tu contraseña de forma
          segura.
        </p>
      </div>
    </>
  );
}

function getErrorMessage(error: Error | null): string | null {
  if (!error) return null;

  if (isApiError(error)) {
    if (error.isNetworkError) {
      return "Error de conexión. Por favor, intenta de nuevo.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
}

function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const requestReset = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const onSubmit = (data: PasswordResetRequest) => {
    requestReset.mutate(data, {
      onSuccess: () => setIsSubmitted(true),
    });
  };

  const errorMessage = getErrorMessage(requestReset.error);

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña"
        brandContent={<BrandContent />}
        footer={
          <>
            <Link
              to="/login"
              className="font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <p className="text-center text-sm text-text-muted">
            El enlace expirará en 1 hora. Si no recibes el correo, revisa tu
            carpeta de spam.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña"
      brandContent={<BrandContent />}
      footer={
        <>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </Link>
        </>
      }
    >
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

        <Button
          type="submit"
          loading={requestReset.isPending}
          className="w-full"
        >
          Enviar enlace
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
