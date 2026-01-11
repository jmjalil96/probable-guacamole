import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  Button,
  FormField,
  Input,
  CurrencyInput,
  DataTable,
  DropdownMenu,
  Spinner,
  ErrorState,
} from "@/components/ui";
import { SectionHeader, DeleteDialog, EditModal } from "@/components/patterns";
import { useInvoicesTab, useInvoiceForm } from "./hooks";
import { invoiceColumns, invoiceColumnHelper } from "./columns";
import type {
  InvoicesTabHeaderProps,
  InvoicesTableProps,
  InvoiceRowActionsProps,
  InvoiceModalProps,
  InvoiceFormProps,
  InvoiceDeleteDialogProps,
  ClaimInvoicesTabProps,
} from "./types";

// =============================================================================
// InvoicesTabHeader
// =============================================================================

export function InvoicesTabHeader({ total, onAdd }: InvoicesTabHeaderProps) {
  return (
    <SectionHeader
      title="Facturas"
      variant="default"
      action={
        <>
          <span className="mr-4 font-mono text-sm text-text-muted">
            Total: <span className="font-semibold text-text">{total}</span>
          </span>
          <Button variant="primary" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Agregar Factura
          </Button>
        </>
      }
    />
  );
}

// =============================================================================
// InvoiceRowActions
// =============================================================================

export function InvoiceRowActions({
  invoice,
  onEdit,
  onDelete,
}: InvoiceRowActionsProps) {
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
          <DropdownMenu.Item onClick={() => onEdit(invoice)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item destructive onClick={() => onDelete(invoice)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}

// =============================================================================
// InvoicesTable
// =============================================================================

export function InvoicesTable({
  data,
  onEdit,
  onDelete,
  emptyState = "No hay facturas registradas.",
}: InvoicesTableProps) {
  // Combine static columns with actions column (requires callbacks)
  const columns = useMemo(
    () => [
      ...invoiceColumns,
      invoiceColumnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <InvoiceRowActions
            invoice={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      }),
    ],
    [onEdit, onDelete]
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
// InvoiceForm
// =============================================================================

export function InvoiceForm({ control, errors, onSubmit }: InvoiceFormProps) {
  return (
    <form id="invoice-form" onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Número de Factura"
        htmlFor="invoiceNumber"
        error={errors.invoiceNumber?.message}
        required
      >
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="INV-2024-001"
              error={!!errors.invoiceNumber}
              autoFocus
            />
          )}
        />
      </FormField>

      <FormField
        label="Proveedor"
        htmlFor="providerName"
        error={errors.providerName?.message}
        required
      >
        <Controller
          name="providerName"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Nombre del proveedor..."
              error={!!errors.providerName}
            />
          )}
        />
      </FormField>

      <FormField
        label="Monto"
        htmlFor="amountSubmitted"
        error={errors.amountSubmitted?.message}
        required
      >
        <Controller
          name="amountSubmitted"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!errors.amountSubmitted}
            />
          )}
        />
      </FormField>
    </form>
  );
}

// =============================================================================
// InvoiceModal
// =============================================================================

export function InvoiceModal({
  open,
  invoice,
  claimId,
  onClose,
}: InvoiceModalProps) {
  const form = useInvoiceForm(claimId, invoice, open, onClose);

  const isEditing = !!invoice;
  const title = isEditing ? "Editar Factura" : "Agregar Factura";

  return (
    <EditModal
      open={open}
      title={title}
      description={isEditing ? invoice.invoiceNumber : undefined}
      formId="invoice-form"
      isDirty={form.isDirty}
      isBusy={form.isBusy}
      error={form.formError}
      onClose={onClose}
      onClearError={form.clearFormError}
      submitLabel={isEditing ? "Guardar" : "Agregar"}
    >
      <InvoiceForm
        control={form.control}
        errors={form.errors}
        onSubmit={(e) => void form.handleSubmit(form.onSubmit)(e)}
      />
    </EditModal>
  );
}

// =============================================================================
// InvoiceDeleteDialog
// =============================================================================

export function InvoiceDeleteDialog({
  open,
  invoice,
  isDeleting,
  onConfirm,
  onCancel,
}: InvoiceDeleteDialogProps) {
  return (
    <DeleteDialog
      open={open}
      title="Eliminar Factura"
      description={
        <>
          ¿Está seguro que desea eliminar la factura{" "}
          <span className="font-semibold">{invoice?.invoiceNumber}</span>?
        </>
      }
      isDeleting={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// =============================================================================
// ClaimInvoicesTab (Entry Point)
// =============================================================================

export function ClaimInvoicesTab({ claimId }: ClaimInvoicesTabProps) {
  const {
    invoices,
    total,
    isLoading,
    isError,
    refetch,
    modalState,
    modalHandlers,
    deleteState,
    deleteHandlers,
  } = useInvoicesTab(claimId);

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
        message="Error al cargar las facturas. Intente nuevamente."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div>
      <InvoicesTabHeader total={total} onAdd={modalHandlers.openAdd} />

      <InvoicesTable
        data={invoices}
        onEdit={modalHandlers.openEdit}
        onDelete={deleteHandlers.openDelete}
      />

      <InvoiceModal
        key={modalState.key}
        open={modalState.open}
        invoice={modalState.invoice}
        claimId={claimId}
        onClose={modalHandlers.close}
      />

      <InvoiceDeleteDialog
        open={deleteState.open}
        invoice={deleteState.invoice}
        isDeleting={deleteState.isDeleting}
        onConfirm={deleteHandlers.confirmDelete}
        onCancel={deleteHandlers.cancelDelete}
      />
    </div>
  );
}
