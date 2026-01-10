import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useListClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "../clients";
import { clientKeys } from "../keys";
import type { ListClientsResponse, Client } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockClientListResponse: ListClientsResponse = {
  data: [
    {
      id: "client-1",
      name: "Test Corporation",
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "client-2",
      name: "Another Company",
      isActive: true,
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

const mockClientDetail: Client = {
  id: "client-1",
  name: "Test Corporation",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// useListClients
// =============================================================================

describe("useListClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/clients", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 2,
            limit: 50,
            sortBy: "name",
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
        http.get("*/clients", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
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
        http.get("*/clients", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
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
        http.get("*/clients", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
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

    it("omits undefined params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/clients", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).not.toContain("search=");
    });
  });

  describe("response handling", () => {
    it("returns data on success", async () => {
      server.use(
        http.get("*/clients", () => {
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockClientListResponse);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/clients", async () => {
          await delay(100);
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
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
        http.get("*/clients", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
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
        http.get("*/clients", () => {
          return HttpResponse.json(mockClientListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClients({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            isActive: true,
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data is cached with the correct key
      const cachedData = queryClient.getQueryData(
        clientKeys.list({
          page: 1,
          limit: 20,
          sortBy: "name",
          sortOrder: "asc",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockClientListResponse);
    });
  });
});

// =============================================================================
// useClient
// =============================================================================

describe("useClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches client by id", async () => {
    server.use(
      http.get("*/clients/client-1", () => {
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useClient("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClientDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/clients/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useClient(""), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure no request is made
    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/clients/client-1", async () => {
        await delay(100);
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useClient("client-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/clients/client-1", () => {
        return HttpResponse.json(
          { message: "Client not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useClient("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches client by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/clients/client-1", () => {
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useClient("client-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(clientKeys.detail("client-1"));
    expect(cachedData).toEqual(mockClientDetail);
  });
});

// =============================================================================
// useCreateClient
// =============================================================================

describe("useCreateClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST request with client data", async () => {
    let requestBody: unknown;

    server.use(
      http.post("*/clients", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ id: "new-client-1" });
      })
    );

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    const createData = {
      name: "New Corporation",
    };

    act(() => {
      result.current.mutate(createData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual(createData);
  });

  it("invalidates all clients cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientKeys.all, { data: [] });

    server.use(
      http.post("*/clients", () => {
        return HttpResponse.json({ id: "new-client-1" });
      })
    );

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        name: "New Corporation",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(clientKeys.all);
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns created client id", async () => {
    const createdResponse = { id: "new-client-1" };

    server.use(
      http.post("*/clients", () => {
        return HttpResponse.json(createdResponse);
      })
    );

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "New Corporation",
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(createdResponse);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.post("*/clients", () => {
        return HttpResponse.json(
          { message: "Name is required" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("handles uniqueness conflict error", async () => {
    server.use(
      http.post("*/clients", () => {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "A client with this name already exists",
            },
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "Duplicate Name",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.post("*/clients", async () => {
        await delay(100);
        return HttpResponse.json({ id: "new-client-1" });
      })
    );

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        name: "New Corporation",
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
// useUpdateClient
// =============================================================================

describe("useUpdateClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH request with update data", async () => {
    let requestBody: unknown;

    server.use(
      http.patch("*/clients/client-1", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "client-1",
        data: { name: "Updated Corporation" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual({ name: "Updated Corporation" });
  });

  it("invalidates detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientKeys.detail("client-1"), mockClientDetail);

    server.use(
      http.patch("*/clients/client-1", () => {
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "client-1",
        data: { name: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(clientKeys.detail("client-1"));
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientKeys.lists(), { data: [] });

    server.use(
      http.patch("*/clients/client-1", () => {
        return HttpResponse.json(mockClientDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "client-1",
        data: { name: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(clientKeys.lists());
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns updated client data", async () => {
    const updatedClient = {
      ...mockClientDetail,
      name: "Updated Corporation",
    };

    server.use(
      http.patch("*/clients/client-1", () => {
        return HttpResponse.json(updatedClient);
      })
    );

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "client-1",
        data: { name: "Updated Corporation" },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedClient);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.patch("*/clients/client-1", () => {
        return HttpResponse.json(
          { message: "Validation failed" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "client-1",
        data: { name: "" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// =============================================================================
// useDeleteClient
// =============================================================================

describe("useDeleteClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends DELETE request", async () => {
    let deletedId: string | null = null;

    server.use(
      http.delete("*/clients/:id", ({ params }) => {
        deletedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("client-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(deletedId).toBe("client-1");
  });

  it("invalidates all clients cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientKeys.all, { data: [] });

    server.use(
      http.delete("*/clients/client-1", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate("client-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(clientKeys.all);
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("handles constraint error (client with affiliates)", async () => {
    server.use(
      http.delete("*/clients/client-1", () => {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "Cannot delete client with associated affiliates",
            },
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("client-1");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.delete("*/clients/client-1", async () => {
        await delay(100);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate("client-1");
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
