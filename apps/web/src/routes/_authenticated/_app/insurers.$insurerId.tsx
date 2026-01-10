import { createFileRoute } from "@tanstack/react-router";
import { InsurerDetailView } from "@/features/insurers/detail";

export const Route = createFileRoute("/_authenticated/_app/insurers/$insurerId")({
  component: InsurerDetailPage,
});

function InsurerDetailPage() {
  const { insurerId } = Route.useParams();
  return <InsurerDetailView insurerId={insurerId} />;
}
