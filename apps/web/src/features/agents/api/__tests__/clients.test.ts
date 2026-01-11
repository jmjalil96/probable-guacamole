import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useAgentClients,
  useAssignAgentClient,
  useRemoveAgentClient,
  searchAvailableClientsForAgent,
} from "../clients";
import { agentClientKeys, agentKeys } from "../keys";
import type {
  ListAgentClientsResponse,
  AssignAgentClientResponse,
  ListAvailableClientsResponse,
} from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAgentClientsResponse: ListAgentClientsResponse = {
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

const mockAssignResponse: AssignAgentClientResponse = {
  agentId: "agent-1",
  clientId: "client-new",
  clientName: "New Client",
  assignedAt: "2024-06-01T10:00:00Z",
};

// =============================================================================
// useAgentClients
// =============================================================================

describe("useAgentClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches agent clients", async () => {
    server.use(
      http.get("*/agents/agent-1/clients", () => {
        return HttpResponse.json(mockAgentClientsResponse);
      })
    );

    const { result } = renderHook(() => useAgentClients("agent-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAgentClientsResponse);
    expect(result.current.data?.data).toHaveLength(2);
  });

  it("does not fetch when agentId is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/agents/*/clients", () => {
        fetchCalled = true;
        return HttpResponse.json(mockAgentClientsResponse);
      })
    );

    const { result } = renderHook(() => useAgentClients(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/agents/agent-1/clients", async () => {
        await delay(100);
        return HttpResponse.json(mockAgentClientsResponse);
      })
    );

    const { result } = renderHook(() => useAgentClients("agent-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/agents/agent-1/clients", () => {
        return HttpResponse.json(
          { message: "Agent not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useAgentClients("agent-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches agent clients", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/agents/agent-1/clients", () => {
        return HttpResponse.json(mockAgentClientsResponse);
      })
    );

    const { result } = renderHook(() => useAgentClients("agent-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(
      agentClientKeys.list("agent-1")
    );
    expect(cachedData).toEqual(mockAgentClientsResponse);
  });
});

// =============================================================================
// useAssignAgentClient
// =============================================================================

describe("useAssignAgentClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST request to assign client", async () => {
    let requestPath: string | null = null;

    server.use(
      http.post("*/agents/:agentId/clients/:clientId", ({ request }) => {
        requestPath = new URL(request.url).pathname;
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignAgentClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestPath).toContain("/agents/agent-1/clients/client-new");
  });

  it("returns assignment data on success", async () => {
    server.use(
      http.post("*/agents/:agentId/clients/:clientId", () => {
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignAgentClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockAssignResponse);
    });
  });

  it("invalidates agent clients cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentClientKeys.list("agent-1"), {
      data: [],
    });

    server.use(
      http.post("*/agents/:agentId/clients/:clientId", () => {
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignAgentClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      agentClientKeys.list("agent-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates agent detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentKeys.detail("agent-1"), { id: "agent-1" });

    server.use(
      http.post("*/agents/:agentId/clients/:clientId", () => {
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignAgentClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-new",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(agentKeys.detail("agent-1"));
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("handles conflict error for already assigned", async () => {
    server.use(
      http.post("*/agents/:agentId/clients/:clientId", () => {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "Client is already assigned to this agent",
            },
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(() => useAssignAgentClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "already-assigned",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.post("*/agents/:agentId/clients/:clientId", async () => {
        await delay(100);
        return HttpResponse.json(mockAssignResponse, { status: 201 });
      })
    );

    const { result } = renderHook(() => useAssignAgentClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
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
// useRemoveAgentClient
// =============================================================================

describe("useRemoveAgentClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends DELETE request to remove client", async () => {
    let requestPath: string | null = null;

    server.use(
      http.delete("*/agents/:agentId/clients/:clientId", ({ request }) => {
        requestPath = new URL(request.url).pathname;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useRemoveAgentClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestPath).toContain("/agents/agent-1/clients/client-1");
  });

  it("invalidates agent clients cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentClientKeys.list("agent-1"), {
      data: [{ clientId: "client-1", clientName: "Test", assignedAt: "" }],
    });

    server.use(
      http.delete("*/agents/:agentId/clients/:clientId", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useRemoveAgentClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      agentClientKeys.list("agent-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates agent detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentKeys.detail("agent-1"), {
      id: "agent-1",
      clientCount: 1,
    });

    server.use(
      http.delete("*/agents/:agentId/clients/:clientId", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useRemoveAgentClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "client-1",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(agentKeys.detail("agent-1"));
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("handles not found error", async () => {
    server.use(
      http.delete("*/agents/:agentId/clients/:clientId", () => {
        return HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Client is not assigned to this agent",
            },
          },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useRemoveAgentClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
        clientId: "not-assigned",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.delete("*/agents/:agentId/clients/:clientId", async () => {
        await delay(100);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useRemoveAgentClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        agentId: "agent-1",
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
// searchAvailableClientsForAgent
// =============================================================================

const mockAvailableClientsResponse: ListAvailableClientsResponse = {
  data: [
    { id: "client-available-1", name: "Available Corp" },
    { id: "client-available-2", name: "Ready Inc" },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

describe("searchAvailableClientsForAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches available clients with search query", async () => {
    let requestUrl: string | null = null;

    server.use(
      http.get("*/agents/agent-1/clients/available", ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(mockAvailableClientsResponse);
      })
    );

    const result = await searchAvailableClientsForAgent("agent-1", "acme");

    expect(requestUrl).toContain("search=acme");
    expect(result.data).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it("fetches available clients without search query", async () => {
    let requestUrl: string | null = null;

    server.use(
      http.get("*/agents/agent-1/clients/available", ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(mockAvailableClientsResponse);
      })
    );

    const result = await searchAvailableClientsForAgent("agent-1", "");

    expect(requestUrl).not.toContain("search=");
    expect(result.data).toHaveLength(2);
  });

  it("sends default pagination params", async () => {
    let requestUrl: string | null = null;

    server.use(
      http.get("*/agents/agent-1/clients/available", ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(mockAvailableClientsResponse);
      })
    );

    await searchAvailableClientsForAgent("agent-1", "test");

    expect(requestUrl).toContain("page=1");
    expect(requestUrl).toContain("limit=20");
    expect(requestUrl).toContain("sortBy=name");
    expect(requestUrl).toContain("sortOrder=asc");
  });
});
