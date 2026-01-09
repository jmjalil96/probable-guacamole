import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layouts";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
