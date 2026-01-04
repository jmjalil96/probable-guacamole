import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
  beforeLoad: ({ context }) => {
    if (context.auth.data) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
