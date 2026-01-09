import type { FileRejection } from "react-dropzone";

// =============================================================================
// File Type Configuration
// =============================================================================

export const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/json": [".json"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
};

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function getRejectionMessage(rejection: FileRejection): string {
  const { errors } = rejection;
  if (errors.some((e) => e.code === "file-too-large")) {
    return `${rejection.file.name}: Archivo muy grande (máx. ${MAX_FILE_SIZE_MB}MB)`;
  }
  if (errors.some((e) => e.code === "file-invalid-type")) {
    return `${rejection.file.name}: Tipo de archivo no permitido`;
  }
  if (errors.some((e) => e.code === "too-many-files")) {
    return `${rejection.file.name}: Demasiados archivos`;
  }
  return `${rejection.file.name}: Archivo no válido`;
}
