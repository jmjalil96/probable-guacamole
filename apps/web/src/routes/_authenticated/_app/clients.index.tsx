import { createFileRoute } from "@tanstack/react-router";
import { ClientsListView } from "@/features/clients/browse";

export const Route = createFileRoute("/_authenticated/_app/clients/")({
  component: ClientsIndexPage,
});

function ClientsIndexPage() {
  return <ClientsListView />;
}
