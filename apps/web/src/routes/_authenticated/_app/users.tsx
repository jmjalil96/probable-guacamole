import { createFileRoute, Outlet } from "@tanstack/react-router";
import { usersSearchSchema } from "@/features/users/browse";

export const Route = createFileRoute("/_authenticated/_app/users")({
  validateSearch: usersSearchSchema,
  component: UsersLayout,
});

function UsersLayout() {
  return <Outlet />;
}
