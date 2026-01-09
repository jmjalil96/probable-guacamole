import type { LucideIcon } from "lucide-react";

// =============================================================================
// File Status
// =============================================================================

export type FileStatus =
  | "pending"
  | "uploading"
  | "confirming"
  | "success"
  | "error";

// =============================================================================
// Category Types
// =============================================================================

export interface FileCategory<T extends string = string> {
  value: T;
  label: string;
}

export type CategoryIcons<T extends string = string> = Record<T, LucideIcon>;

// =============================================================================
// File State
// =============================================================================

export interface UploadingFile<TCategory extends string = string> {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  category?: TCategory;
  /** Result from adapter after upload (e.g., pendingUploadId or fileId) */
  uploadResult?: unknown;
}

// =============================================================================
// Upload Adapter Interface
// =============================================================================

/**
 * Adapter interface that abstracts different upload flows.
 *
 * - Pre-claim flow (2-step): getUploadUrl → upload to S3
 * - Existing claim flow (3-step): getUploadUrl → upload to S3 → confirmUpload
 */
export interface UploadAdapter<
  TCategory extends string = string,
  TResult = unknown,
> {
  /**
   * Get presigned upload URL and any required identifiers.
   * Called before uploading to S3.
   */
  getUploadUrl: (
    file: File,
    category?: TCategory
  ) => Promise<{
    uploadUrl: string;
    result: TResult;
  }>;

  /**
   * Optional confirmation step after S3 upload completes.
   * Used by existing claim flow to finalize the file record.
   */
  confirmUpload?: ((result: TResult) => Promise<void>) | undefined;

  /**
   * Extract the final identifier for form submission.
   * E.g., returns pendingUploadId or fileId from the result.
   */
  getSubmitValue: (result: TResult) => string;
}

// =============================================================================
// Hook Types
// =============================================================================

export interface UseFileUploadOptions<
  TCategory extends string = string,
  TResult = unknown,
> {
  adapter: UploadAdapter<TCategory, TResult>;
  maxFiles?: number;
  onError?: (file: UploadingFile<TCategory>, error: string) => void;
  onFileComplete?: (file: UploadingFile<TCategory>) => void;
}

export interface UseFileUploadReturn<TCategory extends string = string> {
  files: UploadingFile<TCategory>[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  retryFile: (id: string) => void;
  selectedCategory: TCategory | null;
  setSelectedCategory: (category: TCategory | null) => void;
  /** Get all successful upload identifiers for form submission */
  getUploadResults: () => string[];
  isUploading: boolean;
  hasErrors: boolean;
  canAddMore: boolean;
  allCompleted: boolean;
  maxFiles: number;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface FileUploaderProps<TCategory extends string = string> {
  files: UploadingFile<TCategory>[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  selectedCategory: TCategory | null;
  onCategoryChange: (category: TCategory | null) => void;
  /** Category definitions */
  categories: FileCategory<TCategory>[];
  /** Icons for each category */
  categoryIcons: CategoryIcons<TCategory>;
  maxFiles?: number;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export interface FileListProps<TCategory extends string = string> {
  files: UploadingFile<TCategory>[];
  categories: FileCategory<TCategory>[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  className?: string;
}

export interface FileItemProps<TCategory extends string = string> {
  file: UploadingFile<TCategory>;
  categories: FileCategory<TCategory>[];
  onRemove: () => void;
  onRetry?: () => void;
  showCategoryBadge?: boolean;
}
