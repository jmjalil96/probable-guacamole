import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useClientAdminClients,
  useAssignClientAdminClient,
  useRemoveClientAdminClient,
  searchAvailableClientsForClientAdmin,
} from "../clients";
import { clientAdminClientKeys, clientAdminKeys } from "../keys";
import type {
  ListClientAdminClientsResponse,
  AssignClientAdminClientResponse,
  ListAvailableClientsResponse,
} from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockClientAdminClientsResponse: ListClientAdminClientsResponse = {
  data: [
    {
      clientId: "client-1",
      clientName: "Acme Corporation",
      assignedAt: "2024-01-15T10:00:00Z",
    },
    {
      clientId: "client-2",
      clientName: "Tech Innovations LLC",
      assignedAt: "2024-02-20T14:30:00Z",
    },
  ],
};

const mockAssignResponse: AssignClientAdminClientResponse = {
  clientAdminId: "client-admin-1",
  clientId: "client-new",
  clientName: "New Client",
  assignedAt: "2024-06-01T10:00:00Z",
};

// =============================================================================
// useClientAdminClients
// =============================================================================

describe("useClientAdminClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches client admin clients", async () => {
    server.use(
      http.get("*/client-admins/client-admin-1/clients", () => {
        return HttpResponse.json(mockClientAdminClientsResponse);
      })
    );

    const { result } = renderHook(
      () => useClientAdminClients("client-admin-1"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClientAdminClientsResponse);
    expect(result.current.data?.data).toHaveLength(2);
  });

  it("does not fetch when clientAdminId is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/client-admins/*/clients", () => {
        fetchCalled = true;
        return HttpResponse.json(mockClientAdminClientsResponse);
      })
    );

    const { result } = renderHook(() => useClientAdminClients(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/client-admins/client-admin-1/clients", async () => {
        await delay(100);
        return HttpResponse.json(mockClientAdminClientsResponse);
      })
    );

    const { result } = renderHook(
      () => useClientAdminClients("client-admin-1"),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/client-admins/client-admin-1/clients", () => {
        return HttpResponse.json(
          { message: "Client admin not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(
      () => useClientAdminClients("client-admin-1"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches client admin clients", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/client-admins/client-admin-1/clients", () => {
        return HttpResponse.json(mockClientAdminClientsResponse);
      })
    );

    const { result } = renderHook(
      () => useClientAdminClients("client-admin-1"),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(
      clientAdminClientKeys.list("client-admin-1")
    );
    expect(cachedData).toEqual(mockClientAdminClientsResponse);
  });
});

// =============================================================================
// useAssignClientAdminClient
// =============================================================================

describe("useAssignClientAdminClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST request to assign client", async () => {
    let requestPath: string | null = null;

    server.use(
      http.post(
        "*/client-admins/:clientAdminId/clients/:clientId",
        ({ request }) => {
          requestPath = new URL(request.url).pathname;
          return HttpResponse.json(mockAssignResponse, { status: 201 });
        }
      )
    );

    const { result } = renderHook(() => useAssignClientAdminClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestPath).toContain(
      "/client-admins/client-admin-1/clients/client-new"
    );
  });

  it("returns assignment data on success", async () => {
    server.use(
      http.post("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignClientAdminClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockAssignResponse);
    });
  });

  it("invalidates client admin clients cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientAdminClientKeys.list("client-admin-1"), {
      data: [],
    });

    server.use(
      http.post("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignClientAdminClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      clientAdminClientKeys.list("client-admin-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates client admin detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientAdminKeys.detail("client-admin-1"), {
      id: "client-admin-1",
    });

    server.use(
      http.post("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignClientAdminClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      clientAdminKeys.detail("client-admin-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("handles conflict error for already assigned", async () => {
    server.use(
      http.post("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "Client is already assigned to this client admin",
            },
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(() => useAssignClientAdminClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "already-assigned",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.post("*/client-admins/:clientAdminId/clients/:clientId", async () => {
        await delay(100);
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignClientAdminClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

// =============================================================================
// useRemoveClientAdminClient
// =============================================================================

describe("useRemoveClientAdminClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends DELETE request to remove client", async () => {
    let requestPath: string | null = null;

    server.use(
      http.delete(
        "*/client-admins/:clientAdminId/clients/:clientId",
        ({ request }) => {
          requestPath = new URL(request.url).pathname;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );

    const { result } = renderHook(() => useRemoveClientAdminClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestPath).toContain(
      "/client-admins/client-admin-1/clients/client-1"
    );
  });

  it("invalidates client admin clients cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientAdminClientKeys.list("client-admin-1"), {
      data: [{ clientId: "client-1", clientName: "Test", assignedAt: "" }],
    });

    server.use(
      http.delete("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useRemoveClientAdminClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      clientAdminClientKeys.list("client-admin-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates client admin detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientAdminKeys.detail("client-admin-1"), {
      id: "client-admin-1",
      clientCount: 1,
    });

    server.use(
      http.delete("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useRemoveClientAdminClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      clientAdminKeys.detail("client-admin-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("handles not found error", async () => {
    server.use(
      http.delete("*/client-admins/:clientAdminId/clients/:clientId", () => {
        return HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Client is not assigned to this client admin",
            },
          },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useRemoveClientAdminClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "not-assigned",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.delete(
        "*/client-admins/:clientAdminId/clients/:clientId",
        async () => {
          await delay(100);
          return new HttpResponse(null, { status: 204 });
        }
      )
    );

    const { result } = renderHook(() => useRemoveClientAdminClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        clientAdminId: "client-admin-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

// =============================================================================
// searchAvailableClientsForClientAdmin
// =============================================================================

const mockAvailableClientsResponse: ListAvailableClientsResponse = {
  data: [
    { id: "client-available-1", name: "Available Corp" },
    { id: "client-available-2", name: "Ready Inc" },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

describe("searchAvailableClientsForClientAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches available clients with search query", async () => {
    let requestUrl: string | null = null;

    server.use(
      http.get(
        "*/client-admins/client-admin-1/clients/available",
        ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAvailableClientsResponse);
        }
      )
    );

    const result = await searchAvailableClientsForClientAdmin(
      "client-admin-1",
      "acme"
    );

    expect(requestUrl).toContain("search=acme");
    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it("fetches available clients without search query", async () => {
    let requestUrl: string | null = null;

    server.use(
      http.get(
        "*/client-admins/client-admin-1/clients/available",
        ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAvailableClientsResponse);
        }
      )
    );

    const result = await searchAvailableClientsForClientAdmin(
      "client-admin-1",
      ""
    );

    expect(requestUrl).not.toContain("search=");
    expect(result.data).toHaveLength(2);
  });

  it("sends default pagination params", async () => {
    let requestUrl: string | null = null;

    server.use(
      http.get(
        "*/client-admins/client-admin-1/clients/available",
        ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAvailableClientsResponse);
        }
      )
    );

    await searchAvailableClientsForClientAdmin("client-admin-1", "test");

    expect(requestUrl).toContain("page=1");
    expect(requestUrl).toContain("limit=20");
    expect(requestUrl).toContain("sortBy=name");
    expect(requestUrl).toContain("sortOrder=asc");
  });
});
