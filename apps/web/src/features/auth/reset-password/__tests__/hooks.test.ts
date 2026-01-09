import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import { useResetPassword } from "../hooks";

// Mock router hooks
const mockToken = vi.fn(() => "valid-token" as string | undefined);

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useSearch: () => ({ token: mockToken() }),
  };
});

describe("useResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("valid-token");
  });

  // ===========================================================================
  // State Transitions
  // ===========================================================================

  describe("state transitions", () => {
    it("starts in loading state while validating token", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", async () => {
          await delay(100);
          return HttpResponse.json({ valid: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.state).toBe("loading");

      // Wait for validation to complete
      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });
    });

    it("transitions to form state when token is valid", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true, email: "test@example.com" });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });
    });

    it("transitions to token-error state when token is invalid", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json(
            { message: "Token expired or invalid" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("token-error");
      });
    });

    it("shows no-token state when token is missing", async () => {
      mockToken.mockReturnValue(undefined);

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      // When no token, should show no-token state (not loading)
      await waitFor(() => {
        expect(result.current.state).toBe("no-token");
      });
    });

    it("transitions to success state after password reset", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        }),
        http.post("*/auth/password-reset/confirm", () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      // Wait for form state
      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      // Submit password reset
      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await waitFor(() => {
        expect(result.current.state).toBe("success");
      });
    });
  });

  // ===========================================================================
  // Form Submission
  // ===========================================================================

  describe("form submission", () => {
    it("sends correct payload to confirm endpoint", async () => {
      let requestBody: unknown;

      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        }),
        http.post("*/auth/password-reset/confirm", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await waitFor(() => {
        expect(result.current.state).toBe("success");
      });

      expect(requestBody).toEqual({
        token: "valid-token",
        password: "newpassword123",
      });
    });

    it("does not submit when token is missing", async () => {
      mockToken.mockReturnValue(undefined);
      let submitCalled = false;

      server.use(
        http.post("*/auth/password-reset/confirm", () => {
          submitCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      // Wait a bit to ensure no request was made
      await new Promise((r) => setTimeout(r, 100));

      expect(submitCalled).toBe(false);
    });

    it("sets isPending during submission", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        }),
        http.post("*/auth/password-reset/confirm", async () => {
          await delay(100);
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      // Should not be pending initially
      expect(result.current.isPending).toBe(false);

      // Start submission
      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
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
    it("provides error message when reset fails", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        }),
        http.post("*/auth/password-reset/confirm", () => {
          return HttpResponse.json(
            { message: "Token expired" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await waitFor(() => {
        expect(result.current.errorMessage).not.toBeNull();
      });

      // Should still be in form state (not success) on error
      expect(result.current.state).toBe("form");
    });

    it("returns null errorMessage when no error", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });

  // ===========================================================================
  // Form Interface
  // ===========================================================================

  describe("form interface", () => {
    it("provides register function for form fields", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(typeof result.current.register).toBe("function");
    });

    it("provides handleSubmit function", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(typeof result.current.handleSubmit).toBe("function");
    });

    it("provides errors object", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(result.current.errors).toBeDefined();
    });
  });
});
