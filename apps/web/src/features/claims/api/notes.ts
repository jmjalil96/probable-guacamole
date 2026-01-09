import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  ListNotesResponse,
  ListNotesQuery,
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
} from "shared";
import { claimKeys } from "./keys";

// =============================================================================
// Notes
// =============================================================================

export function useClaimNotes(claimId: string, query?: ListNotesQuery) {
  return useQuery<ListNotesResponse, Error>({
    queryKey: claimKeys.notes(claimId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      if (query?.sortOrder) params.set("sortOrder", query.sortOrder);
      if (query?.includeInternal) params.set("includeInternal", "true");

      const url = `/claims/${claimId}/notes${params.toString() ? `?${params.toString()}` : ""}`;
      const { data } = await api.get<ListNotesResponse>(url);
      return data;
    },
    enabled: !!claimId,
  });
}

export function useClaimNote(claimId: string, noteId: string) {
  return useQuery<Note, Error>({
    queryKey: claimKeys.note(claimId, noteId),
    queryFn: async () => {
      const { data } = await api.get<Note>(
        `/claims/${claimId}/notes/${noteId}`
      );
      return data;
    },
    enabled: !!claimId && !!noteId,
  });
}

export function useCreateClaimNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      data,
    }: {
      claimId: string;
      data: CreateNoteRequest;
    }) => {
      const { data: response } = await api.post<Note>(
        `/claims/${claimId}/notes`,
        data
      );
      return response;
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.notes(claimId),
      });
    },
  });
}

export function useUpdateClaimNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      noteId,
      data,
    }: {
      claimId: string;
      noteId: string;
      data: UpdateNoteRequest;
    }) => {
      const { data: response } = await api.patch<Note>(
        `/claims/${claimId}/notes/${noteId}`,
        data
      );
      return response;
    },
    onSuccess: (_, { claimId, noteId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.note(claimId, noteId),
      });
      void queryClient.invalidateQueries({
        queryKey: claimKeys.notes(claimId),
      });
    },
  });
}

export function useDeleteClaimNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      noteId,
    }: {
      claimId: string;
      noteId: string;
    }) => {
      await api.delete(`/claims/${claimId}/notes/${noteId}`);
    },
    onSuccess: (_, { claimId }) => {
      void queryClient.invalidateQueries({
        queryKey: claimKeys.notes(claimId),
      });
    },
  });
}
