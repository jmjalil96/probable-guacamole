import { createFileRoute, Outlet } from "@tanstack/react-router";
import { insurersSearchSchema } from "@/features/insurers/browse";

export const Route = createFileRoute("/_authenticated/_app/insurers")({
  validateSearch: insurersSearchSchema,
  component: InsurersLayout,
});

function InsurersLayout() {
  return <Outlet />;
}
