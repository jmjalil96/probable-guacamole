import { useState, useCallback, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ClaimInvoice } from "shared";
import { toast } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatting";
import {
  useClaimInvoices,
  useCreateClaimInvoice,
  useUpdateClaimInvoice,
  useDeleteClaimInvoice,
} from "../../api";
import { extractFormError } from "../utils";
import { invoiceFormSchema, type InvoiceFormData } from "./schema";
import type {
  UseInvoicesTabReturn,
  UseInvoiceFormReturn,
  InvoiceModalState,
  InvoiceModalHandlers,
  InvoiceDeleteState,
  InvoiceDeleteHandlers,
  FormError,
} from "./types";

// =============================================================================
// useInvoiceModalState
// =============================================================================

interface UseInvoiceModalStateReturn {
  state: InvoiceModalState;
  handlers: InvoiceModalHandlers;
}

/**
 * Manages modal state for add/edit invoice.
 * Single responsibility: track modal open/close and current invoice.
 * Includes a key that increments on open to reset modal state via remounting.
 */
function useInvoiceModalState(): UseInvoiceModalStateReturn {
  const [state, setState] = useState<InvoiceModalState>({
    open: false,
    invoice: null,
    key: 0,
  });

  const openAdd = useCallback(() => {
    setState((prev) => ({ open: true, invoice: null, key: prev.key + 1 }));
  }, []);

  const openEdit = useCallback((invoice: ClaimInvoice) => {
    setState((prev) => ({ open: true, invoice, key: prev.key + 1 }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false, invoice: null }));
  }, []);

  return {
    state,
    handlers: { openAdd, openEdit, close },
  };
}

// =============================================================================
// useInvoiceDeleteState
// =============================================================================

interface UseInvoiceDeleteStateReturn {
  state: InvoiceDeleteState;
  handlers: InvoiceDeleteHandlers;
  setIsDeleting: (value: boolean) => void;
}

/**
 * Manages delete confirmation state for invoices.
 * Single responsibility: track delete dialog open/close and current invoice.
 */
function useInvoiceDeleteState(): UseInvoiceDeleteStateReturn {
  const [state, setState] = useState<InvoiceDeleteState>({
    open: false,
    invoice: null,
    isDeleting: false,
  });

  const openDelete = useCallback((invoice: ClaimInvoice) => {
    setState({ open: true, invoice, isDeleting: false });
  }, []);

  const cancelDelete = useCallback(() => {
    setState({ open: false, invoice: null, isDeleting: false });
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
// useInvoicesTab (Master Orchestration)
// =============================================================================

/**
 * Main orchestration hook for the invoices tab.
 * Composes smaller, focused hooks for each concern.
 */
export function useInvoicesTab(claimId: string): UseInvoicesTabReturn {
  // ---------------------------------------------------------------------------
  // 1. Data Fetching
  // ---------------------------------------------------------------------------
  const { data, isLoading, isError, refetch } = useClaimInvoices(claimId);

  // ---------------------------------------------------------------------------
  // 2. Compute Total
  // ---------------------------------------------------------------------------
  const total = useMemo(() => {
    if (!data?.data || data.data.length === 0) return formatCurrency("0");
    const sum = data.data.reduce(
      (acc, inv) => acc + parseFloat(inv.amountSubmitted || "0"),
      0
    );
    return formatCurrency(sum.toString());
  }, [data]);

  // ---------------------------------------------------------------------------
  // 3. Modal State (Add/Edit)
  // ---------------------------------------------------------------------------
  const modal = useInvoiceModalState();

  // ---------------------------------------------------------------------------
  // 4. Delete State
  // ---------------------------------------------------------------------------
  const deleteModal = useInvoiceDeleteState();
  const deleteMutation = useDeleteClaimInvoice();

  const confirmDelete = useCallback(() => {
    const invoice = deleteModal.state.invoice;
    if (!invoice) return;

    deleteModal.setIsDeleting(true);
    deleteMutation.mutate(
      {
        claimId,
        invoiceId: invoice.id,
      },
      {
        onSuccess: () => {
          toast.success("Factura eliminada");
          deleteModal.handlers.cancelDelete();
        },
        onError: () => {
          toast.error("Error al eliminar factura");
          deleteModal.setIsDeleting(false);
        },
      }
    );
  }, [claimId, deleteModal, deleteMutation]);

  // ---------------------------------------------------------------------------
  // 5. Return Composed Interface
  // ---------------------------------------------------------------------------
  return {
    // Data
    invoices: data?.data ?? [],
    total,
    isLoading,
    isError,
    refetch,

    // Add/Edit Modal
    modalState: modal.state,
    modalHandlers: modal.handlers,

    // Delete Dialog
    deleteState: deleteModal.state,
    deleteHandlers: {
      openDelete: deleteModal.handlers.openDelete,
      confirmDelete,
      cancelDelete: deleteModal.handlers.cancelDelete,
    },
  };
}

// =============================================================================
// useInvoiceForm
// =============================================================================

/**
 * Manages the invoice form state, validation, and submission.
 * Single responsibility: form state and submission.
 */
export function useInvoiceForm(
  claimId: string,
  invoice: ClaimInvoice | null,
  open: boolean,
  onSuccess: () => void
): UseInvoiceFormReturn {
  // ---------------------------------------------------------------------------
  // Form Setup
  // ---------------------------------------------------------------------------
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      providerName: "",
      amountSubmitted: "",
    },
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  // Reset form when modal opens or invoice changes
  useEffect(() => {
    if (open) {
      if (invoice) {
        reset({
          invoiceNumber: invoice.invoiceNumber,
          providerName: invoice.providerName,
          amountSubmitted: invoice.amountSubmitted,
        });
      } else {
        reset({
          invoiceNumber: "",
          providerName: "",
          amountSubmitted: "",
        });
      }
    }
  }, [open, invoice, reset]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createMutation = useCreateClaimInvoice();
  const updateMutation = useUpdateClaimInvoice();
  const isBusy =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  // ---------------------------------------------------------------------------
  // Submit Handler
  // ---------------------------------------------------------------------------
  const onSubmit = useCallback(
    async (data: InvoiceFormData) => {
      setFormError(null);

      try {
        if (invoice) {
          // Update existing invoice
          await updateMutation.mutateAsync({
            claimId,
            invoiceId: invoice.id,
            data: {
              invoiceNumber: data.invoiceNumber,
              providerName: data.providerName,
              amountSubmitted: data.amountSubmitted,
            },
          });
          toast.success("Factura actualizada");
        } else {
          // Create new invoice
          await createMutation.mutateAsync({
            claimId,
            data: {
              invoiceNumber: data.invoiceNumber,
              providerName: data.providerName,
              amountSubmitted: data.amountSubmitted,
            },
          });
          toast.success("Factura creada");
        }
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [claimId, invoice, createMutation, updateMutation, onSuccess]
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
