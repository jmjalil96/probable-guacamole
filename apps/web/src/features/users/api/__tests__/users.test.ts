import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import { useListUsers } from "../users";
import { userKeys } from "../keys";
import type { ListUsersResponse, UserListItem } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockUserListItem: UserListItem = {
  id: "user-1",
  type: "employee",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  hasAccount: true,
  hasPendingInvitation: false,
  accountIsActive: true,
  department: "Engineering",
};

const mockUserListResponse: ListUsersResponse = {
  data: [
    mockUserListItem,
    {
      ...mockUserListItem,
      id: "user-2",
      type: "agent",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@agency.com",
      department: undefined,
      licenseNumber: "LIC-001",
      agencyName: "Smith Agency",
    },
    {
      ...mockUserListItem,
      id: "user-3",
      type: "client_admin",
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob.johnson@client.com",
      department: undefined,
      jobTitle: "Account Manager",
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 3,
    totalPages: 1,
  },
};

// =============================================================================
// useListUsers
// =============================================================================

describe("useListUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            type: "employee",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("type=employee");
    });

    it("sends isActive filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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

    it("sends hasAccount filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
            page: 1,
            limit: 20,
            sortBy: "name",
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

    it("sends clientId filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
            page: 1,
            limit: 20,
            sortBy: "name",
            sortOrder: "asc",
            clientId: "client-123",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("clientId=client-123");
    });

    it("omits undefined params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/users", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
      expect(requestUrl).not.toContain("clientId=");
    });
  });

  describe("response handling", () => {
    it("returns data on success", async () => {
      server.use(
        http.get("*/users", () => {
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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

      expect(result.current.data).toEqual(mockUserListResponse);
      expect(result.current.data?.data).toHaveLength(3);
      expect(result.current.data?.pagination.total).toBe(3);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/users", async () => {
          await delay(100);
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
        http.get("*/users", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
        http.get("*/users", () => {
          return HttpResponse.json(mockUserListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListUsers({
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
        userKeys.list({
          page: 1,
          limit: 20,
          sortBy: "name",
          sortOrder: "asc",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockUserListResponse);
    });
  });
});
