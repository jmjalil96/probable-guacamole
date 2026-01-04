import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, FormField, PasswordInput } from "@/components/ui";
import { LoadingScreen } from "@/components/ui/loading";
import { useValidateInvitation, useAcceptInvitation } from "@/lib/auth";
import { isApiError } from "@/lib/api";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_guest/accept-invitation")({
  validateSearch: searchSchema,
  component: AcceptInvitationPage,
});

const passwordFormSchema = z.object({
  password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(128),
});

type PasswordFormData = z.infer<typeof passwordFormSchema>;

function BrandContent({ roleName }: { roleName: string | undefined }) {
  return (
    <>
      <div className="max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
          Bienvenido al equipo
        </h2>
        <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
          {roleName
            ? `Has sido invitado como ${roleName}. Crea tu contraseña para comenzar.`
            : "Crea tu contraseña para activar tu cuenta."}
        </p>
      </div>
    </>
  );
}

function getErrorMessage(error: Error | null): string | null {
  if (!error) return null;

  if (isApiError(error)) {
    if (error.isNotFound) {
      return "La invitación ha expirado o ya fue utilizada.";
    }
    if (error.code === "CONFLICT") {
      return "Este correo ya está registrado o la cuenta ya fue activada.";
    }
    if (error.isNetworkError) {
      return "Error de conexión. Por favor, intenta de nuevo.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
}

function AcceptInvitationPage() {
  const { token } = useSearch({ from: "/_guest/accept-invitation" });
  const validateInvitation = useValidateInvitation(token ?? "");
  const acceptInvitation = useAcceptInvitation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
  });

  const onSubmit = (data: PasswordFormData) => {
    if (!token) return;
    acceptInvitation.mutate({ token, password: data.password });
  };

  const roleName = validateInvitation.data?.role?.displayName;

  // Loading state
  if (validateInvitation.isLoading) {
    return <LoadingScreen />;
  }

  // No token provided
  if (!token) {
    return (
      <AuthLayout
        title="Invitación inválida"
        subtitle="No se proporcionó un token de invitación"
        brandContent={<BrandContent roleName={undefined} />}
        footer={
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Ir a iniciar sesión
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

  // Invalid or expired invitation
  if (validateInvitation.isError) {
    return (
      <AuthLayout
        title="Invitación expirada"
        subtitle="Esta invitación ha expirado o ya fue utilizada"
        brandContent={<BrandContent roleName={undefined} />}
        footer={
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Ir a iniciar sesión
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-alert/10">
            <XCircle className="h-8 w-8 text-alert" />
          </div>
          <p className="text-center text-sm text-text-muted">
            Las invitaciones expiran después de 7 días. Contacta a tu
            administrador para solicitar una nueva invitación.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const errorMessage = getErrorMessage(acceptInvitation.error);

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle={
        roleName
          ? `Serás registrado como ${roleName}`
          : "Crea tu contraseña para activar tu cuenta"
      }
      brandContent={<BrandContent roleName={roleName} />}
      footer={
        <>
          ¿Ya tienes una cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
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

        <Button
          type="submit"
          loading={acceptInvitation.isPending}
          className="w-full"
        >
          Crear cuenta
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
