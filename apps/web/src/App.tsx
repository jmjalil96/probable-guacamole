import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { useAuthSync } from "@/features/auth";
import { LoadingScreen } from "@/components/ui";
import { ErrorScreen } from "@/components/error-boundary";

export function App() {
  const auth = useAuthSync();

  if (auth.isLoading) {
    return <LoadingScreen />;
  }

  // Only show blocking error screen if we have no cached auth data
  // (allows app to continue working during transient refetch failures)
  if (auth.isError && auth.data == null) {
    return (
      <ErrorScreen
        title="Unable to connect"
        message={auth.error?.message || "Could not verify your session"}
        onRetry={() => void auth.refetch()}
      />
    );
  }

  return <RouterProvider router={router} context={{ auth }} />;
}
