// =============================================================================
// File Size Formatting
// =============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// File Type Detection
// =============================================================================

export type FileIconType = "image" | "spreadsheet" | "document" | "file";

export function getFileIconType(contentType: string): FileIconType {
  if (contentType.startsWith("image/")) {
    return "image";
  }
  if (
    contentType.includes("spreadsheet") ||
    contentType.includes("excel") ||
    contentType === "text/csv"
  ) {
    return "spreadsheet";
  }
  if (
    contentType === "application/pdf" ||
    contentType.includes("document") ||
    contentType.includes("word")
  ) {
    return "document";
  }
  return "file";
}
