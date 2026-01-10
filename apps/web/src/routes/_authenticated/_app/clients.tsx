import { createFileRoute, Outlet } from "@tanstack/react-router";
import { clientsSearchSchema } from "@/features/clients/browse";

export const Route = createFileRoute("/_authenticated/_app/clients")({
  validateSearch: clientsSearchSchema,
  component: ClientsLayout,
});

function ClientsLayout() {
  return <Outlet />;
}
