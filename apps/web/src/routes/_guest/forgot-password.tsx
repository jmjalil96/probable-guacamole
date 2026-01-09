import { createFileRoute } from "@tanstack/react-router";
import {
  useForgotPasswordForm,
  ForgotPasswordForm,
  EmailSentView,
} from "@/features/auth/forgot-password";
import { AuthLayout, BrandContent } from "@/features/auth/shared";

export const Route = createFileRoute("/_guest/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const form = useForgotPasswordForm();

  if (form.isSubmitted) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        subtitle="Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña"
        brandContent={
          <BrandContent
            title="Recupera el acceso a tu cuenta"
            subtitle="Te enviaremos un enlace para restablecer tu contraseña de forma segura."
          />
        }
        footer={<EmailSentView.Footer />}
      >
        <EmailSentView />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña"
      brandContent={
        <BrandContent
          title="Recupera el acceso a tu cuenta"
          subtitle="Te enviaremos un enlace para restablecer tu contraseña de forma segura."
        />
      }
      footer={<ForgotPasswordForm.Footer />}
    >
      <ForgotPasswordForm
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
