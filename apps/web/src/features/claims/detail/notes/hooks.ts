import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Note } from "shared";
import { toast } from "@/lib/utils";
import {
  useClaimNotes,
  useCreateClaimNote,
  useUpdateClaimNote,
  useDeleteClaimNote,
} from "../../api";
import { extractFormError } from "../utils";
import { noteFormSchema, type NoteFormData } from "./schema";
import type {
  UseNotesTabReturn,
  UseNoteFormReturn,
  UseNoteComposerReturn,
  NoteModalState,
  NoteModalHandlers,
  NoteDeleteState,
  NoteDeleteHandlers,
  FormError,
} from "./types";

// =============================================================================
// useNoteModalState
// =============================================================================

interface UseNoteModalStateReturn {
  state: NoteModalState;
  handlers: NoteModalHandlers;
}

/**
 * Manages modal state for edit note.
 * Single responsibility: track modal open/close and current note.
 * Includes a key that increments on open to reset modal state via remounting.
 */
function useNoteModalState(): UseNoteModalStateReturn {
  const [state, setState] = useState<NoteModalState>({
    open: false,
    note: null,
    key: 0,
  });

  const openEdit = useCallback((note: Note) => {
    setState((prev) => ({ open: true, note, key: prev.key + 1 }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false, note: null }));
  }, []);

  return {
    state,
    handlers: { openEdit, close },
  };
}

// =============================================================================
// useNoteDeleteState
// =============================================================================

interface UseNoteDeleteStateReturn {
  state: NoteDeleteState;
  handlers: NoteDeleteHandlers;
  setIsDeleting: (value: boolean) => void;
}

/**
 * Manages delete confirmation state for notes.
 * Single responsibility: track delete dialog open/close and current note.
 */
function useNoteDeleteState(): UseNoteDeleteStateReturn {
  const [state, setState] = useState<NoteDeleteState>({
    open: false,
    note: null,
    isDeleting: false,
  });

  const openDelete = useCallback((note: Note) => {
    setState({ open: true, note, isDeleting: false });
  }, []);

  const cancelDelete = useCallback(() => {
    setState({ open: false, note: null, isDeleting: false });
  }, []);

  const confirmDelete = useCallback(() => {
    // Just signal confirmation - actual mutation handled by parent
  }, []);

  const setIsDeleting = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isDeleting: value }));
  }, []);

  return {
    state,
    handlers: { openDelete, confirmDelete, cancelDelete },
    setIsDeleting,
  };
}

// =============================================================================
// useNoteComposer
// =============================================================================

interface UseNoteComposerOptions {
  claimId: string;
  onSuccess: () => void;
}

/**
 * Manages the note composer state and submission.
 * Single responsibility: track content and submit new notes.
 */
function useNoteComposer({
  claimId,
  onSuccess,
}: UseNoteComposerOptions): UseNoteComposerReturn {
  const [content, setContent] = useState("");
  const [error, setError] = useState<FormError | null>(null);

  const createMutation = useCreateClaimNote();
  const isSubmitting = createMutation.isPending;
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const clearError = useCallback(() => setError(null), []);

  const submit = useCallback(async () => {
    if (!canSubmit) return;

    setError(null);

    try {
      await createMutation.mutateAsync({
        claimId,
        data: { content: content.trim(), isInternal: false },
      });
      toast.success("Nota agregada");
      setContent("");
      onSuccess();
    } catch (err) {
      const formError = extractFormError(err as Error);
      setError(formError);
      toast.error(formError.title);
    }
  }, [claimId, content, canSubmit, createMutation, onSuccess]);

  return {
    content,
    setContent,
    isSubmitting,
    canSubmit,
    submit,
    error,
    clearError,
  };
}

// =============================================================================
// useNotesTab (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the notes tab.
 * Composes smaller, focused hooks for each concern.
 */
export function useNotesTab(claimId: string): UseNotesTabReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data, isLoading, isError, refetch } = useClaimNotes(claimId);

  // ---------------------------------------------------------------------------
  // 2. Modal State (Edit)
  // ---------------------------------------------------------------------------
  const modal = useNoteModalState();

  // ---------------------------------------------------------------------------
  // 3. Delete State
  // ---------------------------------------------------------------------------
  const deleteModal = useNoteDeleteState();
  const deleteMutation = useDeleteClaimNote();

  const confirmDelete = useCallback(() => {
    const note = deleteModal.state.note;
    if (!note) return;

    deleteModal.setIsDeleting(true);
    deleteMutation.mutate(
      {
        claimId,
        noteId: note.id,
      },
      {
        onSuccess: () => {
          toast.success("Nota eliminada");
          deleteModal.handlers.cancelDelete();
        },
        onError: () => {
          toast.error("Error al eliminar nota");
          deleteModal.setIsDeleting(false);
        },
      }
    );
  }, [claimId, deleteModal, deleteMutation]);

  // ---------------------------------------------------------------------------
  // 4. Composer
  // ---------------------------------------------------------------------------
  const composer = useNoteComposer({
    claimId,
    onSuccess: () => {
      // Refetch is automatic via query invalidation
    },
  });

  // ---------------------------------------------------------------------------
  // 5. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    notes: data?.data ?? [],
    count: data?.pagination.total ?? 0,
    isLoading,
    isError,
    refetch,

    // Edit Modal
    modalState: modal.state,
    modalHandlers: modal.handlers,

    // Delete Dialog
    deleteState: deleteModal.state,
    deleteHandlers: {
      openDelete: deleteModal.handlers.openDelete,
      confirmDelete,
      cancelDelete: deleteModal.handlers.cancelDelete,
    },

    // Composer
    composer,
  };
}

// =============================================================================
// useNoteForm
// =============================================================================

/**
 * Manages the note form state, validation, and submission.
 * Single responsibility: form state and submission for edit modal.
 */
export function useNoteForm(
  claimId: string,
  note: Note | null,
  open: boolean,
  onSuccess: () => void
): UseNoteFormReturn {
  // ---------------------------------------------------------------------------
  // Form Setup
  // ---------------------------------------------------------------------------
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  // Reset form when modal opens or note changes
  useEffect(() => {
    if (open) {
      if (note) {
        reset({
          content: note.content,
        });
      } else {
        reset({
          content: "",
        });
      }
    }
  }, [open, note, reset]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const updateMutation = useUpdateClaimNote();
  const isBusy = isSubmitting || updateMutation.isPending;

  // ---------------------------------------------------------------------------
  // Submit Handler
  // ---------------------------------------------------------------------------
  const onSubmit = useCallback(
    async (data: NoteFormData) => {
      setFormError(null);

      if (!note) return;

      try {
        await updateMutation.mutateAsync({
          claimId,
          noteId: note.id,
          data: {
            content: data.content,
          },
        });
        toast.success("Nota actualizada");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [claimId, note, updateMutation, onSuccess]
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    control,
    handleSubmit,
    errors,
    isDirty,
    isBusy,
    formError,
    onSubmit,
    clearFormError,
  };
}
