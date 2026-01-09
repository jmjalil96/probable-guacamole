import { useState, useCallback, useRef, useEffect } from "react";
import type {
  UploadingFile,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from "./types";

/**
 * Generic file upload hook that uses an adapter pattern to support different upload flows.
 *
 * - Pre-claim flow (2-step): getUploadUrl → upload to S3
 * - Existing claim flow (3-step): getUploadUrl → upload to S3 → confirmUpload
 *
 * @example
 * ```tsx
 * // Pre-claim usage
 * const adapter = usePendingUploadAdapter(sessionKey);
 * const upload = useFileUpload({ adapter });
 *
 * // Existing claim usage
 * const adapter = useClaimFileUploadAdapter(claimId);
 * const upload = useFileUpload({ adapter });
 * ```
 */
export function useFileUpload<
  TCategory extends string = string,
  TResult = unknown,
>({
  adapter,
  maxFiles = 20,
  onError,
  onFileComplete,
}: UseFileUploadOptions<TCategory, TResult>): UseFileUploadReturn<TCategory> {
  const [files, setFiles] = useState<UploadingFile<TCategory>[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TCategory | null>(
    null
  );

  // Track active XHR requests for cleanup
  const activeRequests = useRef<Map<string, XMLHttpRequest>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    const requests = activeRequests.current;
    return () => {
      requests.forEach((xhr) => xhr.abort());
      requests.clear();
    };
  }, []);

  const updateFile = useCallback(
    (id: string, updates: Partial<UploadingFile<TCategory>>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const uploadFile = useCallback(
    async (pendingFile: UploadingFile<TCategory>) => {
      const { id, file, category } = pendingFile;

      try {
        // Step 1: Get presigned URL from adapter
        updateFile(id, { status: "uploading", progress: 0 });

        const { uploadUrl, result } = await adapter.getUploadUrl(
          file,
          category
        );

        // Step 2: Upload to presigned URL with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Track this request
          activeRequests.current.set(id, xhr);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              updateFile(id, { progress });
            }
          });

          xhr.addEventListener("load", () => {
            activeRequests.current.delete(id);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            activeRequests.current.delete(id);
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            activeRequests.current.delete(id);
            reject(new Error("Upload aborted"));
          });

          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        // Step 3: Optional confirmation step (3-step flow)
        if (adapter.confirmUpload) {
          updateFile(id, { status: "confirming" });
          await adapter.confirmUpload(result);
        }

        // Success
        updateFile(id, {
          status: "success",
          progress: 100,
          uploadResult: result,
        });

        onFileComplete?.(pendingFile);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        updateFile(id, { status: "error", error: errorMessage });
        onError?.(pendingFile, errorMessage);
      }
    },
    [adapter, updateFile, onError, onFileComplete]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (!selectedCategory) return;

      setFiles((prev) => {
        const available = maxFiles - prev.length;
        if (available <= 0) return prev;

        const filesToAdd = newFiles.slice(0, available).map(
          (file): UploadingFile<TCategory> => ({
            id: crypto.randomUUID(),
            file,
            status: "pending",
            progress: 0,
            category: selectedCategory,
          })
        );

        // Start uploading each file
        filesToAdd.forEach((pendingFile) => {
          void uploadFile(pendingFile);
        });

        return [...prev, ...filesToAdd];
      });
    },
    [maxFiles, selectedCategory, uploadFile]
  );

  const removeFile = useCallback((id: string) => {
    // Abort active upload if any
    const xhr = activeRequests.current.get(id);
    if (xhr) {
      xhr.abort();
      activeRequests.current.delete(id);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    // Abort all active uploads
    activeRequests.current.forEach((xhr) => xhr.abort());
    activeRequests.current.clear();
    setFiles([]);
    setSelectedCategory(null);
  }, []);

  const retryFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file && file.status === "error") {
        // Reset the file to retry - create fresh state without error
        const updatedFile: UploadingFile<TCategory> = {
          id: file.id,
          file: file.file,
          status: "pending",
          progress: 0,
          ...(file.category !== undefined && { category: file.category }),
        };
        setFiles((prev) => prev.map((f) => (f.id === id ? updatedFile : f)));
        void uploadFile(updatedFile);
      }
    },
    [files, uploadFile]
  );

  // Get all successful upload identifiers for form submission
  const getUploadResults = useCallback(() => {
    return files
      .filter((f) => f.status === "success" && f.uploadResult !== undefined)
      .map((f) => adapter.getSubmitValue(f.uploadResult as TResult));
  }, [files, adapter]);

  const isUploading = files.some(
    (f) => f.status === "uploading" || f.status === "confirming"
  );
  const hasErrors = files.some((f) => f.status === "error");
  const canAddMore = files.length < maxFiles;
  const allCompleted =
    files.length > 0 && files.every((f) => f.status === "success");

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    retryFile,
    selectedCategory,
    setSelectedCategory,
    getUploadResults,
    isUploading,
    hasErrors,
    canAddMore,
    allCompleted,
    maxFiles,
  };
}
