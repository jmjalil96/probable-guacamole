import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { ClaimDetail } from "shared";
import {
  useTabState,
  useModalState,
  useTransitions,
  useEditClaimForm,
  usePolicyLookup,
} from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockClaim = (
  overrides: Partial<ClaimDetail> = {}
): ClaimDetail => ({
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
  ...overrides,
});

// =============================================================================
// useTabState
// =============================================================================

describe("useTabState", () => {
  it("defaults to general tab", () => {
    const { result } = renderHook(() => useTabState());
    expect(result.current.activeTab).toBe("general");
  });

  it("accepts custom default tab", () => {
    const { result } = renderHook(() => useTabState("documents"));
    expect(result.current.activeTab).toBe("documents");
  });

  it("updates active tab when setActiveTab is called", () => {
    const { result } = renderHook(() => useTabState());

    act(() => {
      result.current.setActiveTab("invoices");
    });

    expect(result.current.activeTab).toBe("invoices");
  });

  it("allows switching between all tabs", () => {
    const { result } = renderHook(() => useTabState());
    const tabs = [
      "general",
      "documents",
      "invoices",
      "notes",
      "audit",
    ] as const;

    for (const tab of tabs) {
      act(() => {
        result.current.setActiveTab(tab);
      });
      expect(result.current.activeTab).toBe(tab);
    }
  });
});

// =============================================================================
// useModalState
// =============================================================================

describe("useModalState", () => {
  it("starts with edit modal closed", () => {
    const { result } = renderHook(() => useModalState());
    expect(result.current.editModal.open).toBe(false);
  });

  it("opens edit modal when onOpen is called", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.editModal.onOpen();
    });

    expect(result.current.editModal.open).toBe(true);
  });

  it("closes edit modal when onClose is called", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.editModal.onOpen();
    });
    expect(result.current.editModal.open).toBe(true);

    act(() => {
      result.current.editModal.onClose();
    });
    expect(result.current.editModal.open).toBe(false);
  });

  it("increments key on each open for component reset", () => {
    const { result } = renderHook(() => useModalState());
    const initialKey = result.current.editModal.key;

    act(() => {
      result.current.editModal.onOpen();
    });
    const keyAfterFirstOpen = result.current.editModal.key;

    act(() => {
      result.current.editModal.onClose();
      result.current.editModal.onOpen();
    });
    const keyAfterSecondOpen = result.current.editModal.key;

    expect(keyAfterFirstOpen).toBeGreaterThan(initialKey);
    expect(keyAfterSecondOpen).toBeGreaterThan(keyAfterFirstOpen);
  });
});

// =============================================================================
// useTransitions - Modal Opening Logic
// =============================================================================

describe("useTransitions", () => {
  describe("modal opening logic", () => {
    it("opens confirm modal for transitions not requiring reason", () => {
      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      // DRAFT -> IN_REVIEW doesn't require reason, so confirm modal opens
      expect(result.current.transitionState.confirmModal).not.toBeNull();
      expect(result.current.transitionState.confirmModal?.targetStatus).toBe(
        "IN_REVIEW"
      );
      expect(result.current.transitionState.reasonModal).toBeNull();
    });

    it("opens reason modal for transitions requiring reason", () => {
      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        // IN_REVIEW -> RETURNED requires reason
        result.current.transitionHandlers.handleTransition("RETURNED");
      });

      expect(result.current.transitionState.reasonModal).not.toBeNull();
      expect(result.current.transitionState.reasonModal?.targetStatus).toBe(
        "RETURNED"
      );
      expect(result.current.transitionState.confirmModal).toBeNull();
    });

    it("opens reason modal for CANCELLED transition", () => {
      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("CANCELLED");
      });

      // *->CANCELLED always requires reason
      expect(result.current.transitionState.reasonModal).not.toBeNull();
      expect(result.current.transitionState.reasonModal?.targetStatus).toBe(
        "CANCELLED"
      );
    });

    it("opens reason modal for PENDING_INFO transition", () => {
      const claim = createMockClaim({ status: "SUBMITTED" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        // SUBMITTED -> PENDING_INFO requires reason
        result.current.transitionHandlers.handleTransition("PENDING_INFO");
      });

      expect(result.current.transitionState.reasonModal).not.toBeNull();
      expect(result.current.transitionState.reasonModal?.targetStatus).toBe(
        "PENDING_INFO"
      );
    });

    it("uses special title for SUBMITTED from PENDING_INFO", () => {
      const claim = createMockClaim({ status: "PENDING_INFO" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        // PENDING_INFO -> SUBMITTED uses "Reenviar Reclamo" title
        result.current.transitionHandlers.handleTransition("SUBMITTED");
      });

      expect(result.current.transitionState.reasonModal?.title).toBe(
        "Reenviar Reclamo"
      );
    });

    it("does nothing when claim is undefined", () => {
      const { result } = renderHook(() => useTransitions(undefined), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      expect(result.current.transitionState.confirmModal).toBeNull();
      expect(result.current.transitionState.reasonModal).toBeNull();
    });
  });

  describe("reason modal handling", () => {
    it("tracks reason text input", () => {
      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("RETURNED");
      });

      expect(result.current.transitionState.reason).toBe("");

      act(() => {
        result.current.transitionHandlers.setReason("Test reason");
      });

      expect(result.current.transitionState.reason).toBe("Test reason");
    });

    it("clears reason when modal closes", () => {
      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("RETURNED");
        result.current.transitionHandlers.setReason("Test reason");
      });

      expect(result.current.transitionState.reason).toBe("Test reason");

      act(() => {
        result.current.transitionHandlers.handleReasonModalClose();
      });

      expect(result.current.transitionState.reason).toBe("");
      expect(result.current.transitionState.reasonModal).toBeNull();
    });

    it("does not confirm with empty reason", async () => {
      let apiCalled = false;
      server.use(
        http.post("*/claims/claim-1/return", () => {
          apiCalled = true;
          return HttpResponse.json({ id: "claim-1", status: "RETURNED" });
        })
      );

      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("RETURNED");
      });

      // Confirm without setting reason
      act(() => {
        result.current.transitionHandlers.handleReasonModalConfirm();
      });

      await new Promise((r) => setTimeout(r, 100));
      expect(apiCalled).toBe(false);
    });

    it("does not confirm with whitespace-only reason", async () => {
      let apiCalled = false;
      server.use(
        http.post("*/claims/claim-1/return", () => {
          apiCalled = true;
          return HttpResponse.json({ id: "claim-1", status: "RETURNED" });
        })
      );

      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("RETURNED");
        result.current.transitionHandlers.setReason("   ");
      });

      act(() => {
        result.current.transitionHandlers.handleReasonModalConfirm();
      });

      await new Promise((r) => setTimeout(r, 100));
      expect(apiCalled).toBe(false);
    });
  });

  describe("transition routing", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("routes DRAFT -> IN_REVIEW to review endpoint", async () => {
      let calledEndpoint: string | null = null;

      server.use(
        http.post("*/claims/:id/:endpoint", ({ params }) => {
          calledEndpoint = params.endpoint as string;
          return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("review");
      });
    });

    it("routes IN_REVIEW -> SUBMITTED to submit endpoint", async () => {
      let calledEndpoint: string | null = null;

      server.use(
        http.post("*/claims/:id/:endpoint", ({ params }) => {
          calledEndpoint = params.endpoint as string;
          return HttpResponse.json({ id: "claim-1", status: "SUBMITTED" });
        })
      );

      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("SUBMITTED");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("submit");
      });
    });

    it("routes PENDING_INFO -> SUBMITTED to provide-info endpoint", async () => {
      let calledEndpoint: string | null = null;
      let requestBody: unknown;

      server.use(
        http.post("*/claims/:id/:endpoint", async ({ params, request }) => {
          calledEndpoint = params.endpoint as string;
          requestBody = await request.json();
          return HttpResponse.json({ id: "claim-1", status: "SUBMITTED" });
        })
      );

      const claim = createMockClaim({ status: "PENDING_INFO" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("SUBMITTED");
        result.current.transitionHandlers.setReason("Info provided");
      });

      act(() => {
        result.current.transitionHandlers.handleReasonModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("provide-info");
        expect(requestBody).toEqual({ reason: "Info provided" });
      });
    });

    it("routes IN_REVIEW -> RETURNED to return endpoint", async () => {
      let calledEndpoint: string | null = null;
      let requestBody: unknown;

      server.use(
        http.post("*/claims/:id/:endpoint", async ({ params, request }) => {
          calledEndpoint = params.endpoint as string;
          requestBody = await request.json();
          return HttpResponse.json({ id: "claim-1", status: "RETURNED" });
        })
      );

      const claim = createMockClaim({ status: "IN_REVIEW" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("RETURNED");
        result.current.transitionHandlers.setReason("Missing documents");
      });

      act(() => {
        result.current.transitionHandlers.handleReasonModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("return");
        expect(requestBody).toEqual({ reason: "Missing documents" });
      });
    });

    it("routes SUBMITTED -> PENDING_INFO to request-info endpoint", async () => {
      let calledEndpoint: string | null = null;

      server.use(
        http.post("*/claims/:id/:endpoint", ({ params }) => {
          calledEndpoint = params.endpoint as string;
          return HttpResponse.json({ id: "claim-1", status: "PENDING_INFO" });
        })
      );

      const claim = createMockClaim({ status: "SUBMITTED" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("PENDING_INFO");
        result.current.transitionHandlers.setReason("Need more info");
      });

      act(() => {
        result.current.transitionHandlers.handleReasonModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("request-info");
      });
    });

    it("routes SUBMITTED -> SETTLED to settle endpoint", async () => {
      let calledEndpoint: string | null = null;

      server.use(
        http.post("*/claims/:id/:endpoint", ({ params }) => {
          calledEndpoint = params.endpoint as string;
          return HttpResponse.json({ id: "claim-1", status: "SETTLED" });
        })
      );

      const claim = createMockClaim({ status: "SUBMITTED" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("SETTLED");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("settle");
      });
    });

    it("routes *->CANCELLED to cancel endpoint", async () => {
      let calledEndpoint: string | null = null;
      let requestBody: unknown;

      server.use(
        http.post("*/claims/:id/:endpoint", async ({ params, request }) => {
          calledEndpoint = params.endpoint as string;
          requestBody = await request.json();
          return HttpResponse.json({ id: "claim-1", status: "CANCELLED" });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("CANCELLED");
        result.current.transitionHandlers.setReason("No longer needed");
      });

      act(() => {
        result.current.transitionHandlers.handleReasonModalConfirm();
      });

      await waitFor(() => {
        expect(calledEndpoint).toBe("cancel");
        expect(requestBody).toEqual({ reason: "No longer needed" });
      });
    });
  });

  describe("transition success handling", () => {
    it("closes modals on success", async () => {
      server.use(
        http.post("*/claims/claim-1/review", () => {
          return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      expect(result.current.transitionState.confirmModal).not.toBeNull();

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.confirmModal).toBeNull();
      });
    });

    it("clears transition error on success", async () => {
      // First make a failing request to set error
      server.use(
        http.post("*/claims/claim-1/review", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.transitionError).not.toBeNull();
      });

      // Now make a successful request
      server.use(
        http.post("*/claims/claim-1/review", () => {
          return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
        })
      );

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.transitionError).toBeNull();
      });
    });
  });

  describe("transition error handling", () => {
    it("sets transitionError on failure", async () => {
      server.use(
        http.post("*/claims/claim-1/review", () => {
          return HttpResponse.json(
            { message: "Missing required fields" },
            { status: 400 }
          );
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.transitionError).not.toBeNull();
        expect(
          result.current.transitionState.transitionError?.title
        ).toBeDefined();
      });
    });

    it("closes confirm modal on error", async () => {
      server.use(
        http.post("*/claims/claim-1/review", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      expect(result.current.transitionState.confirmModal).not.toBeNull();

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.confirmModal).toBeNull();
      });
    });

    it("allows dismissing error", async () => {
      server.use(
        http.post("*/claims/claim-1/review", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.transitionError).not.toBeNull();
      });

      act(() => {
        result.current.transitionHandlers.dismissError();
      });

      expect(result.current.transitionState.transitionError).toBeNull();
    });
  });

  describe("pending state", () => {
    it("tracks isTransitioning during mutation", async () => {
      server.use(
        http.post("*/claims/claim-1/review", async () => {
          await delay(100);
          return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      expect(result.current.transitionState.isTransitioning).toBe(false);

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.isTransitioning).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.transitionState.isTransitioning).toBe(false);
      });
    });

    it("prevents double submission while transitioning", async () => {
      let callCount = 0;

      server.use(
        http.post("*/claims/claim-1/review", async () => {
          callCount++;
          await delay(100);
          return HttpResponse.json({ id: "claim-1", status: "IN_REVIEW" });
        })
      );

      const claim = createMockClaim({ status: "DRAFT" });
      const { result } = renderHook(() => useTransitions(claim), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.transitionHandlers.handleTransition("IN_REVIEW");
      });

      // First confirm
      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.isTransitioning).toBe(true);
      });

      // Try to confirm again while transitioning
      act(() => {
        result.current.transitionHandlers.handleConfirmModalConfirm();
      });

      await waitFor(() => {
        expect(result.current.transitionState.isTransitioning).toBe(false);
      });

      expect(callCount).toBe(1);
    });
  });
});

// =============================================================================
// useEditClaimForm
// =============================================================================

describe("useEditClaimForm", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form initialization", () => {
    it("initializes form with claim data", () => {
      const claim = createMockClaim({ description: "Initial description" });
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("starts without form error", () => {
      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.formError).toBeNull();
    });

    it("starts not dirty", () => {
      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("form submission", () => {
    it("only sends changed fields", async () => {
      let requestBody: unknown;

      server.use(
        http.patch("*/claims/claim-1", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ id: "claim-1", status: "DRAFT" });
        })
      );

      const claim = createMockClaim({ description: "Original description" });
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Updated description", // only this changed
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({ description: "Updated description" });
      });
    });

    it("calls onSuccess callback on successful submission", async () => {
      server.use(
        http.patch("*/claims/claim-1", () => {
          return HttpResponse.json({ id: "claim-1", status: "DRAFT" });
        })
      );

      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Changed description",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("calls onSuccess when no changes detected", async () => {
      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      // Submit with same values (no changes)
      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Test claim description",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("sets formError on submission failure", async () => {
      server.use(
        http.patch("*/claims/claim-1", () => {
          return HttpResponse.json(
            { message: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Changed description",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("clears formError on new submission", async () => {
      server.use(
        http.patch("*/claims/claim-1", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      // First submission fails
      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Changed",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      expect(result.current.formError).not.toBeNull();

      // Setup success response
      server.use(
        http.patch("*/claims/claim-1", () => {
          return HttpResponse.json({ id: "claim-1", status: "DRAFT" });
        })
      );

      // Second submission clears error before starting
      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Changed again",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).toBeNull();
      });
    });

    it("allows clearing formError manually", async () => {
      server.use(
        http.patch("*/claims/claim-1", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Changed",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      expect(result.current.formError).not.toBeNull();

      act(() => {
        result.current.clearFormError();
      });

      expect(result.current.formError).toBeNull();
    });
  });

  describe("busy state", () => {
    it("tracks isBusy during submission", async () => {
      server.use(
        http.patch("*/claims/claim-1", async () => {
          await delay(100);
          return HttpResponse.json({ id: "claim-1", status: "DRAFT" });
        })
      );

      const claim = createMockClaim();
      const { result } = renderHook(
        () => useEditClaimForm(claim, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          policyId: "policy-1",
          careType: "AMBULATORY",
          diagnosis: "Test diagnosis",
          description: "Changed",
          incidentDate: "2024-01-15",
          submittedDate: null,
          settlementDate: null,
          amountSubmitted: "1000.00",
          amountApproved: null,
          amountDenied: null,
          amountUnprocessed: null,
          deductibleApplied: null,
          copayApplied: null,
          settlementNumber: null,
          settlementNotes: null,
        });
      });

      await waitFor(() => {
        expect(result.current.isBusy).toBe(true);
      });

      await submitPromise;

      await waitFor(() => {
        expect(result.current.isBusy).toBe(false);
      });
    });
  });
});

// =============================================================================
// usePolicyLookup
// =============================================================================

describe("usePolicyLookup", () => {
  it("returns empty options when no client ID", () => {
    const { result } = renderHook(() => usePolicyLookup(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches and formats policy options", async () => {
    server.use(
      http.get("*/claims/lookups/policies", () => {
        return HttpResponse.json({
          data: [
            { id: "policy-1", policyNumber: "POL-001", name: "Policy 1" },
            { id: "policy-2", policyNumber: "POL-002", name: "Policy 2" },
          ],
        });
      })
    );

    const { result } = renderHook(() => usePolicyLookup("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.options).toHaveLength(2);
    });

    expect(result.current.options).toEqual([
      { value: "policy-1", label: "POL-001" },
      { value: "policy-2", label: "POL-002" },
    ]);
  });

  it("tracks loading state", async () => {
    server.use(
      http.get("*/claims/lookups/policies", async () => {
        await delay(100);
        return HttpResponse.json({ data: [] });
      })
    );

    const { result } = renderHook(() => usePolicyLookup("client-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("tracks fetching state", async () => {
    server.use(
      http.get("*/claims/lookups/policies", async () => {
        await delay(50);
        return HttpResponse.json({ data: [] });
      })
    );

    const { result } = renderHook(() => usePolicyLookup("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });
  });

  it("returns empty options when API returns no data", async () => {
    server.use(
      http.get("*/claims/lookups/policies", () => {
        return HttpResponse.json({ data: [] });
      })
    );

    const { result } = renderHook(() => usePolicyLookup("client-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
  });
});
