import { createFileRoute } from "@tanstack/react-router";
import { AffiliateDetailView } from "@/features/affiliates/detail";

export const Route = createFileRoute(
  "/_authenticated/_app/affiliates/$affiliateId"
)({
  component: AffiliateDetailPage,
});

function AffiliateDetailPage() {
  const { affiliateId } = Route.useParams();
  return <AffiliateDetailView affiliateId={affiliateId} />;
}
