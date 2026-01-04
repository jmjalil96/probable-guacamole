import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
      <p className="mt-2 text-text-muted">
        Welcome to CotizateAlgo Claims Manager
      </p>
    </div>
  );
}
