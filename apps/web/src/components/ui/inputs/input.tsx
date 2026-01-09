import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Base
          "w-full h-11 px-4",
          "text-sm text-text bg-white",
          "border rounded-xl outline-none",
          "transition-colors",
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

Input.displayName = "Input";
