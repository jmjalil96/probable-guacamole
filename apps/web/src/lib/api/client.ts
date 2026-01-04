import axios, { type AxiosError } from "axios";
import { ApiError, type ApiErrorDetails } from "./errors";
import { queryClient } from "@/lib/query";

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetails;
    requestId?: string;
  };
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Response interceptor - transform errors to ApiError
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data, config } = error.response;

      // Session expiry: 401 clears auth state (except login - 401 means bad credentials)
      // Route guards will handle redirect to login
      const isLoginEndpoint = config.url?.startsWith("/auth/login");
      if (status === 401 && !isLoginEndpoint) {
        queryClient.setQueryData(["auth", "me"], null);
      }

      throw new ApiError(
        status,
        data?.error?.code ?? "UNKNOWN_ERROR",
        data?.error?.message ?? "Request failed",
        data?.error?.details,
        data?.error?.requestId
      );
    }

    if (error.request) {
      // Request sent, no response (network/timeout)
      throw new ApiError(0, "NETWORK_ERROR", "No response from server");
    }

    // Request setup error
    throw new ApiError(0, "REQUEST_ERROR", error.message);
  }
);
