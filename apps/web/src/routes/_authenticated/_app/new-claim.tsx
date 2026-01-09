import { createFileRoute } from "@tanstack/react-router";
import { NewClaimView } from "@/features/claims/new-claim";

export const Route = createFileRoute("/_authenticated/_app/new-claim")({
  component: NewClaimPage,
});

function NewClaimPage() {
  return <NewClaimView />;
}
