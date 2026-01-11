import { createFileRoute, Outlet } from "@tanstack/react-router";
import { affiliatesSearchSchema } from "@/features/affiliates/browse";

export const Route = createFileRoute("/_authenticated/_app/affiliates")({
  validateSearch: affiliatesSearchSchema,
  component: AffiliatesLayout,
});

function AffiliatesLayout() {
  return <Outlet />;
}
