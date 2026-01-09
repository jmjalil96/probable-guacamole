import { createFileRoute } from "@tanstack/react-router";
import {
  resetPasswordSearchSchema,
  useResetPassword,
  ResetPasswordForm,
} from "@/features/auth/reset-password";
import { AuthLayout, BrandContent, StatusView } from "@/features/auth/shared";
import { LoadingScreen } from "@/components/ui";

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordPage,
});

const BRAND_CONTENT = (
  <BrandContent
    title="Crea una nueva contraseña"
    subtitle="Elige una contraseña segura de al menos 12 caracteres."
  />
);

function ResetPasswordPage() {
  const form = useResetPassword();

  // Loading state
  if (form.state === "loading") {
    return <LoadingScreen />;
  }

  // No token provided
  if (form.state === "no-token") {
    return (
      <AuthLayout
        title="Enlace inválido"
        subtitle="No se proporcionó un token de restablecimiento"
        brandContent={BRAND_CONTENT}
        footer={<ResetPasswordForm.ErrorFooter />}
      >
        <StatusView variant="error" />
      </AuthLayout>
    );
  }

  // Invalid or expired token
  if (form.state === "token-error") {
    return (
      <AuthLayout
        title="Enlace expirado"
        subtitle="Este enlace de restablecimiento ha expirado o ya fue utilizado"
        brandContent={BRAND_CONTENT}
        footer={<ResetPasswordForm.ErrorFooter />}
      >
        <StatusView
          variant="error"
          message="Los enlaces de restablecimiento expiran después de 1 hora por seguridad."
        />
      </AuthLayout>
    );
  }

  // Success state
  if (form.state === "success") {
    return (
      <AuthLayout
        title="Contraseña actualizada"
        subtitle="Tu contraseña ha sido restablecida exitosamente"
        brandContent={BRAND_CONTENT}
        footer={<ResetPasswordForm.SuccessFooter />}
      >
        <StatusView
          variant="success"
          message="Ya puedes iniciar sesión con tu nueva contraseña."
        />
      </AuthLayout>
    );
  }

  // Form state
  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Ingresa tu nueva contraseña"
      brandContent={BRAND_CONTENT}
      footer={<ResetPasswordForm.Footer />}
    >
      <ResetPasswordForm
        register={form.register}
        handleSubmit={form.handleSubmit}
        errors={form.errors}
        isPending={form.isPending}
        errorMessage={form.errorMessage}
        onSubmit={form.onSubmit}
      />
    </AuthLayout>
  );
}
