import { useRouter } from "@tanstack/react-router";
import { ErrorScreen } from "./error-screen";

interface RouteErrorProps {
  error: Error;
}

export function RouteError({ error }: RouteErrorProps) {
  const router = useRouter();

  return (
    <ErrorScreen
      message={error.message || "An unexpected error occurred"}
      onRetry={() => void router.invalidate()}
    />
  );
}
