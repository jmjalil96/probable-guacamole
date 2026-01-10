import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { Insurer } from "shared";
import {
  useModalState,
  useInsurerForm,
  useInsurerCreateForm,
} from "../hooks";

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockInsurer = (overrides: Partial<Insurer> = {}): Insurer => ({
  id: "insurer-1",
  name: "Test Insurance Co",
  code: "TIC-001",
  email: "contact@test.com",
  phone: "+1234567890",
  website: "https://test.com",
  type: "COMPANIA_DE_SEGUROS",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
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
// useInsurerForm (Edit)
// =============================================================================

describe("useInsurerForm", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form initialization", () => {
    it("initializes form with insurer data", () => {
      const insurer = createMockInsurer({ name: "Initial Name" });
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("starts without form error", () => {
      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.formError).toBeNull();
    });

    it("starts not dirty", () => {
      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("form submission", () => {
    it("only sends changed fields", async () => {
      let requestBody: unknown;

      server.use(
        http.patch("*/insurers/insurer-1", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(createMockInsurer());
        })
      );

      const insurer = createMockInsurer({ name: "Original Name" });
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "Updated Name", // only this changed
          code: "TIC-001",
          email: "contact@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({ name: "Updated Name" });
      });
    });

    it("calls onSuccess callback on successful submission", async () => {
      server.use(
        http.patch("*/insurers/insurer-1", () => {
          return HttpResponse.json(createMockInsurer());
        })
      );

      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "Changed Name",
          code: "TIC-001",
          email: "contact@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("calls onSuccess when no changes detected", async () => {
      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      // Submit with same values (no changes)
      await act(async () => {
        await result.current.onSubmit({
          name: "Test Insurance Co",
          code: "TIC-001",
          email: "contact@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("sends multiple changed fields", async () => {
      let requestBody: unknown;

      server.use(
        http.patch("*/insurers/insurer-1", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(createMockInsurer());
        })
      );

      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "New Name",
          code: "NEW-001",
          email: "new@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "MEDICINA_PREPAGADA",
          isActive: false,
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          name: "New Name",
          code: "NEW-001",
          email: "new@test.com",
          type: "MEDICINA_PREPAGADA",
          isActive: false,
        });
      });
    });
  });

  describe("error handling", () => {
    it("sets formError on submission failure", async () => {
      server.use(
        http.patch("*/insurers/insurer-1", () => {
          return HttpResponse.json(
            { message: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "Changed Name",
          code: "TIC-001",
          email: "contact@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("allows clearing formError manually", async () => {
      server.use(
        http.patch("*/insurers/insurer-1", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "Changed",
          code: "TIC-001",
          email: "contact@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
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
        http.patch("*/insurers/insurer-1", async () => {
          await delay(100);
          return HttpResponse.json(createMockInsurer());
        })
      );

      const insurer = createMockInsurer();
      const { result } = renderHook(
        () => useInsurerForm(insurer, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          name: "Changed",
          code: "TIC-001",
          email: "contact@test.com",
          phone: "+1234567890",
          website: "https://test.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
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
// useInsurerCreateForm
// =============================================================================

describe("useInsurerCreateForm", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form initialization", () => {
    it("initializes form with default values", () => {
      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("starts without form error", () => {
      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.formError).toBeNull();
    });

    it("starts not dirty", () => {
      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("form submission", () => {
    it("sends POST request with insurer data", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/insurers", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ id: "new-insurer-id" });
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "New Insurance Co",
          code: "NEW-001",
          email: "new@test.com",
          phone: "+1111111111",
          website: "https://new.com",
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          name: "New Insurance Co",
          code: "NEW-001",
          email: "new@test.com",
          phone: "+1111111111",
          website: "https://new.com",
          type: "COMPANIA_DE_SEGUROS",
        });
      });
    });

    it("calls onSuccess with new id on successful submission", async () => {
      server.use(
        http.post("*/insurers", () => {
          return HttpResponse.json({ id: "created-insurer-id" });
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "New Insurance Co",
          code: null,
          email: null,
          phone: null,
          website: null,
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith("created-insurer-id");
      });
    });

    it("omits optional fields that are null or empty", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/insurers", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ id: "new-insurer-id" });
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "Minimal Insurance",
          code: null,
          email: null,
          phone: null,
          website: null,
          type: "MEDICINA_PREPAGADA",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({
          name: "Minimal Insurance",
          type: "MEDICINA_PREPAGADA",
        });
      });
    });
  });

  describe("error handling", () => {
    it("sets formError on submission failure", async () => {
      server.use(
        http.post("*/insurers", () => {
          return HttpResponse.json(
            { message: "Name is required" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "",
          code: null,
          email: null,
          phone: null,
          website: null,
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("handles uniqueness conflict error", async () => {
      server.use(
        http.post("*/insurers", () => {
          return HttpResponse.json(
            {
              error: {
                code: "CONFLICT",
                message: "An insurer with this name already exists",
              },
            },
            { status: 409 }
          );
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "Existing Name",
          code: null,
          email: null,
          phone: null,
          website: null,
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });
    });

    it("allows clearing formError manually", async () => {
      server.use(
        http.post("*/insurers", () => {
          return HttpResponse.json({ message: "Failed" }, { status: 400 });
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          name: "",
          code: null,
          email: null,
          phone: null,
          website: null,
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
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
        http.post("*/insurers", async () => {
          await delay(100);
          return HttpResponse.json({ id: "new-insurer-id" });
        })
      );

      const { result } = renderHook(
        () => useInsurerCreateForm(true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          name: "New Insurance",
          code: null,
          email: null,
          phone: null,
          website: null,
          type: "COMPANIA_DE_SEGUROS",
          isActive: true,
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
