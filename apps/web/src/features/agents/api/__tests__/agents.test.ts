import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import { useListAgents, useAgent, useUpdateAgent } from "../agents";
import { agentKeys } from "../keys";
import type { ListAgentsResponse, Agent } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAgentListResponse: ListAgentsResponse = {
  data: [
    {
      id: "agent-1",
      firstName: "Carlos",
      lastName: "Garcia",
      email: "carlos.garcia@agency.com",
      phone: "+573001234567",
      licenseNumber: "LIC-001",
      agencyName: "Garcia Insurance Agency",
      isActive: true,
      hasAccount: true,
      clientCount: 3,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "agent-2",
      firstName: "Maria",
      lastName: "Rodriguez",
      email: "maria.rodriguez@agency.com",
      phone: null,
      licenseNumber: "LIC-002",
      agencyName: "Rodriguez & Associates",
      isActive: true,
      hasAccount: false,
      clientCount: 5,
      createdAt: "2024-01-10T08:00:00Z",
      updatedAt: "2024-01-10T08:00:00Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

const mockAgentDetail: Agent = {
  id: "agent-1",
  firstName: "Carlos",
  lastName: "Garcia",
  email: "carlos.garcia@agency.com",
  phone: "+573001234567",
  licenseNumber: "LIC-001",
  agencyName: "Garcia Insurance Agency",
  isActive: true,
  hasAccount: true,
  clientCount: 3,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// useListAgents
// =============================================================================

describe("useListAgents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/agents", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 2,
            limit: 50,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("page=2");
      expect(requestUrl).toContain("limit=50");
    });

    it("sends sorting params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/agents", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("sortBy=createdAt");
      expect(requestUrl).toContain("sortOrder=desc");
    });

    it("sends search param", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/agents", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            search: "test query",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("search=test");
    });

    it("sends isActive filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/agents", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: false,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("isActive=false");
    });

    it("sends hasAccount filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/agents", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            hasAccount: true,
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("hasAccount=true");
    });
  });

  describe("response handling", () => {
    it("returns data on success", async () => {
      server.use(
        http.get("*/agents", () => {
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAgentListResponse);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/agents", async () => {
          await delay(100);
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("handles error response", async () => {
      server.use(
        http.get("*/agents", () => {
          return HttpResponse.json({ message: "Server error" }, { status: 500 });
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("caching", () => {
    it("uses query key with params for caching", async () => {
      const queryClient = createTestQueryClient();

      server.use(
        http.get("*/agents", () => {
          return HttpResponse.json(mockAgentListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAgents({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cachedData = queryClient.getQueryData(
        agentKeys.list({
          page: 1,
          limit: 20,
          sortBy: "lastName",
          sortOrder: "asc",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockAgentListResponse);
    });
  });
});

// =============================================================================
// useAgent
// =============================================================================

describe("useAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches agent by id", async () => {
    server.use(
      http.get("*/agents/agent-1", () => {
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useAgent("agent-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAgentDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/agents/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useAgent(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/agents/agent-1", async () => {
        await delay(100);
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useAgent("agent-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/agents/agent-1", () => {
        return HttpResponse.json({ message: "Agent not found" }, { status: 404 });
      })
    );

    const { result } = renderHook(() => useAgent("agent-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches agent by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/agents/agent-1", () => {
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useAgent("agent-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(agentKeys.detail("agent-1"));
    expect(cachedData).toEqual(mockAgentDetail);
  });
});

// =============================================================================
// useUpdateAgent
// =============================================================================

describe("useUpdateAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH request with update data", async () => {
    let requestBody: unknown;

    server.use(
      http.patch("*/agents/agent-1", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useUpdateAgent(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "agent-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual({ firstName: "Updated" });
  });

  it("invalidates detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentKeys.detail("agent-1"), mockAgentDetail);

    server.use(
      http.patch("*/agents/agent-1", () => {
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useUpdateAgent(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "agent-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(agentKeys.detail("agent-1"));
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(agentKeys.lists(), { data: [] });

    server.use(
      http.patch("*/agents/agent-1", () => {
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useUpdateAgent(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "agent-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(agentKeys.lists());
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns updated agent data", async () => {
    const updatedAgent = {
      ...mockAgentDetail,
      firstName: "Updated",
    };

    server.use(
      http.patch("*/agents/agent-1", () => {
        return HttpResponse.json(updatedAgent);
      })
    );

    const { result } = renderHook(() => useUpdateAgent(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "agent-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedAgent);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.patch("*/agents/agent-1", () => {
        return HttpResponse.json({ message: "Validation failed" }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useUpdateAgent(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "agent-1",
        data: { firstName: "" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.patch("*/agents/agent-1", async () => {
        await delay(100);
        return HttpResponse.json(mockAgentDetail);
      })
    );

    const { result } = renderHook(() => useUpdateAgent(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        id: "agent-1",
        data: { firstName: "Updated" },
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
