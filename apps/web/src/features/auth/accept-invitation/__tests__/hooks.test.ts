import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper } from "@/test/render";
import { useAcceptInvitationForm } from "../hooks";

// Mock router hooks
const mockToken = vi.fn(() => "valid-token" as string | undefined);
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useSearch: () => ({ token: mockToken() }),
    useRouter: () => ({
      navigate: mockNavigate,
      invalidate: vi.fn(),
    }),
  };
});

const mockInvitation = {
  email: "invited@example.com",
  role: { id: "role-1", displayName: "Agent" },
};

describe("useAcceptInvitationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken.mockReturnValue("valid-token");
  });

  // ===========================================================================
  // State Transitions
  // ===========================================================================

  describe("state transitions", () => {
    it("starts in loading state while validating invitation", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", async () => {
          await delay(100);
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.state).toBe("loading");

      // Wait for validation to complete
      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });
    });

    it("transitions to form state when invitation is valid", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });
    });

    it("transitions to token-error state when invitation is invalid", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(
            { message: "Invitation expired or invalid" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("token-error");
      });
    });

    it("shows no-token state when token is missing", async () => {
      mockToken.mockReturnValue(undefined);

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("no-token");
      });
    });
  });

  // ===========================================================================
  // Role Name Extraction
  // ===========================================================================

  describe("role name extraction", () => {
    it("extracts roleName from invitation response", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(result.current.roleName).toBe("Agent");
    });

    it("returns undefined roleName when role is not present", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json({ email: "test@example.com" });
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(result.current.roleName).toBeUndefined();
    });

    it("returns undefined roleName during loading", () => {
      server.use(
        http.get("*/auth/invitations/valid-token", async () => {
          await delay(100);
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      // During loading
      expect(result.current.roleName).toBeUndefined();
    });
  });

  // ===========================================================================
  // Form Submission
  // ===========================================================================

  describe("form submission", () => {
    it("sends correct payload to accept endpoint", async () => {
      let requestBody: unknown;

      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        }),
        http.post("*/auth/invitations/accept", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      expect(requestBody).toEqual({
        token: "valid-token",
        password: "newpassword123",
      });
    });

    it("navigates to dashboard after successful acceptance", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        }),
        http.post("*/auth/invitations/accept", () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
      });
    });

    it("does not submit when token is missing", async () => {
      mockToken.mockReturnValue(undefined);
      let submitCalled = false;

      server.use(
        http.post("*/auth/invitations/accept", () => {
          submitCalled = true;
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await new Promise((r) => setTimeout(r, 100));

      expect(submitCalled).toBe(false);
    });

    it("sets isPending during submission", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        }),
        http.post("*/auth/invitations/accept", async () => {
          await delay(100);
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.onSubmit({ password: "newpassword123" });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe("error handling", () => {
    it("provides error message when acceptance fails", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        }),
        http.post("*/auth/invitations/accept", () => {
          return HttpResponse.json(
            { message: "Invitation already used", code: "CONFLICT" },
            { status: 409 }
          );
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
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

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("returns null errorMessage when no error", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
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
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(typeof result.current.register).toBe("function");
    });

    it("provides handleSubmit function", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(typeof result.current.handleSubmit).toBe("function");
    });

    it("provides errors object", async () => {
      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(() => useAcceptInvitationForm(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("form");
      });

      expect(result.current.errors).toBeDefined();
    });
  });
});
