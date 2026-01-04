import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import type { RouterContext } from "@/router";
import { RouteError } from "@/components/error-boundary";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: RouteError,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
          },
          classNames: {
            success: "bg-success-light border-success text-success",
            error: "bg-alert-light border-alert text-alert",
            warning: "bg-warning-light border-warning text-warning",
            info: "bg-primary/10 border-primary text-primary",
          },
        }}
        richColors
        closeButton
        duration={4000}
      />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
