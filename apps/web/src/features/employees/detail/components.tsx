import { useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import type { Employee } from "shared";
import {
  LoadingScreen,
  Button,
  StatusBadge,
  FieldSection,
} from "@/components/ui";
import { DetailHeader } from "@/components/patterns";
import { formatDate } from "@/lib/formatting";
import { ACTIVE_STYLES, ACTIVE_LABELS } from "../shared";
import { useEmployeeDetail } from "./hooks";
import { EmployeeEditModal } from "./employee-edit.components";
import type { ModalState } from "./types";

// =============================================================================
// EmployeeDetailHeader
// =============================================================================

export interface EmployeeDetailHeaderProps {
  employee: Employee;
  onEdit: () => void;
}

export function EmployeeDetailHeader({
  employee,
  onEdit,
}: EmployeeDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/users" });
  };

  return (
    <DetailHeader>
      <DetailHeader.TopBar onBack={handleBack} backLabel="Volver a Usuarios">
        <Button variant="secondary" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </DetailHeader.TopBar>

      <DetailHeader.Main
        title={`${employee.firstName} ${employee.lastName}`}
        badge={
          <StatusBadge
            status={String(employee.isActive)}
            styles={ACTIVE_STYLES}
            labels={ACTIVE_LABELS}
          />
        }
      >
        <DetailHeader.InfoItem value={employee.email} />
        {employee.department && (
          <DetailHeader.InfoItem
            label="Departamento"
            value={employee.department}
          />
        )}
      </DetailHeader.Main>
    </DetailHeader>
  );
}

// =============================================================================
// EmployeeGeneralTab
// =============================================================================

export interface EmployeeGeneralTabProps {
  employee: Employee;
}

export function EmployeeGeneralTab({ employee }: EmployeeGeneralTabProps) {
  return (
    <div className="space-y-6">
      <FieldSection
        title="Informacion Personal"
        columns={2}
        fields={[
          { label: "Nombre", value: employee.firstName },
          { label: "Apellido", value: employee.lastName },
          { label: "Correo Electronico", value: employee.email },
          { label: "Telefono", value: employee.phone ?? "—" },
        ]}
      />

      <FieldSection
        title="Informacion Laboral"
        columns={2}
        fields={[
          { label: "Departamento", value: employee.department ?? "—" },
          { label: "Tiene Cuenta", value: employee.hasAccount ? "Si" : "No" },
        ]}
      />

      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Fecha de Creacion", value: formatDate(employee.createdAt) },
          {
            label: "Ultima Actualizacion",
            value: formatDate(employee.updatedAt),
          },
        ]}
      />
    </div>
  );
}

// =============================================================================
// EmployeeDetailLayout
// =============================================================================

export interface EmployeeDetailLayoutProps {
  employee: Employee;
  modalState: ModalState;
}

export function EmployeeDetailLayout({
  employee,
  modalState,
}: EmployeeDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <EmployeeDetailHeader
        employee={employee}
        onEdit={modalState.editModal.onOpen}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <EmployeeGeneralTab employee={employee} />
      </div>

      <EmployeeEditModal
        key={modalState.editModal.key}
        open={modalState.editModal.open}
        onClose={modalState.editModal.onClose}
        employee={employee}
      />
    </div>
  );
}

// =============================================================================
// EmployeeDetailView (Entry Point)
// =============================================================================

function EmployeeDetailError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">
          Error al cargar el empleado
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {error?.message ?? "No se encontro el empleado solicitado."}
        </p>
      </div>
    </div>
  );
}

export interface EmployeeDetailViewProps {
  employeeId: string;
}

export function EmployeeDetailView({ employeeId }: EmployeeDetailViewProps) {
  const detail = useEmployeeDetail(employeeId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.employee) {
    return <EmployeeDetailError error={detail.error} />;
  }

  return (
    <EmployeeDetailLayout
      employee={detail.employee}
      modalState={detail.modalState}
    />
  );
}
