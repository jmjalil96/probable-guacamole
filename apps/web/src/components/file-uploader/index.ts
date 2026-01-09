// =============================================================================
// Components
// =============================================================================

export { FileUploader } from "./file-uploader";
export { FileList } from "./file-list";
export { FileItem } from "./file-item";

// =============================================================================
// Hook
// =============================================================================

export { useFileUpload } from "./use-file-upload";

// =============================================================================
// Types
// =============================================================================

export type {
  FileStatus,
  FileCategory,
  CategoryIcons,
  UploadingFile,
  UploadAdapter,
  UseFileUploadOptions,
  UseFileUploadReturn,
  FileUploaderProps,
  FileListProps,
  FileItemProps,
} from "./types";

// =============================================================================
// Config (generic file validation only)
// =============================================================================

export {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  getRejectionMessage,
} from "./file-upload.config";
