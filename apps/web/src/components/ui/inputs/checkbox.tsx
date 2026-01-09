import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxProps = ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> & {
  className?: string;
};

/**
 * A checkbox input with support for checked, unchecked, and indeterminate states.
 *
 * @example
 * ```tsx
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 * <Checkbox checked="indeterminate" />
 * ```
 */
export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, checked, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      {...(checked !== undefined && { checked })}
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center",
        "rounded border-2 border-border bg-transparent",
        "transition-colors",
        "hover:border-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        {checked === "indeterminate" ? (
          <Minus size={12} strokeWidth={3} aria-hidden="true" />
        ) : (
          <Check size={12} strokeWidth={3} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";
