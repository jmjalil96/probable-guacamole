import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          // Base
          "w-full px-4 py-3",
          "text-sm text-text bg-white",
          "border rounded-xl outline-none",
          "transition-colors resize-none",
          "placeholder:text-text-light",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Error vs normal states
          error
            ? "border-alert focus:border-alert focus:ring-4 focus:ring-alert/10"
            : "border-border hover:border-text-light focus:border-primary focus:ring-4 focus:ring-primary/10",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
