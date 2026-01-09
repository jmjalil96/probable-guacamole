import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string | undefined;
  labelAction?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  labelAction,
  required,
  children,
  className,
}: FormFieldProps) {
  const labelContent = (
    <>
      {label}
      {required && <span className="text-alert"> *</span>}
    </>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {labelAction ? (
        <div className="flex items-center justify-between">
          <label htmlFor={htmlFor} className="text-sm font-medium text-text">
            {labelContent}
          </label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={htmlFor} className="text-sm font-medium text-text">
          {labelContent}
        </label>
      )}

      {children}

      {error && <p className="text-sm text-alert">{error}</p>}
    </div>
  );
}
