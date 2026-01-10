import { createFileRoute } from "@tanstack/react-router";
import { ClientDetailView } from "@/features/clients/detail";

export const Route = createFileRoute("/_authenticated/_app/clients/$clientId")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  return <ClientDetailView clientId={clientId} />;
}
