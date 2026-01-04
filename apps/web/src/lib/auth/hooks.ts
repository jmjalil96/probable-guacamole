import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { api, isApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  ValidateResetTokenResponse,
  PasswordResetConfirm,
  PasswordResetConfirmResponse,
  ValidateInvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
} from "shared";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  return useQuery<MeResponse | null, Error>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        const { data } = await api.get<MeResponse>("/auth/me");
        return data;
      } catch (error) {
        if (isApiError(error) && error.isUnauthorized) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: "always",
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await api.post<LoginResponse>("/auth/login", credentials);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
      void router.navigate({ to: "/" });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.clear();
      void router.invalidate();
    },
    onError: (error) => {
      if (isApiError(error) && error.isUnauthorized) {
        queryClient.setQueryData(authKeys.me, null);
        queryClient.clear();
        void router.invalidate();
        return;
      }
      toast.error("Failed to log out. Please try again.");
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout-all");
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.clear();
      void router.invalidate();
    },
    onError: (error) => {
      if (isApiError(error) && error.isUnauthorized) {
        queryClient.setQueryData(authKeys.me, null);
        queryClient.clear();
        void router.invalidate();
        return;
      }
      toast.error("Failed to log out of all devices. Please try again.");
    },
  });
}

// =============================================================================
// Password Reset
// =============================================================================

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (data: PasswordResetRequest) => {
      const { data: response } = await api.post<PasswordResetRequestResponse>(
        "/auth/password-reset/request",
        data
      );
      return response;
    },
  });
}

export function useValidateResetToken(token: string) {
  return useQuery<ValidateResetTokenResponse, Error>({
    queryKey: ["auth", "reset-token", token],
    queryFn: async () => {
      const { data } = await api.get<ValidateResetTokenResponse>(
        `/auth/password-reset/${token}`
      );
      return data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: async (data: PasswordResetConfirm) => {
      const { data: response } = await api.post<PasswordResetConfirmResponse>(
        "/auth/password-reset/confirm",
        data
      );
      return response;
    },
  });
}

// =============================================================================
// Invitations
// =============================================================================

export function useValidateInvitation(token: string) {
  return useQuery<ValidateInvitationResponse, Error>({
    queryKey: ["auth", "invitation", token],
    queryFn: async () => {
      const { data } = await api.get<ValidateInvitationResponse>(
        `/auth/invitations/${token}`
      );
      return data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: AcceptInvitationRequest) => {
      const { data: response } = await api.post<AcceptInvitationResponse>(
        "/auth/invitations/accept",
        data
      );
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
      void router.navigate({ to: "/" });
    },
  });
}
