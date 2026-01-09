import { Plus, List, Columns, SlidersHorizontal } from "lucide-react";
import type { ClaimStatus, CareType } from "shared";
import {
  Button,
  ListHeader,
  ViewToggle,
  FilterChip,
  FilterBar,
  SearchInput,
  MultiSelect,
  Select,
  DateRangePicker,
  Sheet,
  FormField,
  type DateRange,
} from "@/components/ui";
import { parseDateRange } from "@/lib/formatting";
import { STATUS_OPTIONS, CARE_TYPE_OPTIONS } from "../shared";
import type { ActiveFilter, UseClaimsFiltersReturn } from "./types";

// =============================================================================
// Grouped Prop Types
// =============================================================================

export interface FilterState {
  filters: {
    search: string | undefined;
    status: ClaimStatus[] | undefined;
    careType: CareType | undefined;
    submittedDateFrom: string | undefined;
    submittedDateTo: string | undefined;
    incidentDateFrom: string | undefined;
    incidentDateTo: string | undefined;
  };
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
}

export interface FilterHandlers {
  updateFilter: UseClaimsFiltersReturn["updateFilter"];
  clearAllFilters: () => void;
  handleSubmittedDateChange: (range: DateRange) => void;
  handleIncidentDateChange: (range: DateRange) => void;
  clearIncidentDate: () => void;
}

export interface SheetState {
  desktop: { open: boolean; onOpen: () => void; onClose: () => void };
  mobile: { open: boolean; onOpen: () => void; onClose: () => void };
}

// =============================================================================
// ClaimsFilterChips
// =============================================================================

export interface ClaimsFilterChipsProps {
  filters: ActiveFilter[];
}

export function ClaimsFilterChips({ filters }: ClaimsFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 scrollbar-hide sm:px-6 lg:px-8">
      {filters.map((filter) => (
        <FilterChip
          key={filter.key}
          label={filter.label}
          value={filter.value}
          onRemove={filter.onRemove}
          className="shrink-0"
        />
      ))}
    </div>
  );
}

// =============================================================================
// ClaimsFiltersInline
// =============================================================================

export interface ClaimsFiltersInlineProps {
  // Filter values
  search: string | undefined;
  status: ClaimStatus[] | undefined;
  careType: CareType | undefined;
  submittedDateFrom: string | undefined;
  submittedDateTo: string | undefined;
  // Callbacks
  onSearchChange: (value: string | undefined) => void;
  onStatusChange: (value: ClaimStatus[] | undefined) => void;
  onCareTypeChange: (value: CareType | undefined) => void;
  onSubmittedDateChange?: ((range: DateRange) => void) | undefined;
  // Actions
  onOpenMobileFilters?: (() => void) | undefined;
  onOpenDesktopFilters?: (() => void) | undefined;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function ClaimsFiltersInline({
  search,
  status,
  careType,
  submittedDateFrom,
  submittedDateTo,
  onSearchChange,
  onStatusChange,
  onCareTypeChange,
  onSubmittedDateChange,
  onOpenMobileFilters,
  onOpenDesktopFilters,
  onClearAll,
  hasActiveFilters,
}: ClaimsFiltersInlineProps) {
  return (
    <FilterBar>
      <SearchInput
        value={search ?? ""}
        onChange={(v) => onSearchChange(v || undefined)}
        placeholder="Buscar reclamos..."
        debounce={300}
        className="flex-1 sm:flex-none"
      />

      {/* Desktop: Inline filters */}
      <div className="hidden items-center gap-4 sm:flex">
        <FilterBar.Divider />
        <MultiSelect
          options={STATUS_OPTIONS}
          value={status ?? []}
          onChange={(v) =>
            onStatusChange(v.length ? (v as ClaimStatus[]) : undefined)
          }
          placeholder="Estado"
        />
        <Select
          options={CARE_TYPE_OPTIONS}
          value={careType ?? ""}
          onChange={(v) => onCareTypeChange((v as CareType) || undefined)}
          placeholder="Tipo de atención"
        />
        {onSubmittedDateChange && (
          <DateRangePicker
            value={parseDateRange(submittedDateFrom, submittedDateTo)}
            onChange={onSubmittedDateChange}
            placeholder="Fecha de envío"
          />
        )}
      </div>

      <FilterBar.Spacer />

      {/* Mobile: Filter button */}
      {onOpenMobileFilters && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 sm:hidden"
          onClick={onOpenMobileFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      )}

      {/* Desktop: More filters button */}
      {onOpenDesktopFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden shrink-0 sm:flex"
          onClick={onOpenDesktopFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </Button>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Limpiar todo</span>
          <span className="sm:hidden">Limpiar</span>
        </Button>
      )}
    </FilterBar>
  );
}

// =============================================================================
// ClaimsFiltersSheet
// =============================================================================

export interface ClaimsFiltersSheetProps {
  variant: "desktop" | "mobile";
  open: boolean;
  onClose: () => void;
  // Filter values
  status: ClaimStatus[] | undefined;
  careType: CareType | undefined;
  submittedDateFrom: string | undefined;
  submittedDateTo: string | undefined;
  incidentDateFrom: string | undefined;
  incidentDateTo: string | undefined;
  // Callbacks
  onStatusChange: (value: ClaimStatus[] | undefined) => void;
  onCareTypeChange: (value: CareType | undefined) => void;
  onSubmittedDateChange: (range: DateRange) => void;
  onIncidentDateChange: (range: DateRange) => void;
  onClearAll: () => void;
  onClearIncidentDate: () => void;
}

export function ClaimsFiltersSheet({
  variant,
  open,
  onClose,
  status,
  careType,
  submittedDateFrom,
  submittedDateTo,
  incidentDateFrom,
  incidentDateTo,
  onStatusChange,
  onCareTypeChange,
  onSubmittedDateChange,
  onIncidentDateChange,
  onClearAll,
  onClearIncidentDate,
}: ClaimsFiltersSheetProps) {
  if (variant === "desktop") {
    return (
      <Sheet open={open} onClose={onClose}>
        <Sheet.Panel side="right" size="sm">
          <Sheet.Header>
            <Sheet.Title>Filtros Adicionales</Sheet.Title>
          </Sheet.Header>
          <Sheet.Body className="space-y-4">
            <FormField label="Fecha de Incidente">
              <DateRangePicker
                value={parseDateRange(incidentDateFrom, incidentDateTo)}
                onChange={onIncidentDateChange}
                placeholder="Seleccionar fechas..."
              />
            </FormField>
          </Sheet.Body>
          <Sheet.Footer>
            <Button variant="ghost" onClick={onClearIncidentDate}>
              Limpiar
            </Button>
            <Button onClick={onClose}>Aplicar</Button>
          </Sheet.Footer>
        </Sheet.Panel>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <Sheet.Panel side="right" size="full">
        <Sheet.Header>
          <Sheet.Title>Filtros</Sheet.Title>
        </Sheet.Header>
        <Sheet.Body className="space-y-4">
          <FormField label="Estado">
            <MultiSelect
              options={STATUS_OPTIONS}
              value={status ?? []}
              onChange={(v) =>
                onStatusChange(v.length ? (v as ClaimStatus[]) : undefined)
              }
              placeholder="Seleccionar estados..."
            />
          </FormField>
          <FormField label="Tipo de Atención">
            <Select
              options={CARE_TYPE_OPTIONS}
              value={careType ?? ""}
              onChange={(v) => onCareTypeChange((v as CareType) || undefined)}
              placeholder="Seleccionar tipo..."
            />
          </FormField>
          <FormField label="Fecha de Envío">
            <DateRangePicker
              value={parseDateRange(submittedDateFrom, submittedDateTo)}
              onChange={onSubmittedDateChange}
              placeholder="Seleccionar fechas..."
            />
          </FormField>
          <FormField label="Fecha de Incidente">
            <DateRangePicker
              value={parseDateRange(incidentDateFrom, incidentDateTo)}
              onChange={onIncidentDateChange}
              placeholder="Seleccionar fechas..."
            />
          </FormField>
        </Sheet.Body>
        <Sheet.Footer>
          <Button variant="ghost" onClick={onClearAll}>
            Limpiar Todo
          </Button>
          <Button onClick={onClose}>Aplicar Filtros</Button>
        </Sheet.Footer>
      </Sheet.Panel>
    </Sheet>
  );
}

// =============================================================================
// ClaimsListHeader
// =============================================================================

export type ClaimsView = "list" | "kanban";

export interface ClaimsListHeaderProps {
  total: number | undefined;
  view: ClaimsView;
  onViewChange: (view: ClaimsView) => void;
  onNewClaim: () => void;
}

const VIEW_OPTIONS = [
  {
    value: "list" as const,
    icon: <List className="h-[18px] w-[18px]" />,
    label: "Lista",
  },
  {
    value: "kanban" as const,
    icon: <Columns className="h-[18px] w-[18px]" />,
    label: "Kanban",
  },
];

export function ClaimsListHeader({
  total,
  view,
  onViewChange,
  onNewClaim,
}: ClaimsListHeaderProps) {
  return (
    <ListHeader title="Reclamos" {...(total !== undefined && { count: total })}>
      <div className="flex items-center gap-4">
        <ViewToggle
          value={view}
          onChange={onViewChange}
          options={VIEW_OPTIONS}
        />
        <Button onClick={onNewClaim}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Reclamo</span>
        </Button>
      </div>
    </ListHeader>
  );
}
