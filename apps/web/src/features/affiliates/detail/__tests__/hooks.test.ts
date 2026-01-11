import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import { useAffiliateDetail } from "../hooks";
import type { AffiliateDetail } from "shared";

// =============================================================================
// Mocks
// =============================================================================

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// =============================================================================
// Test Fixtures
// =============================================================================

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
  dependentsCount: 1,
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
// useAffiliateDetail
// =============================================================================

describe("useAffiliateDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches affiliate data", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", () => {
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliateDetail("affiliate-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.affiliate).toEqual(mockAffiliateDetail);
    expect(result.current.isError).toBe(false);
  });

  it("returns isLoading while fetching", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", async () => {
        await delay(100);
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliateDetail("affiliate-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.affiliate).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("returns isError on failure", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", () => {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      })
    );

    const { result } = renderHook(() => useAffiliateDetail("affiliate-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.affiliate).toBeUndefined();
    expect(result.current.error).toBeDefined();
  });

  it("navigateBack navigates to /affiliates", async () => {
    server.use(
      http.get("*/affiliates/affiliate-1", () => {
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliateDetail("affiliate-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.navigateBack();

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/affiliates" });
  });

  it("does not fetch when id is empty", async () => {
    let fetchCalled = false;

    server.use(
      http.get("*/affiliates/*", () => {
        fetchCalled = true;
        return HttpResponse.json(mockAffiliateDetail);
      })
    );

    const { result } = renderHook(() => useAffiliateDetail(""), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(fetchCalled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
