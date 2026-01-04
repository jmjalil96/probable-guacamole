import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { loginRequestSchema, type LoginRequest } from "shared";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button, FormField, Input, PasswordInput } from "@/components/ui";
import { useLogin } from "@/lib/auth";
import { isApiError } from "@/lib/api";

export const Route = createFileRoute("/_guest/login")({
  component: LoginPage,
});

function BrandContent() {
  return (
    <>
      {/* Tagline */}
      <div className="max-w-md">
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
          Optimiza tu gestión de reclamos
        </h2>
        <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
          Gestiona, rastrea y resuelve reclamos con precisión y eficiencia.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-12">
        <div>
          <p className="text-3xl font-semibold text-white">2.4k+</p>
          <p className="mt-1 text-sm text-sidebar-muted">Reclamos procesados</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-white">98%</p>
          <p className="mt-1 text-sm text-sidebar-muted">Tasa de resolución</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-white">15min</p>
          <p className="mt-1 text-sm text-sidebar-muted">Tiempo promedio</p>
        </div>
      </div>
    </>
  );
}

function getErrorMessage(error: Error | null): string | null {
  if (!error) return null;

  if (isApiError(error)) {
    if (error.isUnauthorized) {
      return "Credenciales inválidas. Por favor, verifica tu correo y contraseña.";
    }
    if (error.isNetworkError) {
      return "Error de conexión. Por favor, intenta de nuevo.";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
}

function LoginPage() {
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

  const errorMessage = getErrorMessage(login.error);

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
      brandContent={<BrandContent />}
      footer={
        <>
          ¿No tienes una cuenta?{" "}
          <Link to="/" className="font-semibold text-primary hover:text-primary-hover transition-colors">
            Solicitar acceso
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-5"
      >
        {/* Email Field */}
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

        {/* Password Field */}
        <FormField
          label="Contraseña"
          htmlFor="password"
          error={errors.password?.message}
          labelAction={
            <Link
              to="/"
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            error={!!errors.password}
            {...register("password")}
          />
        </FormField>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-sm text-alert">{errorMessage}</p>
        )}

        {/* Submit Button */}
        <Button type="submit" loading={login.isPending} className="w-full">
          Iniciar sesión
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
