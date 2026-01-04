import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { api, isApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { LoginRequest, LoginResponse, MeResponse } from "shared";

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
      queryClient.clear();
      void router.invalidate();
    },
    onError: (error) => {
      if (isApiError(error) && error.isUnauthorized) {
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
      queryClient.clear();
      void router.invalidate();
    },
    onError: (error) => {
      if (isApiError(error) && error.isUnauthorized) {
        queryClient.clear();
        void router.invalidate();
        return;
      }
      toast.error("Failed to log out of all devices. Please try again.");
    },
  });
}
