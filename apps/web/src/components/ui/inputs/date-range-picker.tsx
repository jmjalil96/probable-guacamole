import { useState, useId, forwardRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  DayPicker,
  type DateRange as DayPickerDateRange,
} from "react-day-picker";
import {
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { triggerVariants, popoverContentVariants } from "./popover.variants";

/** A date range with optional start and end dates. */
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

/** A preset date range option for quick selection. */
export interface Preset {
  /** Display label for the preset. */
  label: string;
  /** Unique identifier for the preset. */
  value: string;
  /** Function that returns the date range when selected. */
  getRange: () => DateRange;
}

/** Default preset options: Today, Yesterday, Last 7/30 days, This/Last month. */
const defaultPresets: Preset[] = [
  {
    label: "Today",
    value: "today",
    getRange: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    value: "yesterday",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 days",
    value: "last7",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    value: "last30",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This month",
    value: "thisMonth",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last month",
    value: "lastMonth",
    getRange: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

export interface DateRangePickerProps {
  /** The currently selected date range. */
  value: DateRange;
  /** Callback when the date range changes. */
  onChange: (range: DateRange) => void;
  /** Custom presets to show. @default defaultPresets */
  presets?: Preset[];
  /** Accessible label for the trigger button. @default "Select date range" */
  label?: string;
  /** Placeholder text when no date is selected. @default "Select dates" */
  placeholder?: string;
  /** Size variant. "sm" for filter bars, "md" for forms. @default "sm" */
  size?: "sm" | "md";
  /** Additional CSS classes for the trigger button. */
  className?: string;
}

function getDisplayText(
  range: DateRange,
  presets: Preset[],
  placeholder: string
): string {
  if (!range.from && !range.to) return placeholder;

  // Check if matches a preset
  const matchingPreset = presets.find((p) => {
    const presetRange = p.getRange();
    return (
      presetRange.from &&
      presetRange.to &&
      range.from &&
      range.to &&
      isSameDay(presetRange.from, range.from) &&
      isSameDay(presetRange.to, range.to)
    );
  });

  if (matchingPreset) return matchingPreset.label;

  // Custom range display
  if (range.from && range.to) {
    if (isSameDay(range.from, range.to)) {
      return format(range.from, "MMM d, yyyy");
    }
    return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`;
  }

  if (range.from) {
    return `${format(range.from, "MMM d, yyyy")} - ...`;
  }

  return placeholder;
}

/**
 * A date range picker with preset options and a custom calendar view.
 * Supports quick presets (Today, Last 7 days, etc.) and custom range selection.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
 * <DateRangePicker value={range} onChange={setRange} />
 * ```
 */
export const DateRangePicker = forwardRef<
  HTMLButtonElement,
  DateRangePickerProps
>(
  (
    {
      value,
      onChange,
      presets = defaultPresets,
      label = "Select date range",
      placeholder = "Select dates",
      size = "sm",
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<"presets" | "custom">("presets");
    const [tempRange, setTempRange] = useState<DateRange>({
      from: undefined,
      to: undefined,
    });
    const generatedId = useId();

    const handlePresetSelect = (preset: Preset) => {
      onChange(preset.getRange());
      setOpen(false);
    };

    const handleCustomClick = () => {
      setTempRange(value);
      setView("custom");
    };

    const handleBackToPresets = () => {
      setView("presets");
      setTempRange({ from: undefined, to: undefined });
    };

    const handleCalendarSelect = (range: DayPickerDateRange | undefined) => {
      setTempRange({
        from: range?.from,
        to: range?.to,
      });
    };

    const handleApply = () => {
      if (tempRange.from) {
        onChange({
          from: startOfDay(tempRange.from),
          to: tempRange.to ? endOfDay(tempRange.to) : endOfDay(tempRange.from),
        });
      }
      setOpen(false);
      setView("presets");
    };

    const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        setView("presets");
        setTempRange({ from: undefined, to: undefined });
      }
    };

    const displayText = getDisplayText(value, presets, placeholder);
    const isPresetSelected = (preset: Preset) => {
      const presetRange = preset.getRange();
      return (
        presetRange.from &&
        presetRange.to &&
        value.from &&
        value.to &&
        isSameDay(presetRange.from, value.from) &&
        isSameDay(presetRange.to, value.to)
      );
    };

    return (
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <label htmlFor={generatedId} className="sr-only">
          {label}
        </label>
        <Popover.Trigger asChild>
          <button
            ref={ref}
            id={generatedId}
            type="button"
            className={cn(
              triggerVariants({ size, justify: "start" }),
              !value.from ? "text-text-muted" : "text-text",
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
            {view === "presets" ? (
              <div className="p-1.5 min-w-[200px]">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-3",
                      "rounded-lg px-3 py-2 text-sm text-text",
                      "outline-none transition-colors",
                      "hover:bg-primary/5 focus:bg-primary/5"
                    )}
                  >
                    <span>{preset.label}</span>
                    {isPresetSelected(preset) && (
                      <Check
                        size={14}
                        className="text-primary"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
                <div className="my-1.5 h-px bg-border" />
                <button
                  type="button"
                  onClick={handleCustomClick}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3",
                    "rounded-lg px-3 py-2 text-sm text-text",
                    "outline-none transition-colors",
                    "hover:bg-primary/5 focus:bg-primary/5"
                  )}
                >
                  Custom range
                </button>
              </div>
            ) : (
              <div className="p-3">
                <button
                  type="button"
                  onClick={handleBackToPresets}
                  className={cn(
                    "mb-3 flex items-center gap-2 text-sm text-text-muted",
                    "hover:text-text transition-colors"
                  )}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  Back to presets
                </button>

                <DayPicker
                  mode="range"
                  selected={{ from: tempRange.from, to: tempRange.to }}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={2}
                  showOutsideDays
                  classNames={{
                    root: "relative",
                    months: "flex gap-8",
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
                    range_start: "rounded-r-none",
                    range_end: "rounded-l-none",
                    range_middle: "rounded-none bg-primary/10 text-text",
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

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-text-muted">
                    {tempRange.from && tempRange.to
                      ? `${format(tempRange.from, "MMM d, yyyy")} - ${format(tempRange.to, "MMM d, yyyy")}`
                      : tempRange.from
                        ? `${format(tempRange.from, "MMM d, yyyy")} - ...`
                        : "Select start and end dates"}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!tempRange.from}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }
);
DateRangePicker.displayName = "DateRangePicker";
