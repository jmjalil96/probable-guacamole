import { createFileRoute } from "@tanstack/react-router";
import { ClientAdminDetailView } from "@/features/client-admins/detail";

export const Route = createFileRoute("/_authenticated/_app/client-admins/$clientAdminId")({
  component: ClientAdminDetailPage,
});

function ClientAdminDetailPage() {
  const { clientAdminId } = Route.useParams();
  return <ClientAdminDetailView clientAdminId={clientAdminId} />;
}
