import { createFileRoute } from "@tanstack/react-router";
import { AffiliatesListView } from "@/features/affiliates/browse";

export const Route = createFileRoute("/_authenticated/_app/affiliates/")({
  component: AffiliatesIndexPage,
});

function AffiliatesIndexPage() {
  return <AffiliatesListView />;
}
