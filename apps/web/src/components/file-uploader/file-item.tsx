import {
  File,
  FileText,
  FileSpreadsheet,
  Image,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import {
  formatFileSize,
  getFileIconType,
  type FileIconType,
} from "@/lib/formatting";
import type { FileItemProps } from "./types";

const FILE_ICONS: Record<FileIconType, LucideIcon> = {
  image: Image,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  file: File,
};

export function FileItem<TCategory extends string = string>({
  file,
  categories,
  onRemove,
  onRetry,
  showCategoryBadge = true,
}: FileItemProps<TCategory>) {
  const { file: rawFile, status, progress, error, category } = file;
  const iconType = getFileIconType(rawFile.type);
  const Icon = FILE_ICONS[iconType];
  const categoryLabel =
    showCategoryBadge && category
      ? categories.find((c) => c.value === category)?.label
      : null;

  // Normalize status - treat "confirming" appropriately
  const isError = status === "error";
  const isSuccess = status === "success";
  const isUploading =
    status === "uploading" || status === "confirming" || status === "pending";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        "transition-colors",
        isError ? "border-alert/30 bg-alert/5" : "border-border bg-white"
      )}
    >
      {/* File icon */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          isError ? "bg-alert/10" : "bg-primary/10"
        )}
      >
        <Icon
          className={cn("h-5 w-5", isError ? "text-alert" : "text-primary")}
        />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{rawFile.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-light">
            {formatFileSize(rawFile.size)}
          </span>

          {isUploading && !isSuccess && (
            <span className="text-xs text-primary">{progress}%</span>
          )}

          {isError && error && (
            <span className="text-xs text-alert truncate">{error}</span>
          )}
        </div>

        {/* Progress bar */}
        {isUploading && !isSuccess && (
          <div className="mt-1.5 h-1 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Category badge (read-only) */}
        {categoryLabel && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-text-light" />
            <span className="text-xs text-text-light">{categoryLabel}</span>
          </div>
        )}
      </div>

      {/* Status indicator / Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {isUploading && !isSuccess && <Spinner size="sm" />}

        {isSuccess && (
          <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-success" />
          </div>
        )}

        {isError && (
          <>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry()}
                className="p-1.5 rounded-lg text-text-light hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Reintentar"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <div className="w-6 h-6 rounded-full bg-alert/10 flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5 text-alert" />
            </div>
          </>
        )}

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-text-light hover:text-alert hover:bg-alert/10 transition-colors"
          aria-label="Eliminar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
