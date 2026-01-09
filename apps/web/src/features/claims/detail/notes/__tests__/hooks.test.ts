import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { Note } from "shared";
import { useNotesTab, useNoteForm } from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const mockNote: Note = {
  id: "note-1",
  entityType: "Claim",
  entityId: "claim-1",
  content: "This is a test note",
  isInternal: false,
  isEdited: false,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  createdBy: { id: "user-1", name: "John Doe" },
  updatedBy: null,
};

const mockNote2: Note = {
  id: "note-2",
  entityType: "Claim",
  entityId: "claim-1",
  content: "Another note",
  isInternal: true,
  isEdited: false,
  createdAt: "2024-01-16T10:00:00Z",
  updatedAt: "2024-01-16T10:00:00Z",
  createdBy: { id: "user-2", name: "Jane Smith" },
  updatedBy: null,
};

const mockNotesResponse = {
  data: [mockNote, mockNote2],
  pagination: { total: 2, page: 1, limit: 50, totalPages: 1 },
};

// =============================================================================
// useNotesTab
// =============================================================================

describe("useNotesTab", () => {
  beforeEach(() => {
    server.use(
      http.get("*/claims/claim-1/notes", () => {
        return HttpResponse.json(mockNotesResponse);
      })
    );
  });

  describe("data fetching", () => {
    it("fetches notes for the claim", async () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes[0]).toMatchObject({
        id: "note-1",
        content: "This is a test note",
      });
    });

    it("returns count from pagination", async () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(2);
    });

    it("returns empty array when no notes", async () => {
      server.use(
        http.get("*/claims/claim-1/notes", () => {
          return HttpResponse.json({
            data: [],
            pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
          });
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notes).toEqual([]);
      expect(result.current.count).toBe(0);
    });

    it("tracks loading state", () => {
      server.use(
        http.get("*/claims/claim-1/notes", async () => {
          await delay(100);
          return HttpResponse.json(mockNotesResponse);
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("tracks error state", async () => {
      server.use(
        http.get("*/claims/claim-1/notes", () => {
          return HttpResponse.json({ message: "Error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("modal state (edit)", () => {
    it("starts with modal closed", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.modalState.open).toBe(false);
      expect(result.current.modalState.note).toBeNull();
    });

    it("opens modal for editing note", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.openEdit(mockNote);
      });

      expect(result.current.modalState.open).toBe(true);
      expect(result.current.modalState.note).toEqual(mockNote);
    });

    it("closes modal", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.modalHandlers.openEdit(mockNote);
      });
      expect(result.current.modalState.open).toBe(true);

      act(() => {
        result.current.modalHandlers.close();
      });
      expect(result.current.modalState.open).toBe(false);
    });

    it("increments key on each open for component reset", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      const initialKey = result.current.modalState.key;

      act(() => {
        result.current.modalHandlers.openEdit(mockNote);
      });
      const keyAfterFirstOpen = result.current.modalState.key;

      act(() => {
        result.current.modalHandlers.close();
        result.current.modalHandlers.openEdit(mockNote);
      });
      const keyAfterSecondOpen = result.current.modalState.key;

      expect(keyAfterFirstOpen).toBeGreaterThan(initialKey);
      expect(keyAfterSecondOpen).toBeGreaterThan(keyAfterFirstOpen);
    });
  });

  describe("delete state", () => {
    it("starts with delete dialog closed", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.deleteState.open).toBe(false);
      expect(result.current.deleteState.note).toBeNull();
    });

    it("opens delete dialog", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockNote);
      });

      expect(result.current.deleteState.open).toBe(true);
      expect(result.current.deleteState.note).toEqual(mockNote);
    });

    it("cancels delete dialog", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockNote);
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
        http.delete("*/claims/claim-1/notes/note-1", () => {
          deleteCalled = true;
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockNote);
      });

      act(() => {
        result.current.deleteHandlers.confirmDelete();
      });

      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });
    });

    it("closes dialog on successful delete", async () => {
      server.use(
        http.delete("*/claims/claim-1/notes/note-1", () => {
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteHandlers.openDelete(mockNote);
      });

      act(() => {
        result.current.deleteHandlers.confirmDelete();
      });

      await waitFor(() => {
        expect(result.current.deleteState.open).toBe(false);
      });
    });
  });

  describe("composer", () => {
    it("starts with empty content", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.composer.content).toBe("");
    });

    it("tracks content changes", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("New note content");
      });

      expect(result.current.composer.content).toBe("New note content");
    });

    it("cannot submit when content is empty", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.composer.canSubmit).toBe(false);
    });

    it("cannot submit when content is whitespace only", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("   ");
      });

      expect(result.current.composer.canSubmit).toBe(false);
    });

    it("can submit when content has text", () => {
      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("Valid content");
      });

      expect(result.current.composer.canSubmit).toBe(true);
    });

    it("submits note and clears content", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/claims/claim-1/notes", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mockNote);
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("New note text");
      });

      await act(async () => {
        await result.current.composer.submit();
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          content: "New note text",
          isInternal: false,
        });
      });

      expect(result.current.composer.content).toBe("");
    });

    it("tracks isSubmitting during submission", async () => {
      server.use(
        http.post("*/claims/claim-1/notes", async () => {
          await delay(100);
          return HttpResponse.json(mockNote);
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("New note");
      });

      expect(result.current.composer.isSubmitting).toBe(false);

      const submitPromise = act(async () => {
        await result.current.composer.submit();
      });

      await waitFor(() => {
        expect(result.current.composer.isSubmitting).toBe(true);
      });

      await submitPromise;

      await waitFor(() => {
        expect(result.current.composer.isSubmitting).toBe(false);
      });
    });

    it("sets error on submission failure", async () => {
      server.use(
        http.post("*/claims/claim-1/notes", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("New note");
      });

      await act(async () => {
        await result.current.composer.submit();
      });

      await waitFor(() => {
        expect(result.current.composer.error).not.toBeNull();
      });
    });

    it("allows clearing error", async () => {
      server.use(
        http.post("*/claims/claim-1/notes", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useNotesTab("claim-1"), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.composer.setContent("New note");
      });

      await act(async () => {
        await result.current.composer.submit();
      });

      await waitFor(() => {
        expect(result.current.composer.error).not.toBeNull();
      });

      act(() => {
        result.current.composer.clearError();
      });

      expect(result.current.composer.error).toBeNull();
    });
  });
});

// =============================================================================
// useNoteForm
// =============================================================================

describe("useNoteForm", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form initialization", () => {
    it("initializes with empty values when no note", () => {
      const { result } = renderHook(
        () => useNoteForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("starts without form error", () => {
      const { result } = renderHook(
        () => useNoteForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.formError).toBeNull();
    });

    it("starts not busy", () => {
      const { result } = renderHook(
        () => useNoteForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);
    });
  });

  describe("update note", () => {
    it("updates note and calls onSuccess", async () => {
      let requestBody: unknown;

      server.use(
        http.patch("*/claims/claim-1/notes/note-1", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mockNote);
        })
      );

      const { result } = renderHook(
        () => useNoteForm("claim-1", mockNote, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          content: "Updated note content",
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          content: "Updated note content",
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("does nothing when note is null", async () => {
      let apiCalled = false;

      server.use(
        http.patch("*/claims/claim-1/notes/:id", () => {
          apiCalled = true;
          return HttpResponse.json(mockNote);
        })
      );

      const { result } = renderHook(
        () => useNoteForm("claim-1", null, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          content: "Some content",
        });
      });

      expect(apiCalled).toBe(false);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("sets formError on submission failure", async () => {
      server.use(
        http.patch("*/claims/claim-1/notes/note-1", () => {
          return HttpResponse.json(
            { message: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(
        () => useNoteForm("claim-1", mockNote, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          content: "Updated content",
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("allows clearing formError manually", async () => {
      server.use(
        http.patch("*/claims/claim-1/notes/note-1", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const { result } = renderHook(
        () => useNoteForm("claim-1", mockNote, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          content: "Updated content",
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
        http.patch("*/claims/claim-1/notes/note-1", async () => {
          await delay(100);
          return HttpResponse.json(mockNote);
        })
      );

      const { result } = renderHook(
        () => useNoteForm("claim-1", mockNote, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          content: "Updated content",
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
