import { useCallback, useState, useEffect } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, FileUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileList } from "./file-list";
import type { FileUploaderProps } from "./types";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  getRejectionMessage,
} from "./file-upload.config";

export function FileUploader<TCategory extends string = string>({
  files,
  onAddFiles,
  onRemoveFile,
  onRetryFile,
  selectedCategory,
  onCategoryChange,
  categories,
  categoryIcons,
  maxFiles = 20,
  disabled = false,
  error = false,
  className,
}: FileUploaderProps<TCategory>) {
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const canAddMore = files.length < maxFiles;
  const remainingSlots = maxFiles - files.length;

  // Auto-clear rejections after 5 seconds
  useEffect(() => {
    if (rejections.length === 0) return;
    const timer = setTimeout(() => setRejections([]), 5000);
    return () => clearTimeout(timer);
  }, [rejections]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Track rejections for feedback
      if (fileRejections.length > 0) {
        setRejections(fileRejections);
      }
      if (!canAddMore) return;
      onAddFiles(acceptedFiles);
    },
    [canAddMore, onAddFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE_BYTES,
      maxFiles: remainingSlots,
      disabled: disabled || !canAddMore || !selectedCategory,
      multiple: true,
    });

  const isDisabled = disabled || !canAddMore || !selectedCategory;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.value] as React.ComponentType<{
            className?: string;
          }>;
          const isSelected = selectedCategory === cat.value;

          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(isSelected ? null : cat.value)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-full",
                "text-xs sm:text-sm font-medium border transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/40",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-text-muted border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Helper text when no category selected */}
      {!selectedCategory && (
        <p className="text-xs font-semibold text-primary">
          Seleccione una categoría para habilitar la carga de archivos
        </p>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-4 sm:p-6",
          "transition-colors cursor-pointer",
          "flex flex-col items-center justify-center gap-2",
          "min-h-[120px] sm:min-h-[140px]",
          // States
          isDisabled && "opacity-50 cursor-not-allowed",
          error && "border-alert bg-alert/5",
          isDragReject && "border-alert bg-alert/5",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          !isDragActive &&
            !error &&
            !isDisabled &&
            "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isDragActive && !isDragReject
              ? "bg-primary/10"
              : error || isDragReject
                ? "bg-alert/10"
                : "bg-border/50"
          )}
        >
          {isDragActive ? (
            <FileUp
              className={cn(
                "h-6 w-6",
                isDragReject ? "text-alert" : "text-primary"
              )}
            />
          ) : (
            <Upload
              className={cn(
                "h-6 w-6",
                error ? "text-alert" : "text-text-light"
              )}
            />
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          {isDragActive ? (
            <p
              className={cn(
                "text-sm font-medium",
                isDragReject ? "text-alert" : "text-primary"
              )}
            >
              {isDragReject
                ? "Archivo no permitido"
                : "Suelta los archivos aquí"}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-text">
                Arrastra archivos aquí o{" "}
                <span className="text-primary">haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-text-light mt-1">
                PDF, imágenes, Word, Excel. Máx. {MAX_FILE_SIZE_MB}MB por
                archivo.
              </p>
            </>
          )}
        </div>

        {/* File count */}
        {files.length > 0 && (
          <p className="text-xs text-text-light">
            {files.length} de {maxFiles} archivos
          </p>
        )}
      </div>

      {/* Rejection feedback */}
      {rejections.length > 0 && (
        <div className="rounded-lg border border-alert/30 bg-alert/5 p-3 space-y-1">
          <div className="flex items-center gap-2 text-alert">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {rejections.length === 1
                ? "Archivo rechazado"
                : `${rejections.length} archivos rechazados`}
            </span>
          </div>
          <ul className="text-xs text-alert/80 space-y-0.5 pl-6">
            {rejections.slice(0, 3).map((rejection, i) => (
              <li key={i}>{getRejectionMessage(rejection)}</li>
            ))}
            {rejections.length > 3 && <li>...y {rejections.length - 3} más</li>}
          </ul>
        </div>
      )}

      {/* File list */}
      <FileList
        files={files}
        categories={categories}
        onRemove={onRemoveFile}
        onRetry={onRetryFile}
      />
    </div>
  );
}
