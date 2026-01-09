import { createFileRoute } from "@tanstack/react-router";
import { ClaimDetailView } from "@/features/claims/detail";

export const Route = createFileRoute("/_authenticated/_app/claims/$claimId")({
  component: ClaimDetailPage,
});

function ClaimDetailPage() {
  const { claimId } = Route.useParams();
  return <ClaimDetailView claimId={claimId} />;
}
