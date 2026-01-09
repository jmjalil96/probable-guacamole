import type { ReactNode } from "react";
import { Modal, Button, Alert, type AlertProps } from "@/components/ui";
import { useExitConfirmation } from "@/lib/hooks";

export interface EditModalProps {
  open: boolean;
  title: string;
  description?: string | undefined;
  formId: string;
  isDirty: boolean;
  isBusy: boolean;
  error?: Pick<AlertProps, "title" | "description" | "items"> | null;
  onClose: () => void;
  onClearError?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
}

export function EditModal({
  open,
  title,
  description,
  formId,
  isDirty,
  isBusy,
  error,
  onClose,
  onClearError,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  children,
}: EditModalProps) {
  const {
    showDialog: showExitDialog,
    requestExit,
    confirmExit,
    cancelExit,
  } = useExitConfirmation({
    isDirty,
    hasFiles: false,
    onExit: onClose,
  });

  return (
    <>
      <Modal open={open} onClose={requestExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
            {description && (
              <Modal.Description>{description}</Modal.Description>
            )}
          </Modal.Header>

          <Modal.Body>
            {error && (
              <Alert
                variant="error"
                title={error.title}
                description={error.description}
                items={error.items}
                onDismiss={onClearError}
                className="mb-4"
              />
            )}
            {children}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="ghost" onClick={requestExit} disabled={isBusy}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="primary"
              loading={isBusy}
              disabled={!isDirty || isBusy}
            >
              {submitLabel}
            </Button>
          </Modal.Footer>
        </Modal.Panel>
      </Modal>

      <Modal open={showExitDialog} onClose={cancelExit}>
        <Modal.Panel size="md">
          <Modal.Header>
            <Modal.Title>¿Descartar cambios?</Modal.Title>
            <Modal.Description>
              Tiene cambios sin guardar que se perderán.
            </Modal.Description>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="ghost" onClick={cancelExit}>
              Seguir editando
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
