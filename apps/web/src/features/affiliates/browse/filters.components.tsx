import { SlidersHorizontal } from "lucide-react";
import {
  Button,
  ListHeader,
  FilterChip,
  FilterBar,
  SearchInput,
  Select,
  Sheet,
  FormField,
} from "@/components/ui";
import { PORTAL_ACCESS_OPTIONS } from "../shared";
import type { ActiveFilter, UseAffiliatesFiltersReturn } from "./types";

// =============================================================================
// Filter Options
// =============================================================================

const ACTIVE_OPTIONS = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

// =============================================================================
// Grouped Prop Types
// =============================================================================

export interface FilterState {
  filters: {
    search: string | undefined;
    clientId: string | undefined;
    isActive: boolean | undefined;
    hasPortalAccess: "true" | "false" | "pending" | undefined;
  };
  activeFilters: ActiveFilter[];
  hasActiveFilters: boolean;
}

export interface FilterHandlers {
  updateFilter: UseAffiliatesFiltersReturn["updateFilter"];
  clearAllFilters: () => void;
}

export interface SheetState {
  desktop: { open: boolean; onOpen: () => void; onClose: () => void };
  mobile: { open: boolean; onOpen: () => void; onClose: () => void };
}

// =============================================================================
// AffiliatesFilterChips
// =============================================================================

export interface AffiliatesFilterChipsProps {
  filters: ActiveFilter[];
}

export function AffiliatesFilterChips({ filters }: AffiliatesFilterChipsProps) {
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
// AffiliatesFiltersInline
// =============================================================================

export interface AffiliatesFiltersInlineProps {
  // Filter values
  search: string | undefined;
  isActive: boolean | undefined;
  hasPortalAccess: "true" | "false" | "pending" | undefined;
  // Callbacks
  onSearchChange: (value: string | undefined) => void;
  onIsActiveChange: (value: boolean | undefined) => void;
  onHasPortalAccessChange: (
    value: "true" | "false" | "pending" | undefined
  ) => void;
  // Actions
  onOpenMobileFilters?: (() => void) | undefined;
  onOpenDesktopFilters?: (() => void) | undefined;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function AffiliatesFiltersInline({
  search,
  isActive,
  hasPortalAccess,
  onSearchChange,
  onIsActiveChange,
  onHasPortalAccessChange,
  onOpenMobileFilters,
  onOpenDesktopFilters,
  onClearAll,
  hasActiveFilters,
}: AffiliatesFiltersInlineProps) {
  return (
    <FilterBar>
      <SearchInput
        value={search ?? ""}
        onChange={(v) => onSearchChange(v || undefined)}
        placeholder="Buscar afiliados..."
        debounce={300}
        className="flex-1 sm:flex-none"
      />

      {/* Desktop: Inline filters */}
      <div className="hidden items-center gap-4 sm:flex">
        <FilterBar.Divider />
        <Select
          options={ACTIVE_OPTIONS}
          value={isActive === undefined ? "" : String(isActive)}
          onChange={(v) =>
            onIsActiveChange(v === "" ? undefined : v === "true")
          }
          placeholder="Estado"
        />
        <Select
          options={PORTAL_ACCESS_OPTIONS}
          value={hasPortalAccess ?? ""}
          onChange={(v) =>
            onHasPortalAccessChange(
              (v as "true" | "false" | "pending") || undefined
            )
          }
          placeholder="Acceso Portal"
        />
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

      {/* Desktop: More filters button (hidden for now, can be enabled later) */}
      {onOpenDesktopFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden shrink-0 sm:hidden"
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
// AffiliatesFiltersSheet (Mobile)
// =============================================================================

export interface AffiliatesFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  // Filter values
  isActive: boolean | undefined;
  hasPortalAccess: "true" | "false" | "pending" | undefined;
  // Callbacks
  onIsActiveChange: (value: boolean | undefined) => void;
  onHasPortalAccessChange: (
    value: "true" | "false" | "pending" | undefined
  ) => void;
  onClearAll: () => void;
}

export function AffiliatesFiltersSheet({
  open,
  onClose,
  isActive,
  hasPortalAccess,
  onIsActiveChange,
  onHasPortalAccessChange,
  onClearAll,
}: AffiliatesFiltersSheetProps) {
  return (
    <Sheet open={open} onClose={onClose}>
      <Sheet.Panel side="right" size="full">
        <Sheet.Header>
          <Sheet.Title>Filtros</Sheet.Title>
        </Sheet.Header>
        <Sheet.Body className="space-y-4">
          <FormField label="Estado">
            <Select
              options={ACTIVE_OPTIONS}
              value={isActive === undefined ? "" : String(isActive)}
              onChange={(v) =>
                onIsActiveChange(v === "" ? undefined : v === "true")
              }
              placeholder="Seleccionar estado..."
            />
          </FormField>
          <FormField label="Acceso al Portal">
            <Select
              options={PORTAL_ACCESS_OPTIONS}
              value={hasPortalAccess ?? ""}
              onChange={(v) =>
                onHasPortalAccessChange(
                  (v as "true" | "false" | "pending") || undefined
                )
              }
              placeholder="Seleccionar acceso..."
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
// AffiliatesListHeader
// =============================================================================

export interface AffiliatesListHeaderProps {
  total: number | undefined;
}

export function AffiliatesListHeader({ total }: AffiliatesListHeaderProps) {
  return (
    <ListHeader
      title="Afiliados"
      {...(total !== undefined && { count: total })}
    />
  );
}
