import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useListClientAdmins,
  useClientAdmin,
  useUpdateClientAdmin,
} from "../client-admins";
import { clientAdminKeys } from "../keys";
import type { ListClientAdminsResponse, ClientAdmin } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockClientAdminListResponse: ListClientAdminsResponse = {
  data: [
    {
      id: "client-admin-1",
      firstName: "Laura",
      lastName: "Gomez",
      email: "laura.gomez@client.com",
      phone: "+573001234567",
      jobTitle: "Account Manager",
      isActive: true,
      hasAccount: true,
      clientCount: 2,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "client-admin-2",
      firstName: "Diego",
      lastName: "Hernandez",
      email: "diego.hernandez@client.com",
      phone: null,
      jobTitle: "HR Director",
      isActive: true,
      hasAccount: false,
      clientCount: 4,
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

const mockClientAdminDetail: ClientAdmin = {
  id: "client-admin-1",
  firstName: "Laura",
  lastName: "Gomez",
  email: "laura.gomez@client.com",
  phone: "+573001234567",
  jobTitle: "Account Manager",
  isActive: true,
  hasAccount: true,
  clientCount: 2,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// useListClientAdmins
// =============================================================================

describe("useListClientAdmins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/client-admins", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", () => {
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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

      expect(result.current.data).toEqual(mockClientAdminListResponse);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/client-admins", async () => {
          await delay(100);
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        http.get("*/client-admins", () => {
          return HttpResponse.json(mockClientAdminListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClientAdmins({
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
        clientAdminKeys.list({
          page: 1,
          limit: 20,
          sortBy: "lastName",
          sortOrder: "asc",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockClientAdminListResponse);
    });
  });
});

// =============================================================================
// useClientAdmin
// =============================================================================

describe("useClientAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches client admin by id", async () => {
    server.use(
      http.get("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useClientAdmin("client-admin-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClientAdminDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/client-admins/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useClientAdmin(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/client-admins/client-admin-1", async () => {
        await delay(100);
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useClientAdmin("client-admin-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(
          { message: "Client admin not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useClientAdmin("client-admin-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches client admin by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useClientAdmin("client-admin-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(
      clientAdminKeys.detail("client-admin-1")
    );
    expect(cachedData).toEqual(mockClientAdminDetail);
  });
});

// =============================================================================
// useUpdateClientAdmin
// =============================================================================

describe("useUpdateClientAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH request with update data", async () => {
    let requestBody: unknown;

    server.use(
      http.patch("*/client-admins/client-admin-1", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClientAdmin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "client-admin-1",
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
    queryClient.setQueryData(
      clientAdminKeys.detail("client-admin-1"),
      mockClientAdminDetail
    );

    server.use(
      http.patch("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClientAdmin(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "client-admin-1",
        data: { firstName: "Updated" },
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

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(clientAdminKeys.lists(), { data: [] });

    server.use(
      http.patch("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClientAdmin(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "client-admin-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(clientAdminKeys.lists());
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns updated client admin data", async () => {
    const updatedClientAdmin = {
      ...mockClientAdminDetail,
      firstName: "Updated",
    };

    server.use(
      http.patch("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(updatedClientAdmin);
      })
    );

    const { result } = renderHook(() => useUpdateClientAdmin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "client-admin-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedClientAdmin);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.patch("*/client-admins/client-admin-1", () => {
        return HttpResponse.json(
          { message: "Validation failed" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useUpdateClientAdmin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "client-admin-1",
        data: { firstName: "" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.patch("*/client-admins/client-admin-1", async () => {
        await delay(100);
        return HttpResponse.json(mockClientAdminDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClientAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        id: "client-admin-1",
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
