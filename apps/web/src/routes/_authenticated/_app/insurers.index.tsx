import { createFileRoute } from "@tanstack/react-router";
import { InsurersListView } from "@/features/insurers/browse";

export const Route = createFileRoute("/_authenticated/_app/insurers/")({
  component: InsurersIndexPage,
});

function InsurersIndexPage() {
  return <InsurersListView />;
}
