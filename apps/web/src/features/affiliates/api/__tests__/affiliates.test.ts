import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import { useListAffiliates, useAffiliate } from "../affiliates";
import { affiliateKeys } from "../keys";
import type { ListAffiliatesResponse, AffiliateDetail } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockAffiliateListResponse: ListAffiliatesResponse = {
  data: [
    {
      id: "affiliate-1",
      firstName: "John",
      lastName: "Doe",
      documentType: "CPF",
      documentNumber: "12345678901",
      email: "john.doe@example.com",
      phone: "+5511999999999",
      dateOfBirth: "1990-01-15",
      gender: "MALE",
      maritalStatus: "MARRIED",
      isActive: true,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      client: { id: "client-1", name: "Test Client" },
      hasPortalAccess: true,
      portalInvitationPending: false,
      dependentsCount: 2,
      dependents: [
        {
          id: "dep-1",
          firstName: "Jane",
          lastName: "Doe",
          documentType: "CPF",
          documentNumber: "98765432109",
          relationship: "SPOUSE",
          isActive: true,
        },
      ],
    },
    {
      id: "affiliate-2",
      firstName: "Maria",
      lastName: "Silva",
      documentType: "CPF",
      documentNumber: "11122233344",
      email: "maria.silva@example.com",
      phone: null,
      dateOfBirth: "1985-06-20",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      isActive: true,
      createdAt: "2024-01-10T08:00:00Z",
      updatedAt: "2024-01-10T08:00:00Z",
      client: { id: "client-1", name: "Test Client" },
      hasPortalAccess: false,
      portalInvitationPending: false,
      dependentsCount: 0,
      dependents: [],
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

const mockAffiliateDetail: AffiliateDetail = {
  id: "affiliate-1",
  firstName: "John",
  lastName: "Doe",
  documentType: "CPF",
  documentNumber: "12345678901",
  email: "john.doe@example.com",
  phone: "+5511999999999",
  dateOfBirth: "1990-01-15",
  gender: "MALE",
  maritalStatus: "MARRIED",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  client: { id: "client-1", name: "Test Client" },
  hasPortalAccess: true,
  portalInvitationPending: false,
  dependentsCount: 2,
  dependents: [
    {
      id: "dep-1",
      firstName: "Jane",
      lastName: "Doe",
      documentType: "CPF",
      documentNumber: "98765432109",
      relationship: "SPOUSE",
      isActive: true,
    },
  ],
  primaryAffiliate: null,
};

// =============================================================================
// useListAffiliates
// =============================================================================

describe("useListAffiliates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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

    it("sends clientId filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
            page: 1,
            limit: 20,
            sortBy: "lastName",
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

    it("sends isActive filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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

    it("sends hasPortalAccess filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            hasPortalAccess: "true",
            isActive: true,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("hasPortalAccess=true");
    });

    it("omits undefined params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/affiliates", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
            page: 1,
            limit: 20,
            sortBy: "lastName",
            sortOrder: "asc",
            isActive: true,
            // search is undefined
            // clientId is undefined
            // hasPortalAccess is undefined
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).not.toContain("search=");
      expect(requestUrl).not.toContain("clientId=");
      expect(requestUrl).not.toContain("hasPortalAccess=");
    });
  });

  describe("response handling", () => {
    it("returns data on success", async () => {
      server.use(
        http.get("*/affiliates", () => {
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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

      expect(result.current.data).toEqual(mockAffiliateListResponse);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.pagination.total).toBe(2);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/affiliates", async () => {
          await delay(100);
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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
        http.get("*/affiliates", () => {
          return HttpResponse.json({ message: "Server error" }, { status: 500 });
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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
        http.get("*/affiliates", () => {
          return HttpResponse.json(mockAffiliateListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListAffiliates({
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
        affiliateKeys.list({
          page: 1,
          limit: 20,
          sortBy: "lastName",
          sortOrder: "asc",
          isActive: true,
        })
      );
      expect(cachedData).toEqual(mockAffiliateListResponse);
    });
  });
});

// =============================================================================
// useAffiliate
// =============================================================================

describe("useAffiliate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches affiliate by id", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", () => {
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliate("affiliate-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAffiliateDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/affiliates/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliate(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", async () => {
        await delay(100);
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliate("affiliate-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", () => {
        return HttpResponse.json({ message: "Affiliate not found" }, { status: 404 });
      })
    );

    const { result } = renderHook(() => useAffiliate("affiliate-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches affiliate by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/affiliates/affiliate-1", () => {
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliate("affiliate-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(affiliateKeys.detail("affiliate-1"));
    expect(cachedData).toEqual(mockAffiliateDetail);
  });
});
