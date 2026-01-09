import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button, FormField, Input, PasswordInput } from "@/components/ui";
import type { UseLoginFormReturn } from "./hooks";

// =============================================================================
// Types
// =============================================================================

export type LoginFormProps = UseLoginFormReturn;

// =============================================================================
// Form Component
// =============================================================================

function LoginFormRoot({
  register,
  handleSubmit,
  errors,
  isPending,
  errorMessage,
  onSubmit,
}: LoginFormProps) {
  return (
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
            to="/forgot-password"
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
      {errorMessage && <p className="text-sm text-alert">{errorMessage}</p>}

      {/* Submit Button */}
      <Button type="submit" loading={isPending} className="w-full">
        Iniciar sesión
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

// =============================================================================
// Footer Component
// =============================================================================

function LoginFormFooter() {
  return (
    <>
      ¿No tienes una cuenta?{" "}
      <Link
        to="/"
        className="font-semibold text-primary hover:text-primary-hover transition-colors"
      >
        Solicitar acceso
      </Link>
    </>
  );
}

// =============================================================================
// Compound Export
// =============================================================================

export const LoginForm = Object.assign(LoginFormRoot, {
  Footer: LoginFormFooter,
});
