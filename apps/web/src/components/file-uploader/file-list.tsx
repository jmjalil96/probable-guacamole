import { cn } from "@/lib/utils";
import { FileItem } from "./file-item";
import type { FileListProps } from "./types";

export function FileList<TCategory extends string = string>({
  files,
  categories,
  onRemove,
  onRetry,
  className,
}: FileListProps<TCategory>) {
  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          categories={categories}
          onRemove={() => onRemove(file.id)}
          onRetry={() => onRetry(file.id)}
        />
      ))}
    </div>
  );
}
