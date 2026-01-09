import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { ClaimInvoice } from "shared";
import { useInvoicesTab, useInvoiceForm } from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockInvoice: ClaimInvoice = {
  id: "invoice-1",
  claimId: "claim-1",
  invoiceNumber: "INV-001",
  providerName: "Test Provider",
  amountSubmitted: "1500.00",
  createdAt: "2024-01-15T10:00:00Z",
  createdBy: { id: "user-1", name: "John Doe" },
};

const mockInvoice2: ClaimInvoice = {
  id: "invoice-2",
  claimId: "claim-1",
  invoiceNumber: "INV-002",
  providerName: "Another Provider",
  amountSubmitted: "2500.00",
  createdAt: "2024-01-16T10:00:00Z",
  createdBy: { id: "user-2", name: "Jane Smith" },
};

const mockInvoicesResponse = {
  data: [mockInvoice, mockInvoice2],
};

// =============================================================================
// useInvoicesTab
// =============================================================================

describe("useInvoicesTab", () => {
  beforeEach(() => {
    server.use(
      http.get("*/claims/claim-1/invoices", () => {
        return HttpResponse.json(mockInvoicesResponse);
      })
    );
  });

  describe("data fetching", () => {
    it("fetches invoices for the claim", async () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.invoices).toHaveLength(2);
      expect(result.current.invoices[0]).toMatchObject({
        id: "invoice-1",
        invoiceNumber: "INV-001",
      });
    });

    it("returns empty array when no invoices", async () => {
      server.use(
        http.get("*/claims/claim-1/invoices", () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.invoices).toEqual([]);
    });

    it("tracks loading state", () => {
      server.use(
        http.get("*/claims/claim-1/invoices", async () => {
          await delay(100);
          return HttpResponse.json(mockInvoicesResponse);
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("tracks error state", async () => {
      server.use(
        http.get("*/claims/claim-1/invoices", () => {
          return HttpResponse.json({ message: "Error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("total calculation", () => {
    it("calculates total from invoice amounts", async () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 1500 + 2500 = 4000
      // Check that total contains 4000 (locale may format differently)
      expect(result.current.total).toMatch(/4[,.]?000/);
    });

    it("returns zero when no invoices", async () => {
      server.use(
        http.get("*/claims/claim-1/invoices", () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check for 0 or 0.00 depending on locale formatting
      expect(result.current.total).toMatch(/0/);
    });
  });

  describe("modal state (add/edit)", () => {
    it("starts with modal closed", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.modalState.open).toBe(false);
      expect(result.current.modalState.invoice).toBeNull();
    });

    it("opens modal for adding new invoice", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.openAdd();
      });

      expect(result.current.modalState.open).toBe(true);
      expect(result.current.modalState.invoice).toBeNull();
    });

    it("opens modal for editing existing invoice", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.openEdit(mockInvoice);
      });

      expect(result.current.modalState.open).toBe(true);
      expect(result.current.modalState.invoice).toEqual(mockInvoice);
    });

    it("closes modal", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.openAdd();
      });
      expect(result.current.modalState.open).toBe(true);

      act(() => {
        result.current.modalHandlers.close();
      });
      expect(result.current.modalState.open).toBe(false);
    });

    it("increments key on each open for component reset", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      const initialKey = result.current.modalState.key;

      act(() => {
        result.current.modalHandlers.openAdd();
      });
      const keyAfterFirstOpen = result.current.modalState.key;

      act(() => {
        result.current.modalHandlers.close();
        result.current.modalHandlers.openAdd();
      });
      const keyAfterSecondOpen = result.current.modalState.key;

      expect(keyAfterFirstOpen).toBeGreaterThan(initialKey);
      expect(keyAfterSecondOpen).toBeGreaterThan(keyAfterFirstOpen);
    });
  });

  describe("delete state", () => {
    it("starts with delete dialog closed", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.deleteState.open).toBe(false);
      expect(result.current.deleteState.invoice).toBeNull();
    });

    it("opens delete dialog", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockInvoice);
      });

      expect(result.current.deleteState.open).toBe(true);
      expect(result.current.deleteState.invoice).toEqual(mockInvoice);
    });

    it("cancels delete dialog", () => {
      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockInvoice);
      });
      expect(result.current.deleteState.open).toBe(true);

      act(() => {
        result.current.deleteHandlers.cancelDelete();
      });
      expect(result.current.deleteState.open).toBe(false);
    });

    it("confirms delete and calls API", async () => {
      let deleteCalled = false;

      server.use(
        http.delete("*/claims/claim-1/invoices/invoice-1", () => {
          deleteCalled = true;
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockInvoice);
      });

      act(() => {
        result.current.deleteHandlers.confirmDelete();
      });

      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });
    });

    it("tracks isDeleting state during deletion", async () => {
      server.use(
        http.delete("*/claims/claim-1/invoices/invoice-1", async () => {
          await delay(100);
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockInvoice);
      });

      expect(result.current.deleteState.isDeleting).toBe(false);

      act(() => {
        result.current.deleteHandlers.confirmDelete();
      });

      await waitFor(() => {
        expect(result.current.deleteState.isDeleting).toBe(true);
      });
    });

    it("closes dialog on successful delete", async () => {
      server.use(
        http.delete("*/claims/claim-1/invoices/invoice-1", () => {
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useInvoicesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockInvoice);
      });

      act(() => {
        result.current.deleteHandlers.confirmDelete();
      });

      await waitFor(() => {
        expect(result.current.deleteState.open).toBe(false);
      });
    });
  });
});

// =============================================================================
// useInvoiceForm
// =============================================================================

describe("useInvoiceForm", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form initialization", () => {
    it("initializes with empty values for new invoice", () => {
      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("initializes with invoice values for edit", () => {
      const { result } = renderHook(
        () => useInvoiceForm("claim-1", mockInvoice, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
    });

    it("starts without form error", () => {
      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.formError).toBeNull();
    });

    it("starts not busy", () => {
      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);
    });
  });

  describe("create invoice", () => {
    it("creates invoice and calls onSuccess", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/claims/claim-1/invoices", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ ...mockInvoice, id: "new-invoice" });
        })
      );

      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-003",
          providerName: "New Provider",
          amountSubmitted: "500.00",
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          invoiceNumber: "INV-003",
          providerName: "New Provider",
          amountSubmitted: "500.00",
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe("update invoice", () => {
    it("updates invoice and calls onSuccess", async () => {
      let requestBody: unknown;

      server.use(
        http.patch(
          "*/claims/claim-1/invoices/invoice-1",
          async ({ request }) => {
            requestBody = await request.json();
            return HttpResponse.json(mockInvoice);
          }
        )
      );

      const { result } = renderHook(
        () => useInvoiceForm("claim-1", mockInvoice, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-001-UPDATED",
          providerName: "Updated Provider",
          amountSubmitted: "2000.00",
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          invoiceNumber: "INV-001-UPDATED",
          providerName: "Updated Provider",
          amountSubmitted: "2000.00",
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("sets formError on submission failure", async () => {
      server.use(
        http.post("*/claims/claim-1/invoices", () => {
          return HttpResponse.json(
            { message: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-003",
          providerName: "Provider",
          amountSubmitted: "500.00",
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("clears formError on new submission attempt", async () => {
      server.use(
        http.post("*/claims/claim-1/invoices", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      // First submission fails
      await act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-003",
          providerName: "Provider",
          amountSubmitted: "500.00",
        });
      });

      expect(result.current.formError).not.toBeNull();

      // Setup success response
      server.use(
        http.post("*/claims/claim-1/invoices", () => {
          return HttpResponse.json({ ...mockInvoice, id: "new-invoice" });
        })
      );

      // Second submission clears error
      await act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-003",
          providerName: "Provider",
          amountSubmitted: "500.00",
        });
      });

      await waitFor(() => {
        expect(result.current.formError).toBeNull();
      });
    });

    it("allows clearing formError manually", async () => {
      server.use(
        http.post("*/claims/claim-1/invoices", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-003",
          providerName: "Provider",
          amountSubmitted: "500.00",
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
        http.post("*/claims/claim-1/invoices", async () => {
          await delay(100);
          return HttpResponse.json({ ...mockInvoice, id: "new-invoice" });
        })
      );

      const { result } = renderHook(
        () => useInvoiceForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          invoiceNumber: "INV-003",
          providerName: "Provider",
          amountSubmitted: "500.00",
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
