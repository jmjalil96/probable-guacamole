import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useReviewClaim,
  useSubmitClaim,
  useSettleClaim,
  useReturnClaim,
  useRequestInfo,
  useProvideInfo,
  useCancelClaim,
} from "../transitions";
import { claimKeys } from "../keys";

// =============================================================================
// Transition Hooks - No Reason Required
// =============================================================================

describe("useReviewClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls /claims/:id/review endpoint", async () => {
    let calledPath: string | null = null;

    server.use(
      http.post("*/claims/:id/:action", ({ request }) => {
        calledPath = new URL(request.url).pathname;
        return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/review");
    });
  });

  it("sends empty body when no data provided", async () => {
    let requestBody: unknown;

    server.use(
      http.post("*/claims/:id/review", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(requestBody).toEqual({});
    });
  });

  it("invalidates claim detail cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.detail("claim-1"), {
      id: "claim-1",
      status: "DRAFT",
    });

    server.use(
      http.post("*/claims/claim-1/review", () => {
        return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Cache should be invalidated - check query state
    const queryState = queryClient.getQueryState(claimKeys.detail("claim-1"));
    // When invalidated, either isInvalidated is true or the query was removed
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("invalidates lists cache on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.lists(), { data: [], total: 0 });

    server.use(
      http.post("*/claims/claim-1/review", () => {
        return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryState = queryClient.getQueryState(claimKeys.lists());
    // When invalidated, either isInvalidated is true or the query was removed
    expect(queryState?.isInvalidated || queryState === undefined).toBeTruthy();
  });

  it("returns response data on success", async () => {
    const responseData = { id: "claim-1", status: "IN_REVIEW" };

    server.use(
      http.post("*/claims/claim-1/review", () => {
        return HttpResponse.json(responseData);
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(responseData);
    });
  });
});

describe("useSubmitClaim", () => {
  it("calls /claims/:id/submit endpoint", async () => {
    let calledPath: string | null = null;

    server.use(
      http.post("*/claims/:id/:action", ({ request }) => {
        calledPath = new URL(request.url).pathname;
        return HttpResponse.json({ id: "claim-1", status: "SUBMITTED" });
      })
    );

    const { result } = renderHook(() => useSubmitClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/submit");
    });
  });

  it("invalidates caches on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.detail("claim-1"), { id: "claim-1" });
    queryClient.setQueryData(claimKeys.lists(), { data: [] });

    server.use(
      http.post("*/claims/claim-1/submit", () => {
        return HttpResponse.json({ id: "claim-1", status: "SUBMITTED" });
      })
    );

    const { result } = renderHook(() => useSubmitClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const detailState = queryClient.getQueryState(claimKeys.detail("claim-1"));
    const listsState = queryClient.getQueryState(claimKeys.lists());
    expect(
      detailState?.isInvalidated || detailState === undefined
    ).toBeTruthy();
    expect(listsState?.isInvalidated || listsState === undefined).toBeTruthy();
  });
});

describe("useSettleClaim", () => {
  it("calls /claims/:id/settle endpoint", async () => {
    let calledPath: string | null = null;

    server.use(
      http.post("*/claims/:id/:action", ({ request }) => {
        calledPath = new URL(request.url).pathname;
        return HttpResponse.json({ id: "claim-1", status: "SETTLED" });
      })
    );

    const { result } = renderHook(() => useSettleClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/settle");
    });
  });
});

// =============================================================================
// Transition Hooks - Reason Required
// =============================================================================

describe("useReturnClaim", () => {
  it("calls /claims/:id/return endpoint with reason", async () => {
    let calledPath: string | null = null;
    let requestBody: unknown;

    server.use(
      http.post("*/claims/:id/:action", async ({ request }) => {
        calledPath = new URL(request.url).pathname;
        requestBody = await request.json();
        return HttpResponse.json({ id: "claim-1", status: "RETURNED" });
      })
    );

    const { result } = renderHook(() => useReturnClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { reason: "Missing documents" },
      });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/return");
      expect(requestBody).toEqual({ reason: "Missing documents" });
    });
  });

  it("invalidates caches on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.detail("claim-1"), { id: "claim-1" });

    server.use(
      http.post("*/claims/claim-1/return", () => {
        return HttpResponse.json({ id: "claim-1", status: "RETURNED" });
      })
    );

    const { result } = renderHook(() => useReturnClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { reason: "Test reason" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const detailState = queryClient.getQueryState(claimKeys.detail("claim-1"));
    expect(
      detailState?.isInvalidated || detailState === undefined
    ).toBeTruthy();
  });
});

describe("useRequestInfo", () => {
  it("calls /claims/:id/request-info endpoint with reason", async () => {
    let calledPath: string | null = null;
    let requestBody: unknown;

    server.use(
      http.post("*/claims/:id/:action", async ({ request }) => {
        calledPath = new URL(request.url).pathname;
        requestBody = await request.json();
        return HttpResponse.json({ id: "claim-1", status: "PENDING_INFO" });
      })
    );

    const { result } = renderHook(() => useRequestInfo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { reason: "Need clarification on diagnosis" },
      });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/request-info");
      expect(requestBody).toEqual({
        reason: "Need clarification on diagnosis",
      });
    });
  });
});

describe("useProvideInfo", () => {
  it("calls /claims/:id/provide-info endpoint with reason", async () => {
    let calledPath: string | null = null;
    let requestBody: unknown;

    server.use(
      http.post("*/claims/:id/:action", async ({ request }) => {
        calledPath = new URL(request.url).pathname;
        requestBody = await request.json();
        return HttpResponse.json({ id: "claim-1", status: "SUBMITTED" });
      })
    );

    const { result } = renderHook(() => useProvideInfo(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { reason: "Additional documentation attached" },
      });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/provide-info");
      expect(requestBody).toEqual({
        reason: "Additional documentation attached",
      });
    });
  });
});

describe("useCancelClaim", () => {
  it("calls /claims/:id/cancel endpoint with reason", async () => {
    let calledPath: string | null = null;
    let requestBody: unknown;

    server.use(
      http.post("*/claims/:id/:action", async ({ request }) => {
        calledPath = new URL(request.url).pathname;
        requestBody = await request.json();
        return HttpResponse.json({ id: "claim-1", status: "CANCELLED" });
      })
    );

    const { result } = renderHook(() => useCancelClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { reason: "Claim no longer needed" },
      });
    });

    await waitFor(() => {
      expect(calledPath).toContain("/claims/claim-1/cancel");
      expect(requestBody).toEqual({ reason: "Claim no longer needed" });
    });
  });

  it("invalidates caches on success", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(claimKeys.detail("claim-1"), { id: "claim-1" });
    queryClient.setQueryData(claimKeys.lists(), { data: [] });

    server.use(
      http.post("*/claims/claim-1/cancel", () => {
        return HttpResponse.json({ id: "claim-1", status: "CANCELLED" });
      })
    );

    const { result } = renderHook(() => useCancelClaim(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: "claim-1",
        data: { reason: "Cancelled by user" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const detailState = queryClient.getQueryState(claimKeys.detail("claim-1"));
    const listsState = queryClient.getQueryState(claimKeys.lists());
    expect(
      detailState?.isInvalidated || detailState === undefined
    ).toBeTruthy();
    expect(listsState?.isInvalidated || listsState === undefined).toBeTruthy();
  });
});

// =============================================================================
// Error Handling
// =============================================================================

describe("transition error handling", () => {
  it("reports error on API failure", async () => {
    server.use(
      http.post("*/claims/claim-1/review", () => {
        return HttpResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("does not call onSuccess callbacks on error", async () => {
    const onSuccessMock = vi.fn();

    server.use(
      http.post("*/claims/claim-1/review", () => {
        return HttpResponse.json({ message: "Failed" }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ id: "claim-1" }, { onSuccess: onSuccessMock });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // onSuccess should not have been called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Mutation State
// =============================================================================

describe("transition mutation state", () => {
  it("tracks isPending state", async () => {
    server.use(
      http.post("*/claims/claim-1/review", async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it("resets state between mutations", async () => {
    server.use(
      http.post("*/claims/:id/review", () => {
        return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
      })
    );

    const { result } = renderHook(() => useReviewClaim(), {
      wrapper: createWrapper(),
    });

    // First mutation
    act(() => {
      result.current.mutate({ id: "claim-1" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Reset and verify state is cleared
    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
  });
});
