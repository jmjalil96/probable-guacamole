import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import { useListEmployees, useEmployee, useUpdateEmployee } from "../employees";
import { employeeKeys } from "../keys";
import type { ListEmployeesResponse, Employee } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockEmployeeListResponse: ListEmployeesResponse = {
  data: [
    {
      id: "employee-1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      department: "Engineering",
      isActive: true,
      hasAccount: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "employee-2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: null,
      department: "Sales",
      isActive: true,
      hasAccount: false,
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

const mockEmployeeDetail: Employee = {
  id: "employee-1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  department: "Engineering",
  isActive: true,
  hasAccount: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// useListEmployees
// =============================================================================

describe("useListEmployees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/employees", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", () => {
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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

      expect(result.current.data).toEqual(mockEmployeeListResponse);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/employees", async () => {
          await delay(100);
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        http.get("*/employees", () => {
          return HttpResponse.json(mockEmployeeListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListEmployees({
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
        employeeKeys.list({
          page: 1,
          limit: 20,
          sortBy: "lastName",
          sortOrder: "asc",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockEmployeeListResponse);
    });
  });
});

// =============================================================================
// useEmployee
// =============================================================================

describe("useEmployee", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches employee by id", async () => {
    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useEmployee("employee-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEmployeeDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/employees/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useEmployee(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/employees/employee-1", async () => {
        await delay(100);
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useEmployee("employee-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json(
          { message: "Employee not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useEmployee("employee-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches employee by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useEmployee("employee-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(
      employeeKeys.detail("employee-1")
    );
    expect(cachedData).toEqual(mockEmployeeDetail);
  });
});

// =============================================================================
// useUpdateEmployee
// =============================================================================

describe("useUpdateEmployee", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH request with update data", async () => {
    let requestBody: unknown;

    server.use(
      http.patch("*/employees/employee-1", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "employee-1",
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
      employeeKeys.detail("employee-1"),
      mockEmployeeDetail
    );

    server.use(
      http.patch("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "employee-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(
      employeeKeys.detail("employee-1")
    );
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(employeeKeys.lists(), { data: [] });

    server.use(
      http.patch("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "employee-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(employeeKeys.lists());
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns updated employee data", async () => {
    const updatedEmployee = {
      ...mockEmployeeDetail,
      firstName: "Updated",
    };

    server.use(
      http.patch("*/employees/employee-1", () => {
        return HttpResponse.json(updatedEmployee);
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "employee-1",
        data: { firstName: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedEmployee);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.patch("*/employees/employee-1", () => {
        return HttpResponse.json(
          { message: "Validation failed" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "employee-1",
        data: { firstName: "" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.patch("*/employees/employee-1", async () => {
        await delay(100);
        return HttpResponse.json(mockEmployeeDetail);
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        id: "employee-1",
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
