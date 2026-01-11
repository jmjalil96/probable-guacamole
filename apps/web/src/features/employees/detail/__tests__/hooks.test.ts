import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import type { Employee } from "shared";
import {
  useModalState,
  useEmployeeForm,
  useEmployeeDetail,
} from "../hooks";

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

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

// =============================================================================
// Test Fixtures
// =============================================================================

const mockEmployee: Employee = {
  id: "employee-1",
  firstName: "Juan",
  lastName: "Martinez",
  email: "juan.martinez@company.com",
  phone: "+573001234567",
  department: "Human Resources",
  isActive: true,
  hasAccount: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

// =============================================================================
// useModalState
// =============================================================================

describe("useModalState", () => {
  it("starts with editModal closed", () => {
    const { result } = renderHook(() => useModalState());
    expect(result.current.editModal.open).toBe(false);
  });

  it("editModal.onOpen opens modal", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.editModal.onOpen();
    });

    expect(result.current.editModal.open).toBe(true);
  });

  it("editModal.onClose closes modal", () => {
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
// useEmployeeForm
// =============================================================================

describe("useEmployeeForm", () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("form initialization", () => {
    it("initializes with employee data", () => {
      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.control).toBeDefined();
      expect(result.current.handleSubmit).toBeDefined();
    });

    it("starts without form error", () => {
      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.formError).toBeNull();
    });

    it("starts not dirty", () => {
      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isDirty).toBe(false);
    });

    it("starts not busy", () => {
      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);
    });
  });

  describe("form submission", () => {
    it("only sends changed fields", async () => {
      let requestBody: unknown;

      server.use(
        http.patch("*/employees/employee-1", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mockEmployee);
        })
      );

      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          firstName: "Updated", // Changed
          lastName: mockEmployee.lastName,
          email: mockEmployee.email,
          phone: mockEmployee.phone,
          department: mockEmployee.department,
          isActive: mockEmployee.isActive,
        });
      });

      await waitFor(() => {
        expect(requestBody).toEqual({ firstName: "Updated" });
      });
    });

    it("shows toast for no changes", async () => {
      const { toast } = await import("@/lib/utils");

      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          firstName: mockEmployee.firstName,
          lastName: mockEmployee.lastName,
          email: mockEmployee.email,
          phone: mockEmployee.phone,
          department: mockEmployee.department,
          isActive: mockEmployee.isActive,
        });
      });

      expect(toast.info).toHaveBeenCalledWith("Sin cambios", expect.any(Object));
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("calls onSuccess on success", async () => {
      server.use(
        http.patch("*/employees/employee-1", () => {
          return HttpResponse.json(mockEmployee);
        })
      );

      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          firstName: "Updated",
          lastName: mockEmployee.lastName,
          email: mockEmployee.email,
          phone: mockEmployee.phone,
          department: mockEmployee.department,
          isActive: mockEmployee.isActive,
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("sets formError on failure", async () => {
      server.use(
        http.patch("*/employees/employee-1", () => {
          return HttpResponse.json(
            { message: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.onSubmit({
          firstName: "Updated",
          lastName: mockEmployee.lastName,
          email: mockEmployee.email,
          phone: mockEmployee.phone,
          department: mockEmployee.department,
          isActive: mockEmployee.isActive,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("busy state", () => {
    it("tracks isBusy during submission", async () => {
      server.use(
        http.patch("*/employees/employee-1", async () => {
          await delay(100);
          return HttpResponse.json(mockEmployee);
        })
      );

      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      expect(result.current.isBusy).toBe(false);

      const submitPromise = act(async () => {
        await result.current.onSubmit({
          firstName: "Updated",
          lastName: mockEmployee.lastName,
          email: mockEmployee.email,
          phone: mockEmployee.phone,
          department: mockEmployee.department,
          isActive: mockEmployee.isActive,
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

  describe("clearFormError", () => {
    it("clears formError when called", async () => {
      server.use(
        http.patch("*/employees/employee-1", () => {
          return HttpResponse.json(
            { message: "Validation failed" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(
        () => useEmployeeForm(mockEmployee, true, mockOnSuccess),
        { wrapper: createWrapper() }
      );

      // Create an error
      await act(async () => {
        await result.current.onSubmit({
          firstName: "Updated",
          lastName: mockEmployee.lastName,
          email: mockEmployee.email,
          phone: mockEmployee.phone,
          department: mockEmployee.department,
          isActive: mockEmployee.isActive,
        });
      });

      await waitFor(() => {
        expect(result.current.formError).not.toBeNull();
      });

      // Clear the error
      act(() => {
        result.current.clearFormError();
      });

      expect(result.current.formError).toBeNull();
    });
  });
});

// =============================================================================
// useEmployeeDetail
// =============================================================================

describe("useEmployeeDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches employee data", async () => {
    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployee);
      })
    );

    const { result } = renderHook(() => useEmployeeDetail("employee-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.employee).toEqual(mockEmployee);
  });

  it("provides modal state", async () => {
    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployee);
      })
    );

    const { result } = renderHook(() => useEmployeeDetail("employee-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.modalState.editModal.open).toBe(false);
    expect(result.current.modalState.editModal.onOpen).toBeDefined();
    expect(result.current.modalState.editModal.onClose).toBeDefined();
  });

  it("navigateBack navigates to /users", async () => {
    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json(mockEmployee);
      })
    );

    const { result } = renderHook(() => useEmployeeDetail("employee-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.navigateBack();

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/users" });
  });

  it("returns isError on failure", async () => {
    server.use(
      http.get("*/employees/employee-1", () => {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      })
    );

    const { result } = renderHook(() => useEmployeeDetail("employee-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.employee).toBeUndefined();
    expect(result.current.error).toBeDefined();
  });
});
