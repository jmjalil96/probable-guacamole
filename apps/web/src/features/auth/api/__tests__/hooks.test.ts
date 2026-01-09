import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { createWrapper, createTestQueryClient } from "@/test/render";
import {
  useMe,
  useLogin,
  useLogout,
  useLogoutAll,
  useRequestPasswordReset,
  useValidateResetToken,
  useConfirmPasswordReset,
  useValidateInvitation,
  useAcceptInvitation,
  authKeys,
} from "../hooks";
import { mockAuthenticatedUser } from "@/test/mocks/data/users";

// Mock router for hooks that use navigation
const mockNavigate = vi.fn();
const mockInvalidate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouter: () => ({
      navigate: mockNavigate,
      invalidate: mockInvalidate,
    }),
  };
});

const mockUser = mockAuthenticatedUser;

describe("Auth API Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // useMe
  // ===========================================================================

  describe("useMe", () => {
    it("returns user data when authenticated", async () => {
      server.use(
        http.get("*/auth/me", () => {
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useMe(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
    });

    it("returns null when not authenticated (401)", async () => {
      server.use(
        http.get("*/auth/me", () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const { result } = renderHook(() => useMe(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it("throws error for non-401 errors (500)", async () => {
      server.use(
        http.get("*/auth/me", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useMe(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("throws error for network failures", async () => {
      server.use(
        http.get("*/auth/me", () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useMe(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ===========================================================================
  // useLogin
  // ===========================================================================

  describe("useLogin", () => {
    it("returns user data on successful login", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify mutation returned the user data
      expect(result.current.data).toEqual(mockUser);
    });

    it("navigates to dashboard after successful login", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });

    it("returns error on invalid credentials", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(
            { message: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ email: "test@example.com", password: "wrong" });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("sends correct request payload", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/auth/login", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mockUser);
        })
      );

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          email: "test@example.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestBody).toEqual({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  // ===========================================================================
  // useLogout
  // ===========================================================================

  describe("useLogout", () => {
    it("clears query cache on success", async () => {
      server.use(
        http.post("*/auth/logout", () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const queryClient = createTestQueryClient();
      // Pre-populate cache with user
      queryClient.setQueryData(authKeys.me, mockUser);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify auth was set to null and cache was cleared
      // Note: queryClient.clear() removes all queries, but setQueryData(null) happens first
      expect(queryClient.getQueryData(authKeys.me)).toBeUndefined();
    });

    it("invalidates router on success", async () => {
      server.use(
        http.post("*/auth/logout", () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockInvalidate).toHaveBeenCalled();
    });

    it("clears cache even when logout fails with 401 (already logged out)", async () => {
      server.use(
        http.post("*/auth/logout", () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const queryClient = createTestQueryClient();
      queryClient.setQueryData(authKeys.me, mockUser);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        // The mutation errors, but onError handler still clears cache for 401
        expect(result.current.isError).toBe(true);
      });

      // Cache should be cleared even on 401 error (graceful logout)
      expect(queryClient.getQueryData(authKeys.me)).toBeUndefined();
      expect(mockInvalidate).toHaveBeenCalled();
    });

    it("returns error for non-401 server errors", async () => {
      server.use(
        http.post("*/auth/logout", () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // For non-401 errors, router is not invalidated (user might still be logged in)
      expect(mockInvalidate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // useLogoutAll
  // ===========================================================================

  describe("useLogoutAll", () => {
    it("succeeds and invalidates router", async () => {
      server.use(
        http.post("*/auth/logout-all", () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useLogoutAll(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockInvalidate).toHaveBeenCalled();
    });

    it("clears cache and invalidates router even when logout-all fails with 401", async () => {
      server.use(
        http.post("*/auth/logout-all", () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const { result } = renderHook(() => useLogoutAll(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Even on 401 error, router should be invalidated (graceful logout)
      expect(mockInvalidate).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // useRequestPasswordReset
  // ===========================================================================

  describe("useRequestPasswordReset", () => {
    it("sends password reset request", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/auth/password-reset/request", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useRequestPasswordReset(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ email: "test@example.com" });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestBody).toEqual({ email: "test@example.com" });
    });

    it("returns error on failure", async () => {
      server.use(
        http.post("*/auth/password-reset/request", () => {
          return HttpResponse.json(
            { message: "Rate limited" },
            { status: 429 }
          );
        })
      );

      const { result } = renderHook(() => useRequestPasswordReset(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ email: "test@example.com" });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ===========================================================================
  // useValidateResetToken
  // ===========================================================================

  describe("useValidateResetToken", () => {
    it("validates token successfully", async () => {
      server.use(
        http.get("*/auth/password-reset/valid-token", () => {
          return HttpResponse.json({ valid: true, email: "test@example.com" });
        })
      );

      const { result } = renderHook(
        () => useValidateResetToken("valid-token"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        valid: true,
        email: "test@example.com",
      });
    });

    it("returns error for invalid token", async () => {
      server.use(
        http.get("*/auth/password-reset/invalid-token", () => {
          return HttpResponse.json(
            { message: "Token expired or invalid" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(
        () => useValidateResetToken("invalid-token"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("does not fetch when token is empty", async () => {
      let fetchCalled = false;

      server.use(
        http.get("*/auth/password-reset/*", () => {
          fetchCalled = true;
          return HttpResponse.json({ valid: true });
        })
      );

      const { result } = renderHook(() => useValidateResetToken(""), {
        wrapper: createWrapper(),
      });

      // Wait a bit to ensure no fetch happens
      await new Promise((r) => setTimeout(r, 100));

      expect(fetchCalled).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  // ===========================================================================
  // useConfirmPasswordReset
  // ===========================================================================

  describe("useConfirmPasswordReset", () => {
    it("confirms password reset successfully", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/auth/password-reset/confirm", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useConfirmPasswordReset(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          token: "valid-token",
          password: "newpassword123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestBody).toEqual({
        token: "valid-token",
        password: "newpassword123",
      });
    });

    it("returns error for expired token", async () => {
      server.use(
        http.post("*/auth/password-reset/confirm", () => {
          return HttpResponse.json(
            { message: "Token expired" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useConfirmPasswordReset(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          token: "expired-token",
          password: "newpassword123",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ===========================================================================
  // useValidateInvitation
  // ===========================================================================

  describe("useValidateInvitation", () => {
    it("validates invitation successfully", async () => {
      const mockInvitation = {
        email: "invited@example.com",
        role: { id: "role-1", displayName: "Agent" },
      };

      server.use(
        http.get("*/auth/invitations/valid-token", () => {
          return HttpResponse.json(mockInvitation);
        })
      );

      const { result } = renderHook(
        () => useValidateInvitation("valid-token"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInvitation);
    });

    it("returns error for expired invitation", async () => {
      server.use(
        http.get("*/auth/invitations/expired-token", () => {
          return HttpResponse.json(
            { message: "Invitation expired" },
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(
        () => useValidateInvitation("expired-token"),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("does not fetch when token is empty", async () => {
      let fetchCalled = false;

      server.use(
        http.get("*/auth/invitations/*", () => {
          fetchCalled = true;
          return HttpResponse.json({});
        })
      );

      const { result } = renderHook(() => useValidateInvitation(""), {
        wrapper: createWrapper(),
      });

      await new Promise((r) => setTimeout(r, 100));

      expect(fetchCalled).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // useAcceptInvitation
  // ===========================================================================

  describe("useAcceptInvitation", () => {
    it("accepts invitation successfully", async () => {
      let requestBody: unknown;

      server.use(
        http.post("*/auth/invitations/accept", async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useAcceptInvitation(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({
          token: "valid-token",
          password: "newpassword123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(requestBody).toEqual({
        token: "valid-token",
        password: "newpassword123",
      });
    });

    it("navigates to dashboard after accepting", async () => {
      server.use(
        http.post("*/auth/invitations/accept", () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useAcceptInvitation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          token: "valid-token",
          password: "newpassword123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });

    it("returns error for already used invitation", async () => {
      server.use(
        http.post("*/auth/invitations/accept", () => {
          return HttpResponse.json(
            { message: "Invitation already used", code: "CONFLICT" },
            { status: 409 }
          );
        })
      );

      const { result } = renderHook(() => useAcceptInvitation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          token: "used-token",
          password: "newpassword123",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // authKeys
  // ===========================================================================

  describe("authKeys", () => {
    it("has correct me key", () => {
      expect(authKeys.me).toEqual(["auth", "me"]);
    });
  });
});
