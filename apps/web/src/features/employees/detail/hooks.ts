import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Employee } from "shared";
import { useOpenState } from "@/lib/hooks";
import { toast } from "@/lib/utils";
import { useEmployee, useUpdateEmployee } from "../api";
import { employeeFormSchema, type EmployeeFormData } from "./schema";
import {
  extractFormError,
  mapEmployeeToFormValues,
  mapFormToRequest,
} from "./utils";
import type {
  UseEmployeeDetailReturn,
  UseEmployeeFormReturn,
  FormError,
  ModalState,
} from "./types";

// =============================================================================
// useModalState
// =============================================================================

export function useModalState(): ModalState {
  const editModal = useOpenState();
  return { editModal };
}

// =============================================================================
// useEmployeeForm
// =============================================================================

export function useEmployeeForm(
  employee: Employee,
  open: boolean,
  onSuccess: () => void
): UseEmployeeFormReturn {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: mapEmployeeToFormValues(employee),
  });

  const [formError, setFormError] = useState<FormError | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  useEffect(() => {
    if (open) {
      reset(mapEmployeeToFormValues(employee));
    }
  }, [open, employee, reset]);

  const updateEmployee = useUpdateEmployee();
  const isBusy = isSubmitting || updateEmployee.isPending;

  const onSubmit = useCallback(
    async (data: EmployeeFormData) => {
      setFormError(null);

      try {
        const request = mapFormToRequest(data, employee);

        if (Object.keys(request).length === 0) {
          toast.info("Sin cambios", {
            description: "No se detectaron cambios para guardar.",
          });
          onSuccess();
          return;
        }

        await updateEmployee.mutateAsync({ id: employee.id, data: request });
        toast.success("Empleado actualizado");
        onSuccess();
      } catch (error) {
        const formErrorObj = extractFormError(error as Error);
        setFormError(formErrorObj);
        toast.error(formErrorObj.title);
      }
    },
    [employee, updateEmployee, onSuccess]
  );

  return {
    control,
    handleSubmit,
    errors,
    isDirty,
    isBusy,
    formError,
    clearFormError,
    onSubmit,
  };
}

// =============================================================================
// useEmployeeDetail (Master Orchestration)
// =============================================================================

export function useEmployeeDetail(employeeId: string): UseEmployeeDetailReturn {
  // 1. Data Fetching
  const { data: employee, isLoading, isError, error } = useEmployee(employeeId);

  // 2. Modal State
  const modalState = useModalState();

  // 3. Navigation
  const navigate = useNavigate();

  const navigateBack = useCallback(() => {
    void navigate({ to: "/users" });
  }, [navigate]);

  return {
    employee,
    isLoading,
    isError,
    error,
    modalState,
    navigateBack,
  };
}
