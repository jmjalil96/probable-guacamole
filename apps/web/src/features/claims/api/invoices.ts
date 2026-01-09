import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListClaimInvoicesResponse,
  ClaimInvoice,
  CreateClaimInvoiceRequest,
  UpdateClaimInvoiceRequest,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Invoices
// =============================================================================

export function useClaimInvoices(claimId: string) {
  return useQuery<ListClaimInvoicesResponse, Error>({
    queryKey: claimKeys.invoices(claimId),
    queryFn: async () => {
      const { data } = await api.get<ListClaimInvoicesResponse>(
        `/claims/${claimId}/invoices`
      );
      return data;
    },
    enabled: !!claimId,
  });
}

export function useClaimInvoice(claimId: string, invoiceId: string) {
  return useQuery<ClaimInvoice, Error>({
    queryKey: claimKeys.invoice(claimId, invoiceId),
    queryFn: async () => {
      const { data } = await api.get<ClaimInvoice>(
        `/claims/${claimId}/invoices/${invoiceId}`
      );
      return data;
    },
    enabled: !!claimId && !!invoiceId,
  });
}

export function useCreateClaimInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      data,
    }: {
      claimId: string;
      data: CreateClaimInvoiceRequest;
    }) => {
      const { data: response } = await api.post<ClaimInvoice>(
        `/claims/${claimId}/invoices`,
        data
      );
      return response;
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.invoices(claimId),
      });
      void queryClient.invalidateQueries({
        queryKey: claimKeys.detail(claimId),
      });
    },
  });
}

export function useUpdateClaimInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      invoiceId,
      data,
    }: {
      claimId: string;
      invoiceId: string;
      data: UpdateClaimInvoiceRequest;
    }) => {
      const { data: response } = await api.patch<ClaimInvoice>(
        `/claims/${claimId}/invoices/${invoiceId}`,
        data
      );
      return response;
    },
    onSuccess: (_, { claimId, invoiceId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.invoice(claimId, invoiceId),
      });
      void queryClient.invalidateQueries({
        queryKey: claimKeys.invoices(claimId),
      });
    },
  });
}

export function useDeleteClaimInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      invoiceId,
    }: {
      claimId: string;
      invoiceId: string;
    }) => {
      await api.delete(`/claims/${claimId}/invoices/${invoiceId}`);
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.invoices(claimId),
      });
      void queryClient.invalidateQueries({
        queryKey: claimKeys.detail(claimId),
      });
    },
  });
}
