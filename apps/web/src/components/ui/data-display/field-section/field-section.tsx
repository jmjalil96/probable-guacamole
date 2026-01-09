import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface Field {
  /** The field label. */
  label: string;
  /** The field value (can be any ReactNode). */
  value: ReactNode;
  /** Column span: 1, 2, 3, or "full" (spans all columns). @default 1 */
  span?: 1 | 2 | 3 | "full" | undefined;
}

export interface FieldSectionProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> {
  /** The section title. */
  title: string;
  /** The fields to display. */
  fields: Field[];
  /** Number of grid columns. @default 2 */
  columns?: 2 | 3 | undefined;
}

// =============================================================================
// Helpers
// =============================================================================

interface CellPosition {
  isLastRow: boolean;
  isRowEnd: boolean;
}

/**
 * Calculates the position of each field in the grid to determine
 * which borders to show (no bottom border on last row, no right border at row end).
 */
function getCellPositions(fields: Field[], columns: number): CellPosition[] {
  const positions: CellPosition[] = [];

  // Calculate total cells consumed
  let totalCells = 0;
  for (const f of fields) {
    const span = f.span === "full" ? columns : (f.span ?? 1);
    totalCells += span;
  }
  const totalRows = Math.ceil(totalCells / columns);

  // Track position for each field
  let currentCol = 0;
  let currentRow = 1;

  for (const field of fields) {
    const span = field.span === "full" ? columns : (field.span ?? 1);

    // Check if this cell ends at the row boundary
    const endCol = currentCol + span;
    const isRowEnd = endCol >= columns;

    // Check if this is the last row
    const isLastRow = currentRow === totalRows;

    positions.push({ isLastRow, isRowEnd });

    // Move to next position
    currentCol = endCol % columns;
    if (endCol >= columns) {
      currentRow++;
    }
  }

  return positions;
}

// =============================================================================
// Component
// =============================================================================

/**
 * A section that displays labeled fields in a grid layout.
 *
 * @example
 * ```tsx
 * <FieldSection
 *   title="Claim Details"
 *   columns={2}
 *   fields={[
 *     { label: "Claim Type", value: "Property Damage" },
 *     { label: "Category", value: "Auto" },
 *     { label: "Date of Loss", value: "Dec 15, 2024" },
 *     { label: "Date Reported", value: "Dec 18, 2024" },
 *     { label: "Description", value: "Vehicle collision...", span: "full" },
 *   ]}
 * />
 * ```
 */
export const FieldSection = forwardRef<HTMLElement, FieldSectionProps>(
  ({ title, fields, columns = 2, className, ...props }, ref) => {
    const positions = getCellPositions(fields, columns);

    return (
      <section
        ref={ref}
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-background",
          className
        )}
        {...props}
      >
        <header className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold tracking-[-0.01em] text-text">
            {title}
          </h3>
        </header>

        <dl
          className={cn("grid", columns === 3 ? "grid-cols-3" : "grid-cols-2")}
        >
          {fields.map((field, index) => {
            const position = positions[index] ?? {
              isLastRow: false,
              isRowEnd: false,
            };
            const { isLastRow, isRowEnd } = position;

            return (
              <div
                key={index}
                className={cn(
                  "px-5 py-3.5",
                  !isLastRow && "border-b border-border/50",
                  !isRowEnd && "border-r border-border/50",
                  field.span === 2 && "col-span-2",
                  field.span === 3 && "col-span-3",
                  field.span === "full" && "col-span-full"
                )}
              >
                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                  {field.label}
                </dt>
                <dd className="text-sm font-medium text-text">{field.value}</dd>
              </div>
            );
          })}
        </dl>
      </section>
    );
  }
);

FieldSection.displayName = "FieldSection";
