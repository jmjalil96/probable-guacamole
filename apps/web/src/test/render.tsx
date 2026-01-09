import type { ReactElement, ReactNode } from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import type { MeResponse } from "shared";
import { mockAuthenticatedUser } from "./mocks/data/users";

/**
 * Creates a fresh QueryClient for testing with no retries and instant gc
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  user?: MeResponse | null;
  initialPath?: string;
}

interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
}

/**
 * Wraps a component with all necessary providers for testing
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  const {
    queryClient = createTestQueryClient(),
    user = mockAuthenticatedUser,
    ...renderOptions
  } = options;

  // Pre-populate auth cache if user provided
  if (user !== undefined) {
    queryClient.setQueryData(["auth", "me"], user);
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Creates a test router with a simple root route for testing components
 * that need router context
 */
export function createTestRouter(component: ReactElement, initialPath = "/") {
  const rootRoute = createRootRoute({
    component: () => component,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
  });

  const routeTree = rootRoute.addChildren([indexRoute]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

interface RenderWithRouterOptions extends RenderWithProvidersOptions {
  initialPath?: string;
}

/**
 * Renders a component with both QueryClient and Router providers.
 * The component will be rendered inside the router context.
 */
export function renderWithRouter(
  ui: ReactElement,
  options: RenderWithRouterOptions = {}
): RenderWithProvidersResult {
  const {
    queryClient = createTestQueryClient(),
    user = mockAuthenticatedUser,
    initialPath = "/",
    ...renderOptions
  } = options;

  // Pre-populate auth cache if user provided
  if (user !== undefined) {
    queryClient.setQueryData(["auth", "me"], user);
  }

  // Create a simple router that renders the test component
  const rootRoute = createRootRoute({
    component: () => ui,
  });

  const routeTree = rootRoute.addChildren([]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  function Wrapper() {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
  }

  // Render an empty div since the actual component is rendered inside RouterProvider
  return {
    ...render(<div />, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Creates a wrapper function for testing hooks with React Query
 */
export function createWrapper(
  queryClient?: QueryClient,
  user?: MeResponse | null
) {
  const client = queryClient ?? createTestQueryClient();

  if (user !== undefined) {
    client.setQueryData(["auth", "me"], user);
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Creates a wrapper function for testing hooks that need both React Query and Router.
 * Uses RouterContext to provide router context without full RouterProvider.
 */
export function createWrapperWithRouter(
  queryClient?: QueryClient,
  user?: MeResponse | null
) {
  const client = queryClient ?? createTestQueryClient();

  if (user !== undefined) {
    client.setQueryData(["auth", "me"], user);
  }

  // Create a simple router for testing
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
        {children}
      </QueryClientProvider>
    );
  };
}
