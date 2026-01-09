import { createFileRoute } from "@tanstack/react-router";
import {
  acceptInvitationSearchSchema,
  useAcceptInvitationForm,
  AcceptInvitationForm,
} from "@/features/auth/accept-invitation";
import { AuthLayout, BrandContent, StatusView } from "@/features/auth/shared";
import { LoadingScreen } from "@/components/ui";

export const Route = createFileRoute("/_guest/accept-invitation")({
  validateSearch: acceptInvitationSearchSchema,
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const form = useAcceptInvitationForm();

  const brandContent = (
    <BrandContent
      title="Bienvenido al equipo"
      subtitle={
        form.roleName
          ? `Has sido invitado como ${form.roleName}. Crea tu contraseña para comenzar.`
          : "Crea tu contraseña para activar tu cuenta."
      }
    />
  );

  // Loading state
  if (form.state === "loading") {
    return <LoadingScreen />;
  }

  // No token provided
  if (form.state === "no-token") {
    return (
      <AuthLayout
        title="Invitación inválida"
        subtitle="No se proporcionó un token de invitación"
        brandContent={brandContent}
        footer={<AcceptInvitationForm.ErrorFooter />}
      >
        <StatusView variant="error" />
      </AuthLayout>
    );
  }

  // Invalid or expired invitation
  if (form.state === "token-error") {
    return (
      <AuthLayout
        title="Invitación expirada"
        subtitle="Esta invitación ha expirado o ya fue utilizada"
        brandContent={brandContent}
        footer={<AcceptInvitationForm.ErrorFooter />}
      >
        <StatusView
          variant="error"
          message="Las invitaciones expiran después de 7 días. Contacta a tu administrador para solicitar una nueva invitación."
        />
      </AuthLayout>
    );
  }

  // Form state
  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle={
        form.roleName
          ? `Serás registrado como ${form.roleName}`
          : "Crea tu contraseña para activar tu cuenta"
      }
      brandContent={brandContent}
      footer={<AcceptInvitationForm.Footer />}
    >
      <AcceptInvitationForm
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
