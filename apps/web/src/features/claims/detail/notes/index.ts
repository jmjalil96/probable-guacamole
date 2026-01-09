// Main Component (entry point for tab)
export { ClaimNotesTab } from "./components";

// Sub-Components
export {
  NotesFeed,
  NoteFeedItem,
  NoteEditModal,
  NoteEditForm,
  NoteDeleteDialog,
} from "./components";

// Hooks
export { useNotesTab, useNoteForm } from "./hooks";

// Types
export type {
  FormError,
  NoteModalState,
  NoteModalHandlers,
  NoteDeleteState,
  NoteDeleteHandlers,
  UseNoteFormReturn,
  UseNoteComposerReturn,
  UseNotesTabReturn,
  ClaimNotesTabProps,
  NotesFeedProps,
  NoteFeedItemProps,
  NoteEditModalProps,
  NoteEditFormProps,
  NoteDeleteDialogProps,
} from "./types";

// Schema
export { noteFormSchema } from "./schema";
export type { NoteFormData } from "./schema";
