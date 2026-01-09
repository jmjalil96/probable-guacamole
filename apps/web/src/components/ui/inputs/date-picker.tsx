import { useState, useId, forwardRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerVariants, popoverContentVariants } from "./popover.variants";

export interface DatePickerProps {
  /** The currently selected date. */
  value: Date | undefined;
  /** Callback when the date changes. */
  onChange: (date: Date | undefined) => void;
  /** Accessible label for the trigger button. @default "Select date" */
  label?: string;
  /** Placeholder text when no date is selected. @default "Seleccionar fecha" */
  placeholder?: string;
  /** Size variant. "sm" for filter bars, "md" for forms. @default "sm" */
  size?: "sm" | "md";
  /** Shows error styling. @default false */
  error?: boolean;
  /** Disables the picker. @default false */
  disabled?: boolean;
  /** Additional CSS classes for the trigger button. */
  className?: string;
}

/**
 * A single date picker with calendar popover.
 * Built on react-day-picker and Radix Popover.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<Date | undefined>();
 * <DatePicker value={date} onChange={setDate} />
 * ```
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      label = "Select date",
      placeholder = "Seleccionar fecha",
      size = "sm",
      error = false,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const generatedId = useId();

    const handleSelect = (date: Date | undefined) => {
      onChange(date);
      if (date) {
        setOpen(false);
      }
    };

    const displayText = value ? format(value, "MMM d, yyyy") : placeholder;

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <label htmlFor={generatedId} className="sr-only">
          {label}
        </label>
        <Popover.Trigger asChild>
          <button
            ref={ref}
            id={generatedId}
            type="button"
            disabled={disabled}
            className={cn(
              triggerVariants({ size, error, justify: "start" }),
              !value ? "text-text-muted" : "text-text",
              className
            )}
          >
            <Calendar
              size={16}
              className="shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span className="flex-1 text-left truncate">{displayText}</span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align="start"
            className={popoverContentVariants({ size: "calendar" })}
          >
            <div className="p-3">
              <DayPicker
                mode="single"
                selected={value}
                onSelect={handleSelect}
                showOutsideDays
                classNames={{
                  root: "relative",
                  months: "flex",
                  month: "space-y-4",
                  month_caption: "flex justify-center items-center h-7",
                  caption_label: "text-sm font-medium text-text",
                  nav: "absolute top-0 inset-x-0 flex justify-between",
                  button_previous:
                    "h-7 w-7 inline-flex items-center justify-center rounded-lg text-text-muted hover:bg-primary/5 hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  button_next:
                    "h-7 w-7 inline-flex items-center justify-center rounded-lg text-text-muted hover:bg-primary/5 hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  month_grid: "w-full border-collapse",
                  weekdays: "flex",
                  weekday:
                    "text-text-muted w-9 font-normal text-xs text-center",
                  week: "flex w-full mt-1",
                  day: "text-center text-sm p-0 w-9 h-9",
                  day_button:
                    "h-9 w-9 inline-flex items-center justify-center rounded-lg font-normal text-text transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  selected:
                    "bg-primary text-white hover:bg-primary-hover focus:bg-primary",
                  today: "ring-1 ring-primary/30",
                  outside: "text-text-muted/50",
                  disabled:
                    "text-text-muted/30 hover:bg-transparent cursor-not-allowed",
                  hidden: "invisible",
                }}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                      <ChevronLeft size={16} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={16} aria-hidden="true" />
                    ),
                }}
              />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }
);
DatePicker.displayName = "DatePicker";
