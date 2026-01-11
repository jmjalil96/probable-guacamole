/**
 * @fileoverview Design system UI components
 *
 * This barrel exports all primitive UI components organized by category.
 * For business-specific patterns, import from @/components/patterns instead.
 */

// =============================================================================
// Primitives - Atomic building blocks
// =============================================================================
/** Core interactive element for user actions */
export { Button } from "./primitives/button";
export type { ButtonProps } from "./primitives/button";

/** Loading indicator spinner */
export { Spinner } from "./primitives/spinner";

/** Brand logo component */
export { Logo } from "./primitives/logo";
export type { LogoProps } from "./primitives/logo";

// =============================================================================
// Inputs - Form controls and user input
// =============================================================================
export {
  Input,
  CurrencyInput,
  Textarea,
  PasswordInput,
  FormField,
  SearchableSelect,
  SearchInput,
  Select,
  MultiSelect,
  DateRangePicker,
  DatePicker,
  Combobox,
  Checkbox,
} from "./inputs";
export type {
  InputProps,
  CurrencyInputProps,
  TextareaProps,
  PasswordInputProps,
  FormFieldProps,
  SearchableSelectProps,
  SearchInputProps,
  SelectProps,
  SelectOption,
  Option,
  MultiSelectProps,
  MultiSelectOption,
  DateRangePickerProps,
  DatePickerProps,
  DateRange,
  Preset,
  ComboboxProps,
  ComboboxOption,
  CheckboxProps,
} from "./inputs";

// =============================================================================
// Overlays - Floating UI elements
// =============================================================================
/** Centered dialog for forms and content */
export { Modal, useModalContext } from "./overlays/modal";
export type {
  ModalProps,
  ModalPanelProps,
  ModalHeaderProps,
  ModalTitleProps,
  ModalDescriptionProps,
  ModalBodyProps,
  ModalFooterProps,
  ModalCloseProps,
  ModalSize,
} from "./overlays/modal";

/** Side panel drawer */
export { Sheet } from "./overlays/sheet";
export type {
  SheetProps,
  SheetPanelProps,
  SheetHeaderProps,
  SheetTitleProps,
  SheetDescriptionProps,
  SheetBodyProps,
  SheetFooterProps,
  SheetCloseProps,
  SheetSide,
  SheetSize,
} from "./overlays/sheet";

/** Confirmation/alert dialogs */
export { AlertDialog } from "./overlays/alert-dialog";
export type {
  AlertDialogProps,
  AlertDialogPanelProps,
  AlertDialogIconProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
  AlertDialogActionsProps,
  AlertDialogVariant,
} from "./overlays/alert-dialog";

/** Context menu / action menu */
export { DropdownMenu } from "./overlays/dropdown-menu";
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
} from "./overlays/dropdown-menu";

// =============================================================================
// Feedback - User feedback and status
// =============================================================================
/** Inline alert messages */
export { Alert } from "./feedback/alert";
export type { AlertProps, AlertVariant } from "./feedback/alert";

/** Full-screen loading state */
export { LoadingScreen } from "./feedback/loading-screen";

/** Empty content placeholder */
export { EmptyState } from "./feedback/empty-state";
export type { EmptyStateProps } from "./feedback/empty-state";

/** Error state with retry */
export { ErrorState } from "./feedback/error-state";
export type { ErrorStateProps } from "./feedback/error-state";

// =============================================================================
// Navigation - Navigation and tabs
// =============================================================================
/** Tab navigation component */
export { Tabs } from "./navigation/tabs";
export type { TabsProps, TabOption } from "./navigation/tabs";

/** List/grid view switcher */
export { ViewToggle } from "./navigation/view-toggle";
export type {
  ViewToggleProps,
  ViewToggleOption,
} from "./navigation/view-toggle";

// =============================================================================
// Data Display - Content presentation
// =============================================================================
/** Data table with sorting, pagination, selection */
export {
  DataTable,
  ColumnHeader,
  Pagination,
  ExpandToggle,
  createColumnHelper,
} from "./data-display/tables";
export type {
  DataTableProps,
  ColumnHeaderProps,
  PaginationProps,
  ExpandToggleProps,
  ColumnDef,
  SortingState,
  PaginationState,
  RowSelectionState,
  ExpandedState,
} from "./data-display/tables";

/** Activity/timeline feed */
export { Feed, FeedItem, FeedGroup } from "./data-display/feed";
export type {
  FeedProps,
  FeedItemProps,
  FeedGroupProps,
} from "./data-display/feed";

/** Labeled field grid sections */
export { FieldSection } from "./data-display/field-section";
export type { FieldSectionProps, Field } from "./data-display/field-section";

/** Status indicator badge */
export { StatusBadge } from "./data-display/status-badge";
export type { StatusBadgeProps } from "./data-display/status-badge";

/** User avatar with fallback initials */
export { UserAvatar } from "./data-display/user-avatar";
export type { UserAvatarProps } from "./data-display/user-avatar";

// =============================================================================
// Filtering - Search and filter UI
// =============================================================================
/** Page header with count and actions */
export { ListHeader, FilterBar, FilterChip } from "./filtering";
export type {
  ListHeaderProps,
  FilterBarProps,
  FilterChipProps,
} from "./filtering";
