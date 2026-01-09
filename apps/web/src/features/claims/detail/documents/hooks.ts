import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  ClaimFile,
  ClaimFileCategory,
  DownloadClaimFileResponse,
} from "shared";
import { api } from "@/lib/api/client";
import { toast } from "@/lib/utils";
import type { UploadAdapter } from "@/components/file-uploader";
import { useFileUpload } from "@/components/file-uploader";
import {
  useClaimFiles,
  useDeleteClaimFile,
  useUploadClaimFile,
  useConfirmClaimFile,
} from "../../api";
import { CLAIM_FILE_CATEGORIES, CLAIM_CATEGORY_ICONS } from "../../shared";
import type {
  UseDocumentsTabReturn,
  DocumentModalState,
  DocumentModalHandlers,
  DocumentDeleteState,
  DocumentDeleteHandlers,
} from "./types";

// =============================================================================
// useDocumentModalState
// =============================================================================

interface UseDocumentModalStateReturn {
  state: DocumentModalState;
  handlers: DocumentModalHandlers;
}

/**
 * Manages modal state for upload document.
 * Single responsibility: track modal open/close.
 * Includes a key that increments on open to reset modal state via remounting.
 */
function useDocumentModalState(): UseDocumentModalStateReturn {
  const [state, setState] = useState<DocumentModalState>({
    open: false,
    key: 0,
  });

  const open = useCallback(() => {
    setState((prev) => ({ open: true, key: prev.key + 1 }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    state,
    handlers: { open, close },
  };
}

// =============================================================================
// useDocumentDeleteState
// =============================================================================

interface UseDocumentDeleteStateReturn {
  state: DocumentDeleteState;
  handlers: DocumentDeleteHandlers;
  setIsDeleting: (value: boolean) => void;
}

/**
 * Manages delete confirmation state for documents.
 * Single responsibility: track delete dialog open/close and current document.
 */
function useDocumentDeleteState(): UseDocumentDeleteStateReturn {
  const [state, setState] = useState<DocumentDeleteState>({
    open: false,
    document: null,
    isDeleting: false,
  });

  const openDelete = useCallback((document: ClaimFile) => {
    setState({ open: true, document, isDeleting: false });
  }, []);

  const cancelDelete = useCallback(() => {
    setState({ open: false, document: null, isDeleting: false });
  }, []);

  const confirmDelete = useCallback(() => {
    // Just signal confirmation - actual mutation handled by parent
  }, []);

  const setIsDeleting = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isDeleting: value }));
  }, []);

  return {
    state,
    handlers: { openDelete, confirmDelete, cancelDelete },
    setIsDeleting,
  };
}

// =============================================================================
// useDocumentsTab (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the documents tab.
 * Composes smaller, focused hooks for each concern.
 */
export function useDocumentsTab(claimId: string): UseDocumentsTabReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data, isLoading, isError, refetch } = useClaimFiles(claimId);

  // ---------------------------------------------------------------------------
  // 2. Modal State (Upload)
  // ---------------------------------------------------------------------------
  const modal = useDocumentModalState();

  // ---------------------------------------------------------------------------
  // 3. Delete State
  // ---------------------------------------------------------------------------
  const deleteModal = useDocumentDeleteState();
  const deleteMutation = useDeleteClaimFile();

  const confirmDelete = useCallback(() => {
    const document = deleteModal.state.document;
    if (!document) return;

    deleteModal.setIsDeleting(true);
    deleteMutation.mutate(
      {
        claimId,
        fileId: document.id,
      },
      {
        onSuccess: () => {
          toast.success("Documento eliminado");
          deleteModal.handlers.cancelDelete();
        },
        onError: () => {
          toast.error("Error al eliminar documento");
          deleteModal.setIsDeleting(false);
        },
      }
    );
  }, [claimId, deleteModal, deleteMutation]);

  // ---------------------------------------------------------------------------
  // 4. Download
  // ---------------------------------------------------------------------------
  const downloadDocument = useCallback(
    async (document: ClaimFile) => {
      try {
        const { data: response } = await api.get<DownloadClaimFileResponse>(
          `/claims/${claimId}/files/${document.id}/download`
        );
        window.open(response.downloadUrl, "_blank");
      } catch {
        toast.error("Error al descargar documento");
      }
    },
    [claimId]
  );

  // ---------------------------------------------------------------------------
  // 5. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    documents: data?.data ?? [],
    isLoading,
    isError,
    refetch,

    // Upload Modal
    modalState: modal.state,
    modalHandlers: modal.handlers,

    // Delete Dialog
    deleteState: deleteModal.state,
    deleteHandlers: {
      openDelete: deleteModal.handlers.openDelete,
      confirmDelete,
      cancelDelete: deleteModal.handlers.cancelDelete,
    },

    // Download
    downloadDocument,
  };
}

// =============================================================================
// useClaimFileUploadAdapter Hook
// =============================================================================

interface ClaimFileUploadResult {
  fileId: string;
}

/**
 * Adapter for existing claim file uploads (3-step flow).
 * Requires confirmation after upload to finalize the file record.
 */
function useClaimFileUploadAdapter(
  claimId: string
): UploadAdapter<ClaimFileCategory, ClaimFileUploadResult> {
  const uploadClaimFile = useUploadClaimFile();
  const confirmClaimFile = useConfirmClaimFile();

  return useMemo(
    () => ({
      getUploadUrl: async (file: File, category?: ClaimFileCategory) => {
        const response = await uploadClaimFile.mutateAsync({
          claimId,
          data: {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            ...(category && { category }),
          },
        });

        return {
          uploadUrl: response.uploadUrl,
          result: { fileId: response.fileId },
        };
      },

      // 3-step flow requires confirmation
      confirmUpload: async (result: ClaimFileUploadResult) => {
        await confirmClaimFile.mutateAsync({
          claimId,
          fileId: result.fileId,
        });
      },

      getSubmitValue: (result: ClaimFileUploadResult) => result.fileId,
    }),
    [claimId, uploadClaimFile, confirmClaimFile]
  );
}

// =============================================================================
// useDocumentUpload
// =============================================================================

interface UseDocumentUploadOptions {
  claimId: string;
  onSuccess: () => void;
  maxFiles?: number;
}

/**
 * Manages document upload flow for existing claims.
 * Uses the generic useFileUpload hook with the claim file upload adapter.
 * The adapter handles the 3-step flow: presigned URL → upload → confirm.
 */
export function useDocumentUpload({
  claimId,
  onSuccess,
  maxFiles = 20,
}: UseDocumentUploadOptions) {
  const adapter = useClaimFileUploadAdapter(claimId);

  const fileUpload = useFileUpload({
    adapter,
    maxFiles,
    onFileComplete: (file) => {
      toast.success(`${file.file.name} subido correctamente`);
    },
  });

  // Call onSuccess when all files are completed
  useEffect(() => {
    if (fileUpload.allCompleted && fileUpload.files.length > 0) {
      onSuccess();
    }
  }, [fileUpload.allCompleted, fileUpload.files.length, onSuccess]);

  // Return file upload hook with categories for the UI
  return {
    ...fileUpload,
    categories: CLAIM_FILE_CATEGORIES,
    categoryIcons: CLAIM_CATEGORY_ICONS,
  };
}
