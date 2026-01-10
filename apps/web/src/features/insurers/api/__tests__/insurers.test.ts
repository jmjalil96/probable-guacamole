import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useListInsurers,
  useInsurer,
  useCreateInsurer,
  useUpdateInsurer,
  useDeleteInsurer,
} from "../insurers";
import { insurerKeys } from "../keys";
import type { ListInsurersResponse, Insurer } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockInsurerListResponse: ListInsurersResponse = {
  data: [
    {
      id: "insurer-1",
      name: "Test Insurance Co",
      code: "TIC-001",
      email: "contact@test.com",
      phone: "+1234567890",
      website: "https://test.com",
      type: "COMPANIA_DE_SEGUROS",
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "insurer-2",
      name: "Prepaid Health Co",
      code: "PHC-002",
      email: "info@prepaid.com",
      phone: "+0987654321",
      website: "https://prepaid.com",
      type: "MEDICINA_PREPAGADA",
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

const mockInsurerDetail: Insurer = {
  id: "insurer-1",
  name: "Test Insurance Co",
  code: "TIC-001",
  email: "contact@test.com",
  phone: "+1234567890",
  website: "https://test.com",
  type: "COMPANIA_DE_SEGUROS",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// useListInsurers
// =============================================================================

describe("useListInsurers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/insurers", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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
        http.get("*/insurers", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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
        http.get("*/insurers", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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

    it("sends type filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/insurers", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            type: "MEDICINA_PREPAGADA",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("type=MEDICINA_PREPAGADA");
    });

    it("sends isActive filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/insurers", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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
        http.get("*/insurers", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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
      expect(requestUrl).not.toContain("type=");
    });
  });

  describe("response handling", () => {
    it("returns data on success", async () => {
      server.use(
        http.get("*/insurers", () => {
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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

      expect(result.current.data).toEqual(mockInsurerListResponse);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/insurers", async () => {
          await delay(100);
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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
        http.get("*/insurers", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
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
        http.get("*/insurers", () => {
          return HttpResponse.json(mockInsurerListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListInsurers({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            type: "COMPANIA_DE_SEGUROS",
            isActive: true,
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data is cached with the correct key
      const cachedData = queryClient.getQueryData(
        insurerKeys.list({
          page: 1,
          limit: 20,
          sortBy: "name",
          sortOrder: "asc",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockInsurerListResponse);
    });
  });
});

// =============================================================================
// useInsurer
// =============================================================================

describe("useInsurer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches insurer by id", async () => {
    server.use(
      http.get("*/insurers/insurer-1", () => {
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useInsurer("insurer-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockInsurerDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/insurers/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useInsurer(""), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure no request is made
    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/insurers/insurer-1", async () => {
        await delay(100);
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useInsurer("insurer-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/insurers/insurer-1", () => {
        return HttpResponse.json(
          { message: "Insurer not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useInsurer("insurer-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches insurer by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/insurers/insurer-1", () => {
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useInsurer("insurer-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(insurerKeys.detail("insurer-1"));
    expect(cachedData).toEqual(mockInsurerDetail);
  });
});

// =============================================================================
// useCreateInsurer
// =============================================================================

describe("useCreateInsurer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST request with insurer data", async () => {
    let requestBody: unknown;

    server.use(
      http.post("*/insurers", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ id: "new-insurer-1" });
      })
    );

    const { result } = renderHook(() => useCreateInsurer(), {
      wrapper: createWrapper(),
    });

    const createData = {
      name: "New Insurance Co",
      code: "NIC-001",
      email: "contact@new.com",
      phone: "+1111111111",
      website: "https://new.com",
      type: "COMPANIA_DE_SEGUROS" as const,
    };

    act(() => {
      result.current.mutate(createData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual(createData);
  });

  it("invalidates all insurers cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(insurerKeys.all, { data: [] });

    server.use(
      http.post("*/insurers", () => {
        return HttpResponse.json({ id: "new-insurer-1" });
      })
    );

    const { result } = renderHook(() => useCreateInsurer(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        name: "New Insurance Co",
        type: "COMPANIA_DE_SEGUROS",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(insurerKeys.all);
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns created insurer id", async () => {
    const createdResponse = { id: "new-insurer-1" };

    server.use(
      http.post("*/insurers", () => {
        return HttpResponse.json(createdResponse);
      })
    );

    const { result } = renderHook(() => useCreateInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "New Insurance Co",
        type: "COMPANIA_DE_SEGUROS",
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(createdResponse);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.post("*/insurers", () => {
        return HttpResponse.json(
          { message: "Name is required" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useCreateInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "",
        type: "COMPANIA_DE_SEGUROS",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("handles uniqueness conflict error", async () => {
    server.use(
      http.post("*/insurers", () => {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "An insurer with this name already exists",
            },
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(() => useCreateInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "Duplicate Name",
        type: "COMPANIA_DE_SEGUROS",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.post("*/insurers", async () => {
        await delay(100);
        return HttpResponse.json({ id: "new-insurer-1" });
      })
    );

    const { result } = renderHook(() => useCreateInsurer(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        name: "New Insurance Co",
        type: "COMPANIA_DE_SEGUROS",
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
// useUpdateInsurer
// =============================================================================

describe("useUpdateInsurer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH request with update data", async () => {
    let requestBody: unknown;

    server.use(
      http.patch("*/insurers/insurer-1", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useUpdateInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "insurer-1",
        data: { name: "Updated Insurance Co" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual({ name: "Updated Insurance Co" });
  });

  it("invalidates detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(insurerKeys.detail("insurer-1"), mockInsurerDetail);

    server.use(
      http.patch("*/insurers/insurer-1", () => {
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useUpdateInsurer(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "insurer-1",
        data: { name: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(insurerKeys.detail("insurer-1"));
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(insurerKeys.lists(), { data: [] });

    server.use(
      http.patch("*/insurers/insurer-1", () => {
        return HttpResponse.json(mockInsurerDetail);
      })
    );

    const { result } = renderHook(() => useUpdateInsurer(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "insurer-1",
        data: { name: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(insurerKeys.lists());
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns updated insurer data", async () => {
    const updatedInsurer = {
      ...mockInsurerDetail,
      name: "Updated Insurance Co",
    };

    server.use(
      http.patch("*/insurers/insurer-1", () => {
        return HttpResponse.json(updatedInsurer);
      })
    );

    const { result } = renderHook(() => useUpdateInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "insurer-1",
        data: { name: "Updated Insurance Co" },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedInsurer);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.patch("*/insurers/insurer-1", () => {
        return HttpResponse.json(
          { message: "Validation failed" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useUpdateInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "insurer-1",
        data: { name: "" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// =============================================================================
// useDeleteInsurer
// =============================================================================

describe("useDeleteInsurer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends DELETE request", async () => {
    let deletedId: string | null = null;

    server.use(
      http.delete("*/insurers/:id", ({ params }) => {
        deletedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("insurer-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(deletedId).toBe("insurer-1");
  });

  it("invalidates all insurers cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(insurerKeys.all, { data: [] });

    server.use(
      http.delete("*/insurers/insurer-1", () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteInsurer(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate("insurer-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(insurerKeys.all);
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("handles constraint error (insurer with policies)", async () => {
    server.use(
      http.delete("*/insurers/insurer-1", () => {
        return HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "Cannot delete insurer with associated policies",
            },
          },
          { status: 409 }
        );
      })
    );

    const { result } = renderHook(() => useDeleteInsurer(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("insurer-1");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.delete("*/insurers/insurer-1", async () => {
        await delay(100);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteInsurer(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate("insurer-1");
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
