import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { UseQueryResult } from "@tanstack/react-query";
import type { MeResponse } from "shared";
import { LoadingScreen } from "@/components/ui";

export interface RouterContext {
  auth: UseQueryResult<MeResponse | null, Error>;
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultPendingComponent: LoadingScreen,
  defaultPendingMs: 150,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
