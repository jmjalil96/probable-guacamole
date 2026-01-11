import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetailView } from "@/features/employees/detail";

export const Route = createFileRoute("/_authenticated/_app/employees/$employeeId")({
  component: EmployeeDetailPage,
});

function EmployeeDetailPage() {
  const { employeeId } = Route.useParams();
  return <EmployeeDetailView employeeId={employeeId} />;
}
