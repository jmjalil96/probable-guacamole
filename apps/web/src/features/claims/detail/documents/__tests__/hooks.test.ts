import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { ClaimFile } from "shared";
import { useDocumentsTab, useDocumentUpload } from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockDocument: ClaimFile = {
  id: "file-1",
  claimId: "claim-1",
  fileName: "invoice.pdf",
  contentType: "application/pdf",
  fileSize: 102400,
  category: "invoice",
  status: "UPLOADED",
  createdAt: "2024-01-15T10:00:00Z",
  createdBy: { id: "user-1", name: "John Doe" },
};

const mockDocument2: ClaimFile = {
  id: "file-2",
  claimId: "claim-1",
  fileName: "receipt.jpg",
  contentType: "image/jpeg",
  fileSize: 51200,
  category: "receipt",
  status: "UPLOADED",
  createdAt: "2024-01-16T10:00:00Z",
  createdBy: { id: "user-2", name: "Jane Smith" },
};

const mockDocumentsResponse = {
  data: [mockDocument, mockDocument2],
};

// =============================================================================
// useDocumentsTab
// =============================================================================

describe("useDocumentsTab", () => {
  beforeEach(() => {
    server.use(
      http.get("*/claims/claim-1/files", () => {
        return HttpResponse.json(mockDocumentsResponse);
      })
    );
  });

  describe("data fetching", () => {
    it("fetches documents for the claim", async () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toHaveLength(2);
      expect(result.current.documents[0]).toMatchObject({
        id: "file-1",
        fileName: "invoice.pdf",
      });
    });

    it("returns empty array when no documents", async () => {
      server.use(
        http.get("*/claims/claim-1/files", () => {
          return HttpResponse.json({ data: [] });
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual([]);
    });

    it("tracks loading state", () => {
      server.use(
        http.get("*/claims/claim-1/files", async () => {
          await delay(100);
          return HttpResponse.json(mockDocumentsResponse);
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("tracks error state", async () => {
      server.use(
        http.get("*/claims/claim-1/files", () => {
          return HttpResponse.json({ message: "Error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("modal state (upload)", () => {
    it("starts with modal closed", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.modalState.open).toBe(false);
    });

    it("opens upload modal", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.open();
      });

      expect(result.current.modalState.open).toBe(true);
    });

    it("closes modal", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.open();
      });
      expect(result.current.modalState.open).toBe(true);

      act(() => {
        result.current.modalHandlers.close();
      });
      expect(result.current.modalState.open).toBe(false);
    });

    it("increments key on each open for component reset", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      const initialKey = result.current.modalState.key;

      act(() => {
        result.current.modalHandlers.open();
      });
      const keyAfterFirstOpen = result.current.modalState.key;

      act(() => {
        result.current.modalHandlers.close();
        result.current.modalHandlers.open();
      });
      const keyAfterSecondOpen = result.current.modalState.key;

      expect(keyAfterFirstOpen).toBeGreaterThan(initialKey);
      expect(keyAfterSecondOpen).toBeGreaterThan(keyAfterFirstOpen);
    });
  });

  describe("delete state", () => {
    it("starts with delete dialog closed", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.deleteState.open).toBe(false);
      expect(result.current.deleteState.document).toBeNull();
    });

    it("opens delete dialog", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockDocument);
      });

      expect(result.current.deleteState.open).toBe(true);
      expect(result.current.deleteState.document).toEqual(mockDocument);
    });

    it("cancels delete dialog", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockDocument);
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
        http.delete("*/claims/claim-1/files/file-1", () => {
          deleteCalled = true;
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockDocument);
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
        http.delete("*/claims/claim-1/files/file-1", async () => {
          await delay(100);
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockDocument);
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
        http.delete("*/claims/claim-1/files/file-1", () => {
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockDocument);
      });

      act(() => {
        result.current.deleteHandlers.confirmDelete();
      });

      await waitFor(() => {
        expect(result.current.deleteState.open).toBe(false);
      });
    });
  });

  describe("download functionality", () => {
    it("provides download function", () => {
      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.downloadDocument).toBe("function");
    });

    it("calls download API and opens URL", async () => {
      const mockOpen = vi.fn();
      vi.stubGlobal("open", mockOpen);

      server.use(
        http.get("*/claims/claim-1/files/file-1/download", () => {
          return HttpResponse.json({
            downloadUrl: "https://example.com/download/file-1",
          });
        })
      );

      const { result } = renderHook(() => useDocumentsTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.downloadDocument(mockDocument);
      });

      expect(mockOpen).toHaveBeenCalledWith(
        "https://example.com/download/file-1",
        "_blank"
      );

      vi.unstubAllGlobals();
    });
  });
});

// =============================================================================
// useDocumentUpload
// =============================================================================

describe("useDocumentUpload", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("starts with empty files array", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.files).toEqual([]);
    });

    it("provides file upload functions", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(typeof result.current.addFiles).toBe("function");
      expect(typeof result.current.removeFile).toBe("function");
      expect(typeof result.current.retryFile).toBe("function");
      expect(typeof result.current.clearFiles).toBe("function");
    });

    it("provides file categories", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.categories).toBeDefined();
      expect(Array.isArray(result.current.categories)).toBe(true);
    });

    it("provides category icons", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.categoryIcons).toBeDefined();
    });
  });

  describe("upload state", () => {
    it("starts with isUploading false", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isUploading).toBe(false);
    });

    it("starts with hasErrors false", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.hasErrors).toBe(false);
    });

    it("starts with canAddMore true", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.canAddMore).toBe(true);
    });
  });

  describe("category selection", () => {
    it("starts with no selected category", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.selectedCategory).toBeNull();
    });

    it("allows setting category", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.setSelectedCategory("invoice");
      });

      expect(result.current.selectedCategory).toBe("invoice");
    });
  });

  describe("max files configuration", () => {
    it("uses default max files of 20", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({ claimId: "claim-1", onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      expect(result.current.maxFiles).toBe(20);
    });

    it("accepts custom max files", () => {
      const { result } = renderHook(
        () =>
          useDocumentUpload({
            claimId: "claim-1",
            onSuccess: mockOnSuccess,
            maxFiles: 5,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.maxFiles).toBe(5);
    });
  });
});
