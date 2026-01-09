import { createFileRoute, Outlet } from "@tanstack/react-router";
import { claimsSearchSchema } from "@/features/claims/browse";

export const Route = createFileRoute("/_authenticated/_app/claims")({
  validateSearch: claimsSearchSchema,
  component: ClaimsLayout,
});

function ClaimsLayout() {
  return <Outlet />;
}
