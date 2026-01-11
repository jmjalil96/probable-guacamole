import { useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import type { Agent } from "shared";
import {
  LoadingScreen,
  Button,
  StatusBadge,
  Tabs,
  type TabOption,
  FieldSection,
} from "@/components/ui";
import { DetailHeader } from "@/components/patterns";
import { formatDate } from "@/lib/formatting";
import { ACTIVE_STYLES, ACTIVE_LABELS } from "../shared";
import { useAgentDetail } from "./hooks";
import { AgentEditModal } from "./agent-edit.components";
import { AgentClientsTab } from "./clients";
import type { AgentDetailTab, TabState, ModalState } from "./types";

// =============================================================================
// AgentDetailTabs
// =============================================================================

const TAB_LABELS: Record<AgentDetailTab, string> = {
  general: "General",
  clients: "Clientes",
};

export interface AgentDetailTabsProps {
  value: AgentDetailTab;
  onChange: (value: AgentDetailTab) => void;
  clientsCount?: number;
  className?: string;
}

export function AgentDetailTabs({
  value,
  onChange,
  clientsCount,
  className,
}: AgentDetailTabsProps) {
  const options: TabOption<AgentDetailTab>[] = [
    { value: "general", label: TAB_LABELS.general },
    { value: "clients", label: TAB_LABELS.clients, count: clientsCount },
  ];

  return (
    <Tabs<AgentDetailTab>
      value={value}
      onChange={onChange}
      options={options}
      className={className}
    />
  );
}

// =============================================================================
// AgentDetailHeader
// =============================================================================

export interface AgentDetailHeaderProps {
  agent: Agent;
  onEdit: () => void;
}

export function AgentDetailHeader({ agent, onEdit }: AgentDetailHeaderProps) {
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
        title={`${agent.firstName} ${agent.lastName}`}
        badge={
          <StatusBadge
            status={String(agent.isActive)}
            styles={ACTIVE_STYLES}
            labels={ACTIVE_LABELS}
          />
        }
      >
        <DetailHeader.InfoItem value={agent.email} />
        {agent.agencyName && (
          <DetailHeader.InfoItem label="Agencia" value={agent.agencyName} />
        )}
        {agent.licenseNumber && (
          <DetailHeader.InfoItem
            label="Licencia"
            value={agent.licenseNumber}
          />
        )}
      </DetailHeader.Main>
    </DetailHeader>
  );
}

// =============================================================================
// AgentGeneralTab
// =============================================================================

export interface AgentGeneralTabProps {
  agent: Agent;
}

export function AgentGeneralTab({ agent }: AgentGeneralTabProps) {
  return (
    <div className="space-y-6">
      <FieldSection
        title="Informacion Personal"
        columns={2}
        fields={[
          { label: "Nombre", value: agent.firstName },
          { label: "Apellido", value: agent.lastName },
          { label: "Correo Electronico", value: agent.email },
          { label: "Telefono", value: agent.phone ?? "—" },
        ]}
      />

      <FieldSection
        title="Informacion Profesional"
        columns={2}
        fields={[
          { label: "Numero de Licencia", value: agent.licenseNumber ?? "—" },
          { label: "Agencia", value: agent.agencyName ?? "—" },
        ]}
      />

      <FieldSection
        title="Cuenta"
        columns={2}
        fields={[
          { label: "Tiene Cuenta", value: agent.hasAccount ? "Si" : "No" },
          { label: "Clientes Asignados", value: agent.clientCount.toString() },
        ]}
      />

      <FieldSection
        title="Metadatos"
        columns={2}
        fields={[
          { label: "Fecha de Creacion", value: formatDate(agent.createdAt) },
          {
            label: "Ultima Actualizacion",
            value: formatDate(agent.updatedAt),
          },
        ]}
      />
    </div>
  );
}

// =============================================================================
// AgentDetailLayout
// =============================================================================

export interface AgentDetailLayoutProps {
  agent: Agent;
  tabState: TabState;
  modalState: ModalState;
}

export function AgentDetailLayout({
  agent,
  tabState,
  modalState,
}: AgentDetailLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <AgentDetailHeader agent={agent} onEdit={modalState.editModal.onOpen} />

      <AgentDetailTabs
        value={tabState.activeTab}
        onChange={tabState.setActiveTab}
        clientsCount={agent.clientCount}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {tabState.activeTab === "general" && <AgentGeneralTab agent={agent} />}
        {tabState.activeTab === "clients" && (
          <AgentClientsTab agentId={agent.id} />
        )}
      </div>

      <AgentEditModal
        key={modalState.editModal.key}
        open={modalState.editModal.open}
        onClose={modalState.editModal.onClose}
        agent={agent}
      />
    </div>
  );
}

// =============================================================================
// AgentDetailView (Entry Point)
// =============================================================================

function AgentDetailError({ error }: { error: Error | null }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text">
          Error al cargar el agente
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {error?.message ?? "No se encontro el agente solicitado."}
        </p>
      </div>
    </div>
  );
}

export interface AgentDetailViewProps {
  agentId: string;
}

export function AgentDetailView({ agentId }: AgentDetailViewProps) {
  const detail = useAgentDetail(agentId);

  if (detail.isLoading) {
    return <LoadingScreen />;
  }

  if (detail.isError || !detail.agent) {
    return <AgentDetailError error={detail.error} />;
  }

  return (
    <AgentDetailLayout
      agent={detail.agent}
      tabState={detail.tabState}
      modalState={detail.modalState}
    />
  );
}
