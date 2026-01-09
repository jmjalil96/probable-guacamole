import { createFileRoute } from "@tanstack/react-router";
import { useLoginForm, LoginForm } from "@/features/auth/login";
import { AuthLayout, BrandContent } from "@/features/auth/shared";

export const Route = createFileRoute("/_guest/login")({
  component: LoginPage,
});

const LOGIN_STATS = [
  { value: "2.4k+", label: "Reclamos procesados" },
  { value: "98%", label: "Tasa de resolución" },
  { value: "15min", label: "Tiempo promedio" },
];

function LoginPage() {
  const form = useLoginForm();

  return (
    <AuthLayout
      title="Bienvenido de nuevo"
      subtitle="Ingresa tus credenciales para acceder a tu cuenta"
      brandContent={
        <BrandContent
          title="Optimiza tu gestión de reclamos"
          subtitle="Gestiona, rastrea y resuelve reclamos con precisión y eficiencia."
          stats={LOGIN_STATS}
        />
      }
      footer={<LoginForm.Footer />}
    >
      <LoginForm {...form} />
    </AuthLayout>
  );
}
