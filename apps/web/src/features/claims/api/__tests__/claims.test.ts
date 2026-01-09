import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useListClaims,
  useClaim,
  useUpdateClaim,
  useCreateClaim,
} from "../claims";
import { claimKeys } from "../keys";
import type { ListClaimsResponse, ClaimDetail } from "shared";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockClaimListResponse: ListClaimsResponse = {
  data: [
    {
      id: "claim-1",
      claimNumber: 1,
      status: "DRAFT",
      careType: "AMBULATORY",
      description: "Test claim",
      diagnosis: null,
      amountSubmitted: "1000.00",
      amountApproved: null,
      amountDenied: null,
      amountUnprocessed: null,
      deductibleApplied: null,
      copayApplied: null,
      incidentDate: "2024-01-15",
      submittedDate: null,
      settlementDate: null,
      businessDays: null,
      settlementNumber: null,
      settlementNotes: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      policy: { id: "policy-1", number: "POL-001" },
      client: { id: "client-1", name: "Test Client" },
      affiliate: { id: "affiliate-1", name: "Test Affiliate" },
      patient: { id: "patient-1", name: "John Doe" },
      createdBy: { id: "user-1", name: "Admin User" },
      updatedBy: null,
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

const mockClaimDetail: ClaimDetail = {
  id: "claim-1",
  claimNumber: 1,
  status: "DRAFT",
  description: "Test claim description",
  diagnosis: "Test diagnosis",
  careType: "AMBULATORY",
  incidentDate: "2024-01-15",
  submittedDate: null,
  settlementDate: null,
  businessDays: null,
  amountSubmitted: "1000.00",
  amountApproved: null,
  amountDenied: null,
  amountUnprocessed: null,
  deductibleApplied: null,
  copayApplied: null,
  settlementNumber: null,
  settlementNotes: null,
  policy: { id: "policy-1", number: "POL-001" },
  client: { id: "client-1", name: "Test Client" },
  affiliate: { id: "affiliate-1", name: "Test Affiliate" },
  patient: { id: "patient-1", name: "John Doe" },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  createdBy: { id: "user-1", name: "Admin User" },
  updatedBy: null,
};

// =============================================================================
// useListClaims
// =============================================================================

describe("useListClaims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query parameters", () => {
    it("sends pagination params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 2,
            limit: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
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
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "claimNumber",
            sortOrder: "asc",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("sortBy=claimNumber");
      expect(requestUrl).toContain("sortOrder=asc");
    });

    it("sends search param", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
            search: "test query",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("search=test");
    });

    it("sends status filter as comma-separated", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
            status: ["DRAFT", "SUBMITTED"],
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("status=DRAFT%2CSUBMITTED");
    });

    it("sends careType filter", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
            careType: "AMBULATORY",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("careType=AMBULATORY");
    });

    it("sends date range filters", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
            submittedDateFrom: "2024-01-01",
            submittedDateTo: "2024-01-31",
            incidentDateFrom: "2024-02-01",
            incidentDateTo: "2024-02-28",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).toContain("submittedDateFrom=2024-01-01");
      expect(requestUrl).toContain("submittedDateTo=2024-01-31");
      expect(requestUrl).toContain("incidentDateFrom=2024-02-01");
      expect(requestUrl).toContain("incidentDateTo=2024-02-28");
    });

    it("omits undefined params", async () => {
      let requestUrl: string | null = null;

      server.use(
        http.get("*/claims", ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestUrl).not.toContain("search=");
      expect(requestUrl).not.toContain("status=");
      expect(requestUrl).not.toContain("careType=");
    });
  });

  describe("response handling", () => {
    it("returns data on success", async () => {
      server.use(
        http.get("*/claims", () => {
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockClaimListResponse);
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.pagination.total).toBe(1);
    });

    it("tracks loading state", async () => {
      server.use(
        http.get("*/claims", async () => {
          await delay(100);
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
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
        http.get("*/claims", () => {
          return HttpResponse.json(
            { message: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
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
        http.get("*/claims", () => {
          return HttpResponse.json(mockClaimListResponse);
        })
      );

      const { result } = renderHook(
        () =>
          useListClaims({
            page: 1,
            limit: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
            status: ["DRAFT"],
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data is cached with the correct key
      const cachedData = queryClient.getQueryData(
        claimKeys.list({
          page: 1,
          limit: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
          status: ["DRAFT"],
        })
      );
      expect(cachedData).toEqual(mockClaimListResponse);
    });
  });
});

// =============================================================================
// useClaim
// =============================================================================

describe("useClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches claim by id", async () => {
    server.use(
      http.get("*/claims/claim-1", () => {
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useClaim("claim-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockClaimDetail);
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/claims/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useClaim(""), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure no request is made
    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/claims/claim-1", async () => {
        await delay(100);
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useClaim("claim-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.get("*/claims/claim-1", () => {
        return HttpResponse.json(
          { message: "Claim not found" },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useClaim("claim-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("caches claim by id", async () => {
    const queryClient = createTestQueryClient();

    server.use(
      http.get("*/claims/claim-1", () => {
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useClaim("claim-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedData = queryClient.getQueryData(claimKeys.detail("claim-1"));
    expect(cachedData).toEqual(mockClaimDetail);
  });
});

// =============================================================================
// useUpdateClaim
// =============================================================================

describe("useUpdateClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH request with update data", async () => {
    let requestBody: unknown;

    server.use(
      http.patch("*/claims/claim-1", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { description: "Updated description" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual({ description: "Updated description" });
  });

  it("invalidates detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.detail("claim-1"), mockClaimDetail);

    server.use(
      http.patch("*/claims/claim-1", () => {
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { description: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(claimKeys.detail("claim-1"));
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.lists(), { data: [] });

    server.use(
      http.patch("*/claims/claim-1", () => {
        return HttpResponse.json(mockClaimDetail);
      })
    );

    const { result } = renderHook(() => useUpdateClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { description: "Updated" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(claimKeys.lists());
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns updated claim data", async () => {
    const updatedClaim = {
      ...mockClaimDetail,
      description: "Updated description",
    };

    server.use(
      http.patch("*/claims/claim-1", () => {
        return HttpResponse.json(updatedClaim);
      })
    );

    const { result } = renderHook(() => useUpdateClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { description: "Updated description" },
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedClaim);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.patch("*/claims/claim-1", () => {
        return HttpResponse.json(
          { message: "Validation failed" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useUpdateClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { description: "Invalid" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// =============================================================================
// useCreateClaim
// =============================================================================

describe("useCreateClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends POST request with claim data", async () => {
    let requestBody: unknown;

    server.use(
      http.post("*/claims", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ id: "new-claim-1", claimNumber: 1 });
      })
    );

    const { result } = renderHook(() => useCreateClaim(), {
      wrapper: createWrapper(),
    });

    const createData = {
      clientId: "client-1",
      affiliateId: "affiliate-1",
      patientId: "patient-1",
      description: "New claim",
    };

    act(() => {
      result.current.mutate(createData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(requestBody).toEqual(createData);
  });

  it("invalidates all claims cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.all, { data: [] });

    server.use(
      http.post("*/claims", () => {
        return HttpResponse.json({ id: "new-claim-1" });
      })
    );

    const { result } = renderHook(() => useCreateClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        clientId: "client-1",
        affiliateId: "affiliate-1",
        patientId: "patient-1",
        description: "New claim",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(claimKeys.all);
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns created claim data", async () => {
    const createdClaim = { id: "new-claim-1", claimNumber: 1 };

    server.use(
      http.post("*/claims", () => {
        return HttpResponse.json(createdClaim);
      })
    );

    const { result } = renderHook(() => useCreateClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientId: "client-1",
        affiliateId: "affiliate-1",
        patientId: "patient-1",
        description: "New claim",
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(createdClaim);
    });
  });

  it("handles error response", async () => {
    server.use(
      http.post("*/claims", () => {
        return HttpResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useCreateClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        clientId: "",
        affiliateId: "",
        patientId: "",
        description: "",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("tracks pending state", async () => {
    server.use(
      http.post("*/claims", async () => {
        await delay(100);
        return HttpResponse.json({ id: "new-claim-1", claimNumber: 1 });
      })
    );

    const { result } = renderHook(() => useCreateClaim(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({
        clientId: "client-1",
        affiliateId: "affiliate-1",
        patientId: "patient-1",
        description: "New claim",
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
