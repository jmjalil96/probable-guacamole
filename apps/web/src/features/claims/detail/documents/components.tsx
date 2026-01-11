import { useMemo, useCallback } from "react";
import { Download, Trash2, MoreVertical, Upload } from "lucide-react";
import {
  Button,
  Modal,
  DataTable,
  DropdownMenu,
  Spinner,
  ErrorState,
} from "@/components/ui";
import { SectionHeader, DeleteDialog } from "@/components/patterns";
import { FileUploader } from "@/components/file-uploader";
import { useExitConfirmation } from "@/lib/hooks";
import { useDocumentsTab, useDocumentUpload } from "./hooks";
import { documentColumns, documentColumnHelper } from "./columns";
import type {
  DocumentsTabHeaderProps,
  DocumentsTableProps,
  DocumentRowActionsProps,
  DocumentUploadModalProps,
  DocumentDeleteDialogProps,
  ClaimDocumentsTabProps,
} from "./types";

// =============================================================================
// DocumentsTabHeader
// =============================================================================

export function DocumentsTabHeader({
  count,
  onUpload,
}: DocumentsTabHeaderProps) {
  return (
    <SectionHeader
      title="Documentos"
      count={count}
      variant="default"
      action={
        <Button variant="primary" onClick={onUpload}>
          <Upload className="h-4 w-4" />
          Subir Documento
        </Button>
      }
    />
  );
}

// =============================================================================
// DocumentRowActions
// =============================================================================

export function DocumentRowActions({
  document,
  onDownload,
  onDelete,
}: DocumentRowActionsProps) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-border hover:text-text"
            data-row-nav="ignore"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onClick={() => onDownload(document)}>
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item destructive onClick={() => onDelete(document)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}

// =============================================================================
// DocumentsTable
// =============================================================================

export function DocumentsTable({
  data,
  onDownload,
  onDelete,
  emptyState = "No hay documentos registrados.",
}: DocumentsTableProps) {
  // Combine static columns with actions column (requires callbacks)
  const columns = useMemo(
    () => [
      ...documentColumns,
      documentColumnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <DocumentRowActions
            document={row.original}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ),
      }),
    ],
    [onDownload, onDelete]
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      emptyState={emptyState}
    />
  );
}

// =============================================================================
// DocumentUploadModal
// =============================================================================

export function DocumentUploadModal({
  open,
  claimId,
  onClose,
}: DocumentUploadModalProps) {
  const upload = useDocumentUpload({
    claimId,
    onSuccess: onClose,
  });

  const handleClose = useCallback(() => {
    upload.clearFiles();
    onClose();
  }, [upload, onClose]);

  const {
    showDialog: showExitDialog,
    requestExit,
    confirmExit,
    cancelExit,
  } = useExitConfirmation({
    isDirty: upload.files.length > 0,
    hasFiles: true,
    onExit: handleClose,
  });

  return (
    <>
      <Modal open={open} onClose={requestExit}>
        <Modal.Panel size="lg">
          <Modal.Header>
            <Modal.Title>Subir Documento</Modal.Title>
            <Modal.Description>
              Seleccione una categoría y arrastre los archivos a subir
            </Modal.Description>
          </Modal.Header>

          <Modal.Body>
            <FileUploader
              files={upload.files}
              onAddFiles={upload.addFiles}
              onRemoveFile={upload.removeFile}
              onRetryFile={upload.retryFile}
              selectedCategory={upload.selectedCategory}
              onCategoryChange={upload.setSelectedCategory}
              categories={upload.categories}
              categoryIcons={upload.categoryIcons}
              maxFiles={upload.maxFiles}
              disabled={upload.isUploading}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={requestExit}
              disabled={upload.isUploading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleClose}
              disabled={upload.isUploading || upload.files.length === 0}
              loading={upload.isUploading}
            >
              {upload.allCompleted ? "Cerrar" : "Subiendo..."}
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>

      <Modal open={showExitDialog} onClose={cancelExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>¿Descartar archivos?</Modal.Title>
            <Modal.Description>
              Tiene archivos pendientes que se perderán.
            </Modal.Description>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="ghost" onClick={cancelExit}>
              Seguir subiendo
            </Button>
            <Button variant="destructive" onClick={confirmExit}>
              Descartar
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>
    </>
  );
}

// =============================================================================
// DocumentDeleteDialog
// =============================================================================

export function DocumentDeleteDialog({
  open,
  document,
  isDeleting,
  onConfirm,
  onCancel,
}: DocumentDeleteDialogProps) {
  return (
    <DeleteDialog
      open={open}
      title="Eliminar Documento"
      description={
        <>
          ¿Está seguro que desea eliminar el documento{" "}
          <span className="font-semibold">{document?.fileName}</span>?
        </>
      }
      isDeleting={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// =============================================================================
// ClaimDocumentsTab (Entry Point)
// =============================================================================

export function ClaimDocumentsTab({ claimId }: ClaimDocumentsTabProps) {
  const {
    documents,
    isLoading,
    isError,
    refetch,
    modalState,
    modalHandlers,
    deleteState,
    deleteHandlers,
    downloadDocument,
  } = useDocumentsTab(claimId);

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
        message="Error al cargar los documentos. Intente nuevamente."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div>
      <DocumentsTabHeader
        count={documents.length}
        onUpload={modalHandlers.open}
      />

      <DocumentsTable
        data={documents}
        onDownload={(doc) => void downloadDocument(doc)}
        onDelete={deleteHandlers.openDelete}
      />

      <DocumentUploadModal
        key={modalState.key}
        open={modalState.open}
        claimId={claimId}
        onClose={modalHandlers.close}
      />

      <DocumentDeleteDialog
        open={deleteState.open}
        document={deleteState.document}
        isDeleting={deleteState.isDeleting}
        onConfirm={deleteHandlers.confirmDelete}
        onCancel={deleteHandlers.cancelDelete}
      />
    </div>
  );
}
