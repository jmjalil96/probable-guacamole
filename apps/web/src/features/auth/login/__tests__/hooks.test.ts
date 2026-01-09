import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import { useLoginForm } from "../hooks";
import { mockAuthenticatedUser } from "@/test/mocks/data/users";

// Mock router for login navigation
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouter: () => ({
      navigate: mockNavigate,
      invalidate: vi.fn(),
    }),
  };
});

const mockUser = mockAuthenticatedUser;

describe("useLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Form Interface
  // ===========================================================================

  describe("form interface", () => {
    it("provides register function for form fields", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.register).toBe("function");
    });

    it("provides handleSubmit function", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.handleSubmit).toBe("function");
    });

    it("provides errors object", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.errors).toBeDefined();
    });

    it("provides onSubmit handler", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.onSubmit).toBe("function");
    });
  });

  // ===========================================================================
  // Form Submission
  // ===========================================================================

  describe("form submission", () => {
    it("submits credentials to login endpoint", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/auth/login", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      expect(requestBody).toEqual({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("navigates to dashboard on successful login", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
      });
    });

    it("sets isPending during submission", async () => {
      server.use(
        http.post("*/auth/login", async () => {
          await delay(100);
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      // Not pending initially
      expect(result.current.isPending).toBe(false);

      // Start submission
      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "password123",
        });
      });

      // Should be pending during submission
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Should not be pending after completion
      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe("error handling", () => {
    it("provides error message for invalid credentials (401)", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(
            { message: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "wrongpassword",
        });
      });

      await waitFor(() => {
        expect(result.current.errorMessage).not.toBeNull();
      });

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("returns null errorMessage when no error", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      expect(result.current.errorMessage).toBeNull();
    });

    it("provides error message for server errors (500)", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(
            { message: "Internal server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.errorMessage).not.toBeNull();
      });
    });

    it("provides error message for network errors", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.errorMessage).not.toBeNull();
      });
    });
  });

  // ===========================================================================
  // Form State
  // ===========================================================================

  describe("form state", () => {
    it("resets error state on new submission attempt", async () => {
      // First submission fails
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(
            { message: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useLoginForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "wrongpassword",
        });
      });

      await waitFor(() => {
        expect(result.current.errorMessage).not.toBeNull();
      });

      // Setup success response for second attempt
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(mockUser);
        })
      );

      // Second submission succeeds
      act(() => {
        result.current.onSubmit({
          email: "test@example.com",
          password: "correctpassword",
        });
      });

      await waitFor(() => {
        expect(result.current.errorMessage).toBeNull();
      });
    });
  });
});
