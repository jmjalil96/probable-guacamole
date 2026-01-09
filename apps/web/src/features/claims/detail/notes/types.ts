import type { Note } from "shared";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import type { NoteFormData } from "./schema";

// =============================================================================
// Form Error
// =============================================================================

export interface FormError {
  title: string;
  description?: string;
  items?: string[];
}

// =============================================================================
// Modal State (Edit)
// =============================================================================

export interface NoteModalState {
  open: boolean;
  note: Note | null;
  /** Key that increments on each open - use as component key to reset state */
  key: number;
}

export interface NoteModalHandlers {
  openEdit: (note: Note) => void;
  close: () => void;
}

// =============================================================================
// Delete State
// =============================================================================

export interface NoteDeleteState {
  open: boolean;
  note: Note | null;
  isDeleting: boolean;
}

export interface NoteDeleteHandlers {
  openDelete: (note: Note) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

// =============================================================================
// Form Hook Return Type
// =============================================================================

export interface UseNoteFormReturn {
  control: Control<NoteFormData>;
  errors: FieldErrors<NoteFormData>;
  handleSubmit: UseFormHandleSubmit<NoteFormData>;
  isDirty: boolean;
  isBusy: boolean;
  formError: FormError | null;
  onSubmit: (data: NoteFormData) => Promise<void>;
  clearFormError: () => void;
}

// =============================================================================
// Composer Hook Return Type
// =============================================================================

export interface UseNoteComposerReturn {
  content: string;
  setContent: (value: string) => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  submit: () => Promise<void>;
  error: FormError | null;
  clearError: () => void;
}

// =============================================================================
// Master Hook Return Type
// =============================================================================

export interface UseNotesTabReturn {
  // Data
  notes: Note[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;

  // Edit Modal
  modalState: NoteModalState;
  modalHandlers: NoteModalHandlers;

  // Delete Dialog
  deleteState: NoteDeleteState;
  deleteHandlers: NoteDeleteHandlers;

  // Composer
  composer: UseNoteComposerReturn;
}

// =============================================================================
// Component Props
// =============================================================================

export interface ClaimNotesTabProps {
  claimId: string;
}

export interface NotesTabHeaderProps {
  count: number;
}

export interface NotesFeedProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export interface NoteFeedItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export interface NoteComposerProps {
  content: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  error: FormError | null;
  onDismissError: () => void;
}

export interface NoteEditModalProps {
  open: boolean;
  note: Note | null;
  claimId: string;
  onClose: () => void;
}

export interface NoteEditFormProps {
  control: Control<NoteFormData>;
  errors: FieldErrors<NoteFormData>;
  onSubmit: (e: React.FormEvent) => void;
}

export interface NoteDeleteDialogProps {
  open: boolean;
  note: Note | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
