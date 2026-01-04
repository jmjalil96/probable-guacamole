import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, FormField, PasswordInput } from "@/components/ui";
import { LoadingScreen } from "@/components/ui/loading";
import { useValidateResetToken, useConfirmPasswordReset } from "@/lib/auth";
import { isApiError } from "@/lib/api";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

const passwordFormSchema = z.object({
  password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(128),
});

type PasswordFormData = z.infer<typeof passwordFormSchema>;

function BrandContent() {
  return (
    <>
      <div className="max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
          Crea una nueva contraseña
        </h2>
        <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
          Elige una contraseña segura de al menos 12 caracteres.
        </p>
      </div>
    </>
  );
}

function getErrorMessage(error: Error | null): string | null {
  if (!error) return null;

  if (isApiError(error)) {
    if (error.isNotFound) {
      return "El enlace ha expirado o ya fue utilizado.";
    }
    if (error.isNetworkError) {
      return "Error de conexión. Por favor, intenta de nuevo.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
}

function ResetPasswordPage() {
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

  const onSubmit = (data: PasswordFormData) => {
    if (!token) return;
    confirmReset.mutate({ token, password: data.password });
  };

  // Loading state
  if (validateToken.isLoading) {
    return <LoadingScreen />;
  }

  // No token provided
  if (!token) {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="No se proporcionó un token de restablecimiento"
        brandContent={<BrandContent />}
        footer={
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Solicitar nuevo enlace
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-alert/10">
            <XCircle className="h-8 w-8 text-alert" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Invalid or expired token
  if (validateToken.isError) {
    return (
      <AuthLayout
        title="Enlace expirado"
        subtitle="Este enlace de restablecimiento ha expirado o ya fue utilizado"
        brandContent={<BrandContent />}
        footer={
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Solicitar nuevo enlace
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-alert/10">
            <XCircle className="h-8 w-8 text-alert" />
          </div>
          <p className="text-center text-sm text-text-muted">
            Los enlaces de restablecimiento expiran después de 1 hora por
            seguridad.
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (confirmReset.isSuccess) {
    return (
      <AuthLayout
        title="Contraseña actualizada"
        subtitle="Tu contraseña ha sido restablecida exitosamente"
        brandContent={<BrandContent />}
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Iniciar sesión
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <p className="text-center text-sm text-text-muted">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const errorMessage = getErrorMessage(confirmReset.error);

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu nueva contraseña"
      brandContent={<BrandContent />}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>
      }
    >
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

        <Button
          type="submit"
          loading={confirmReset.isPending}
          className="w-full"
        >
          Restablecer contraseña
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
