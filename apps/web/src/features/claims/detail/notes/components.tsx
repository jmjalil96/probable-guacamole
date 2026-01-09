import { Controller } from "react-hook-form";
import {
  FormField,
  Textarea,
  Spinner,
  ErrorState,
  Feed,
  FeedItem,
  UserAvatar,
} from "@/components/ui";
import {
  SectionHeader,
  DeleteDialog,
  EditModal,
  Composer,
} from "@/components/patterns";
import { formatRelativeTime } from "../audit/utils";
import { useNotesTab, useNoteForm } from "./hooks";
import type {
  ClaimNotesTabProps,
  NotesFeedProps,
  NoteFeedItemProps,
  NoteEditModalProps,
  NoteEditFormProps,
  NoteDeleteDialogProps,
} from "./types";

// =============================================================================
// NoteFeedItem
// =============================================================================

export function NoteFeedItem({ note, onEdit, onDelete }: NoteFeedItemProps) {
  const relativeTime = formatRelativeTime(note.createdAt);

  return (
    <FeedItem className="group">
      <div className="mb-2.5 flex items-center gap-3">
        <UserAvatar user={note.createdBy} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-sm font-medium text-text">
            {note.createdBy.name}
          </span>
          <span className="text-xs text-text-muted">{relativeTime}</span>
          {note.isEdited && (
            <span className="text-xs text-text-light">(editado)</span>
          )}
        </div>
      </div>
      <div className="ml-11 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
        {note.content}
      </div>
      <div className="ml-11 mt-3 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          className="text-xs font-medium text-text-muted transition-colors hover:text-primary"
          onClick={() => onEdit(note)}
        >
          Editar
        </button>
        <button
          type="button"
          className="text-xs font-medium text-text-muted transition-colors hover:text-alert"
          onClick={() => onDelete(note)}
        >
          Eliminar
        </button>
      </div>
    </FeedItem>
  );
}

// =============================================================================
// NotesFeed
// =============================================================================

export function NotesFeed({ notes, onEdit, onDelete }: NotesFeedProps) {
  return (
    <Feed
      items={notes}
      keyExtractor={(note) => note.id}
      emptyMessage="No hay notas registradas."
      renderItem={(note) => (
        <NoteFeedItem note={note} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}

// =============================================================================
// NoteEditForm
// =============================================================================

export function NoteEditForm({ control, errors, onSubmit }: NoteEditFormProps) {
  return (
    <form id="note-form" onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Contenido"
        htmlFor="content"
        error={errors.content?.message}
        required
      >
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="Escriba el contenido de la nota..."
              rows={6}
              error={!!errors.content}
              autoFocus
            />
          )}
        />
      </FormField>
    </form>
  );
}

// =============================================================================
// NoteEditModal
// =============================================================================

export function NoteEditModal({
  open,
  note,
  claimId,
  onClose,
}: NoteEditModalProps) {
  const form = useNoteForm(claimId, note, open, onClose);

  return (
    <EditModal
      open={open}
      title="Editar Nota"
      formId="note-form"
      isDirty={form.isDirty}
      isBusy={form.isBusy}
      error={form.formError}
      onClose={onClose}
      onClearError={form.clearFormError}
    >
      <NoteEditForm
        control={form.control}
        errors={form.errors}
        onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
      />
    </EditModal>
  );
}

// =============================================================================
// NoteDeleteDialog
// =============================================================================

export function NoteDeleteDialog({
  open,
  note,
  isDeleting,
  onConfirm,
  onCancel,
}: NoteDeleteDialogProps) {
  const displayContent =
    note?.content && note.content.length > 100
      ? `${note.content.substring(0, 100)}...`
      : note?.content;

  return (
    <DeleteDialog
      open={open}
      title="Eliminar Nota"
      description="¿Está seguro que desea eliminar esta nota?"
      itemPreview={displayContent}
      isDeleting={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// =============================================================================
// ClaimNotesTab (Entry Point)
// =============================================================================

export function ClaimNotesTab({ claimId }: ClaimNotesTabProps) {
  const {
    notes,
    count,
    isLoading,
    isError,
    refetch,
    modalState,
    modalHandlers,
    deleteState,
    deleteHandlers,
    composer,
  } = useNotesTab(claimId);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-border bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Error al cargar las notas. Intente nuevamente."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="grid grid-cols-[1fr_340px] gap-12">
      {/* Left: Notes List */}
      <div>
        <SectionHeader title="Notas" count={count} variant="uppercase" />
        <NotesFeed
          notes={notes}
          onEdit={modalHandlers.openEdit}
          onDelete={deleteHandlers.openDelete}
        />
      </div>

      {/* Right: Composer */}
      <div>
        <SectionHeader title="Nueva Nota" variant="uppercase" />
        <Composer
          isSubmitting={composer.isSubmitting}
          canSubmit={composer.canSubmit}
        >
          <Composer.Error
            error={composer.error}
            onDismiss={composer.clearError}
          />
          <Composer.Input
            value={composer.content}
            onChange={composer.setContent}
            placeholder="Escriba su nota aquí..."
          />
          <Composer.Footer>
            <Composer.Submit onClick={() => void composer.submit()}>
              Agregar Nota
            </Composer.Submit>
          </Composer.Footer>
        </Composer>
      </div>

      {/* Edit Modal */}
      <NoteEditModal
        key={modalState.key}
        open={modalState.open}
        note={modalState.note}
        claimId={claimId}
        onClose={modalHandlers.close}
      />

      {/* Delete Dialog */}
      <NoteDeleteDialog
        open={deleteState.open}
        note={deleteState.note}
        isDeleting={deleteState.isDeleting}
        onConfirm={deleteHandlers.confirmDelete}
        onCancel={deleteHandlers.cancelDelete}
      />
    </div>
  );
}
