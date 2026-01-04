import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string | undefined;
  labelAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  labelAction,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {labelAction ? (
        <div className="flex items-center justify-between">
          <label htmlFor={htmlFor} className="text-sm font-medium text-text">
            {label}
          </label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={htmlFor} className="text-sm font-medium text-text">
          {label}
        </label>
      )}

      {children}

      {error && <p className="text-sm text-alert">{error}</p>}
    </div>
  );
}
