/**
 * @fileoverview Business-specific UI patterns
 *
 * Composed components that encode business decisions and workflows.
 * For primitive UI components, import from @/components/ui instead.
 */

// =============================================================================
// Dialogs - Pre-configured dialog patterns
// =============================================================================
/** Confirmation dialog for destructive actions */
export { DeleteDialog } from "./dialogs/delete-dialog";
export type { DeleteDialogProps } from "./dialogs/delete-dialog";

/** Form modal with dirty checking and exit confirmation */
export { EditModal } from "./dialogs/edit-modal";
export type { EditModalProps } from "./dialogs/edit-modal";

// =============================================================================
// Headers - Page and section headers
// =============================================================================
/** Detail page header with back nav and actions */
export { DetailHeader } from "./headers/detail-header";
export type {
  DetailHeaderProps,
  DetailHeaderTopBarProps,
  DetailHeaderMainProps,
  DetailHeaderInfoItemProps,
} from "./headers/detail-header";

/** Section header with title, count, and action slot */
export { SectionHeader } from "./headers/section-header";
export type { SectionHeaderProps } from "./headers/section-header";

// =============================================================================
// Content - Content composition patterns
// =============================================================================
/** Rich text composer with submit actions */
export { Composer } from "./content/composer";
export type { ComposerProps } from "./content/composer";

/** Field change diff display */
export { FieldChangesList } from "./content/field-changes-list";
export type {
  FieldChangesListProps,
  FieldChange,
} from "./content/field-changes-list";

// =============================================================================
// Workflows - Complex workflow UI
// =============================================================================
/** Multi-step workflow progress indicator */
export { WorkflowStepper } from "./workflows/workflow-stepper";
export type {
  WorkflowStepperProps,
  WorkflowStep,
} from "./workflows/workflow-stepper";

/** Kanban board with columns and cards */
export { KanbanBoard, KanbanColumn, KanbanCard } from "./workflows/kanban";
export type {
  KanbanBoardProps,
  KanbanColumnProps,
  KanbanCardProps,
} from "./workflows/kanban";

// =============================================================================
// Errors - Error display patterns
// =============================================================================
/** Lookup failure display with retry */
export { LookupError } from "./errors/lookup-error";
export type { LookupErrorProps } from "./errors/lookup-error";
