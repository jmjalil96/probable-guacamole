import type { ReactNode } from "react";
import { AlertDialog, Button } from "@/components/ui";

export interface DeleteDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  itemPreview?: string | undefined;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function DeleteDialog({
  open,
  title,
  description,
  itemPreview,
  isDeleting,
  onConfirm,
  onCancel,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onClose={onCancel}>
      <AlertDialog.Panel>
        <AlertDialog.Icon variant="danger" />
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>
          {description}
          {itemPreview && (
            <>
              <br />
              <span className="mt-2 block text-text-muted">
                &ldquo;{itemPreview}&rdquo;
              </span>
            </>
          )}
          <br />
          Esta acción no se puede deshacer.
        </AlertDialog.Description>
        <AlertDialog.Actions>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={isDeleting}
          >
            {confirmLabel}
          </Button>
        </AlertDialog.Actions>
      </AlertDialog.Panel>
    </AlertDialog>
  );
}
