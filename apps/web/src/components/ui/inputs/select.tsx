import { forwardRef, type ComponentRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  triggerVariants,
  popoverContentVariants,
  optionVariants,
} from "./popover.variants";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps {
  /** Available options to select from. */
  options: Option[];
  /** Currently selected value. */
  value: string;
  /** Callback when selection changes. */
  onChange: (value: string) => void;
  /** Placeholder when no option is selected. @default "Select..." */
  placeholder?: string;
  /** Accessible label. @default "Select option" */
  label?: string;
  /** Size variant. "sm" for filter bars, "md" for forms. @default "sm" */
  size?: "sm" | "md";
  /** Disables the select. @default false */
  disabled?: boolean;
  /** Shows error styling. @default false */
  error?: boolean;
  /** Additional CSS classes for the trigger. */
  className?: string;
}

/**
 * A single-select dropdown using Radix Select primitives.
 *
 * @example
 * ```tsx
 * // Filter bar (compact)
 * <Select options={options} value={v} onChange={setV} size="sm" />
 *
 * // Form (larger)
 * <Select options={options} value={v} onChange={setV} size="md" />
 * ```
 */
export const Select = forwardRef<
  ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectProps
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select...",
      label = "Select option",
      size = "sm",
      disabled = false,
      error = false,
      className,
    },
    ref
  ) => {
    const selectedOption = options.find((o) => o.value === value);

    return (
      <SelectPrimitive.Root
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          aria-label={label}
          className={cn(
            triggerVariants({ size, error }),
            !selectedOption ? "text-text-muted" : "text-text",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              size={16}
              className="shrink-0 text-text-muted"
              aria-hidden="true"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={8}
            className={popoverContentVariants()}
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    optionVariants(),
                    "pl-9 pr-3 rounded-lg",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-3">
                    <Check
                      size={14}
                      className="text-primary"
                      aria-hidden="true"
                    />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);

Select.displayName = "Select";
