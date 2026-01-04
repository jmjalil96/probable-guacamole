import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useLogout } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <h1 className="text-3xl font-bold text-primary">Home (Protected)</h1>

      {/* Dev logout button */}
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        title="Logout (dev)"
        className="fixed top-4 right-4 p-3 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}
