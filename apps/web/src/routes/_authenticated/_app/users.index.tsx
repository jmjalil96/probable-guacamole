import { createFileRoute } from "@tanstack/react-router";
import { UsersListView } from "@/features/users/browse";

export const Route = createFileRoute("/_authenticated/_app/users/")({
  component: UsersIndexPage,
});

function UsersIndexPage() {
  return <UsersListView />;
}
