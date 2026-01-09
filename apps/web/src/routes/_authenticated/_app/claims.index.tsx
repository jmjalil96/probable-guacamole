import { createFileRoute } from "@tanstack/react-router";
import {
  useClaimsUrlState,
  ClaimsListView,
  ClaimsKanbanView,
} from "@/features/claims/browse";

export const Route = createFileRoute("/_authenticated/_app/claims/")({
  component: ClaimsIndexPage,
});

function ClaimsIndexPage() {
  const { search } = useClaimsUrlState();

  return search.view === "kanban" ? <ClaimsKanbanView /> : <ClaimsListView />;
}
