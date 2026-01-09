import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  CreateClaimFileUploadRequest,
  CreateClaimFileUploadResponse,
  ListClaimFilesResponse,
  ClaimFile,
  UploadClaimFileRequest,
  UploadClaimFileResponse,
  DownloadClaimFileResponse,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Files - Pending Upload (Pre-claim)
// =============================================================================

export function useCreatePendingUpload() {
  return useMutation({
    mutationFn: async (data: CreateClaimFileUploadRequest) => {
      const { data: response } = await api.post<CreateClaimFileUploadResponse>(
        "/claims/files/upload",
        data
      );
      return response;
    },
  });
}

// =============================================================================
// Files - Claim Files
// =============================================================================

export function useClaimFiles(claimId: string) {
  return useQuery<ListClaimFilesResponse, Error>({
    queryKey: claimKeys.files.list(claimId),
    queryFn: async () => {
      const { data } = await api.get<ListClaimFilesResponse>(
        `/claims/${claimId}/files`
      );
      return data;
    },
    enabled: !!claimId,
  });
}

export function useUploadClaimFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      data,
    }: {
      claimId: string;
      data: UploadClaimFileRequest;
    }) => {
      const { data: response } = await api.post<UploadClaimFileResponse>(
        `/claims/${claimId}/files/upload`,
        data
      );
      return response;
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.files.list(claimId),
      });
    },
  });
}

export function useConfirmClaimFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      fileId,
    }: {
      claimId: string;
      fileId: string;
    }) => {
      const { data: response } = await api.post<ClaimFile>(
        `/claims/${claimId}/files/${fileId}/confirm`
      );
      return response;
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.files.list(claimId),
      });
    },
  });
}

export function useClaimFileDownload(claimId: string, fileId: string) {
  return useQuery<DownloadClaimFileResponse, Error>({
    queryKey: claimKeys.files.download(claimId, fileId),
    queryFn: async () => {
      const { data } = await api.get<DownloadClaimFileResponse>(
        `/claims/${claimId}/files/${fileId}/download`
      );
      return data;
    },
    enabled: !!claimId && !!fileId,
    // Download URLs are short-lived, don't cache for long
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useDeleteClaimFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      fileId,
    }: {
      claimId: string;
      fileId: string;
    }) => {
      await api.delete(`/claims/${claimId}/files/${fileId}`);
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.files.list(claimId),
      });
      void queryClient.invalidateQueries({
        queryKey: claimKeys.detail(claimId),
      });
    },
  });
}
