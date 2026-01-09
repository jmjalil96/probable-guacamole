import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  Input,
  PasswordInput,
  FormField,
  Logo,
  SearchableSelect,
  SearchInput,
  Select,
  MultiSelect,
  DateRangePicker,
  Combobox,
  type DateRange,
  type ComboboxOption,
  ListHeader,
  FilterBar,
  FilterChip,
  Checkbox,
  DataTable,
  createColumnHelper,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
  Sheet,
  Modal,
  Textarea,
  StatusBadge,
  Tabs,
  DropdownMenu,
  FieldSection,
} from "@/components/ui";
import { DetailHeader, WorkflowStepper } from "@/components/patterns";
import { FileUploader, type UploadingFile } from "@/components/file-uploader";
import { CLAIM_FILE_CATEGORIES, CLAIM_CATEGORY_ICONS } from "@/features/claims";
import {
  ArrowRight,
  Mail,
  Plus,
  RotateCw,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { STATUS_STYLES, STATUS_LABELS } from "@/features/claims";
import type { ClaimStatus } from "shared";

// Mock data for DataTable
interface DemoRow {
  id: string;
  name: string;
  status: "active" | "pending" | "inactive";
  amount: number;
  date: string;
}

const DEMO_TABLE_DATA: DemoRow[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    status: "active",
    amount: 12500,
    date: "Dec 18, 2024",
  },
  {
    id: "2",
    name: "James Rodriguez",
    status: "pending",
    amount: 8750,
    date: "Dec 15, 2024",
  },
  {
    id: "3",
    name: "Emily Chen",
    status: "inactive",
    amount: 23000,
    date: "Dec 12, 2024",
  },
  {
    id: "4",
    name: "Michael Foster",
    status: "active",
    amount: 5200,
    date: "Dec 10, 2024",
  },
  {
    id: "5",
    name: "Amanda Peters",
    status: "pending",
    amount: 15800,
    date: "Dec 8, 2024",
  },
];

const columnHelper = createColumnHelper<DemoRow>();

const demoColumns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => <DataTable.SelectAll table={table} />,
    cell: ({ row }) => <DataTable.SelectRow row={row} />,
    enableSorting: false,
  }),
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      const colors = {
        active: "bg-success-light text-success",
        pending: "bg-warning-light text-warning",
        inactive: "bg-gray-100 text-text-muted",
      };
      return (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}
        >
          {status}
        </span>
      );
    },
  }),
  columnHelper.accessor("amount", {
    header: "Amount",
    cell: (info) => (
      <span className="font-medium tabular-nums">
        ${info.getValue().toLocaleString()}
      </span>
    ),
  }),
  columnHelper.accessor("date", {
    header: "Date",
  }),
];

// Mock files to show different states
const MOCK_FILES: UploadingFile<import("shared").ClaimFileCategory>[] = [
  {
    id: "1",
    file: new File([""], "factura-001.pdf", { type: "application/pdf" }),
    status: "success",
    progress: 100,
    category: "invoice",
  },
  {
    id: "2",
    file: new File([""], "receta-medica.jpg", { type: "image/jpeg" }),
    status: "uploading",
    progress: 65,
    category: "prescription",
  },
  {
    id: "3",
    file: new File([""], "documento-invalido.exe", {
      type: "application/octet-stream",
    }),
    status: "error",
    progress: 0,
    error: "Tipo de archivo no permitido",
    category: "other",
  },
];

const DEMO_CLIENTS = [
  { value: "1", label: "Acme Corporation" },
  { value: "2", label: "Globex Industries" },
  { value: "3", label: "Stark Enterprises" },
  { value: "4", label: "Wayne Industries" },
  { value: "5", label: "Umbrella Corp" },
];

const DEMO_PATIENTS = [
  { value: "1", label: "Juan Perez", description: "Titular" },
  { value: "2", label: "Maria Perez", description: "Esposa" },
  { value: "3", label: "Carlos Perez", description: "Hijo" },
];

export const Route = createFileRoute("/test")({
  component: TestPage,
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TestPage() {
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectLoading, setSelectLoading] = useState(false);
  const [mockFiles, setMockFiles] =
    useState<UploadingFile<import("shared").ClaimFileCategory>[]>(MOCK_FILES);
  const [emptyFiles, setEmptyFiles] = useState<
    UploadingFile<import("shared").ClaimFileCategory>[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<
    import("shared").ClaimFileCategory | null
  >("invoice");

  // DataTable state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 3,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // SearchInput state
  const [searchValue, setSearchValue] = useState("");

  // Select state
  const [selectValue, setSelectValue] = useState("");

  // MultiSelect state
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);

  // DateRangePicker state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Combobox state
  const [comboboxValue, setComboboxValue] = useState<ComboboxOption | null>(
    null
  );

  // Error banner demo state
  const [showError, setShowError] = useState(true);

  // Sheet state
  const [sheetRightOpen, setSheetRightOpen] = useState(false);
  const [sheetLeftOpen, setSheetLeftOpen] = useState(false);
  const [sheetBottomOpen, setSheetBottomOpen] = useState(false);
  const [sheetTopOpen, setSheetTopOpen] = useState(false);

  // Modal state
  const [modalSmOpen, setModalSmOpen] = useState(false);
  const [modalMdOpen, setModalMdOpen] = useState(false);
  const [modalLgOpen, setModalLgOpen] = useState(false);
  const [modalReason, setModalReason] = useState("");

  // Tabs state
  type DemoTab = "overview" | "details" | "files" | "history";
  const [activeTab, setActiveTab] = useState<DemoTab>("overview");

  // WorkflowStepper state
  type DemoWorkflowStatus =
    | "DRAFT"
    | "IN_REVIEW"
    | "SUBMITTED"
    | "SETTLED"
    | "CANCELLED";
  const [workflowStatus, setWorkflowStatus] =
    useState<DemoWorkflowStatus>("IN_REVIEW");

  // Mock async search function for Combobox demo
  const mockAsyncSearch = async (query: string): Promise<ComboboxOption[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const allOptions = [
      { value: "1", label: "John Smith" },
      { value: "2", label: "Jane Doe" },
      { value: "3", label: "Bob Wilson" },
      { value: "4", label: "Alice Brown" },
      { value: "5", label: "Charlie Davis" },
    ];
    return allOptions.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-2xl font-semibold text-text">Components</h1>

        {/* SHEET */}
        <Section title="Sheet">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setSheetRightOpen(true)}>
              Panel Derecho (default)
            </Button>
            <Button variant="secondary" onClick={() => setSheetLeftOpen(true)}>
              Panel Izquierdo
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSheetBottomOpen(true)}
            >
              Panel Inferior
            </Button>
            <Button variant="secondary" onClick={() => setSheetTopOpen(true)}>
              Panel Superior
            </Button>
          </div>

          {/* Right Sheet - Edit form example */}
          <Sheet open={sheetRightOpen} onClose={setSheetRightOpen}>
            <Sheet.Panel side="right" size="md">
              <Sheet.Header>
                <Sheet.Title>Editar Usuario</Sheet.Title>
                <Sheet.Description>
                  Actualiza los datos del usuario
                </Sheet.Description>
              </Sheet.Header>
              <Sheet.Body className="space-y-4">
                <FormField label="Nombre" htmlFor="sheet-name">
                  <Input id="sheet-name" placeholder="Juan Pérez" />
                </FormField>
                <FormField label="Email" htmlFor="sheet-email">
                  <Input
                    id="sheet-email"
                    type="email"
                    placeholder="juan@empresa.com"
                  />
                </FormField>
                <FormField label="Rol" htmlFor="sheet-role">
                  <Select
                    options={[
                      { value: "admin", label: "Administrador" },
                      { value: "user", label: "Usuario" },
                      { value: "viewer", label: "Visualizador" },
                    ]}
                    value=""
                    onChange={() => {}}
                    placeholder="Seleccionar rol..."
                  />
                </FormField>
              </Sheet.Body>
              <Sheet.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setSheetRightOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={() => setSheetRightOpen(false)}>
                  Guardar
                </Button>
              </Sheet.Footer>
            </Sheet.Panel>
          </Sheet>

          {/* Left Sheet - Navigation example */}
          <Sheet open={sheetLeftOpen} onClose={setSheetLeftOpen}>
            <Sheet.Panel side="left" size="sm">
              <Sheet.Header>
                <Sheet.Title>Navegación</Sheet.Title>
              </Sheet.Header>
              <Sheet.Body className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Reclamos
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Pacientes
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Reportes
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Configuración
                </Button>
              </Sheet.Body>
            </Sheet.Panel>
          </Sheet>

          {/* Bottom Sheet - Mobile filters example */}
          <Sheet open={sheetBottomOpen} onClose={setSheetBottomOpen}>
            <Sheet.Panel side="bottom" size="md">
              <Sheet.Header>
                <Sheet.Title>Filtros</Sheet.Title>
              </Sheet.Header>
              <Sheet.Body className="space-y-4">
                <FormField label="Estado" htmlFor="sheet-status">
                  <MultiSelect
                    options={[
                      { value: "draft", label: "Borrador" },
                      { value: "submitted", label: "Enviado" },
                      { value: "in_review", label: "En Revisión" },
                      { value: "settled", label: "Liquidado" },
                    ]}
                    value={multiSelectValue}
                    onChange={setMultiSelectValue}
                    placeholder="Seleccionar estados..."
                  />
                </FormField>
                <FormField label="Tipo de Atención" htmlFor="sheet-care">
                  <Select
                    options={[
                      { value: "ambulatory", label: "Ambulatorio" },
                      { value: "hospitalary", label: "Hospitalario" },
                    ]}
                    value=""
                    onChange={() => {}}
                    placeholder="Seleccionar tipo..."
                  />
                </FormField>
                <FormField label="Fecha de Envío" htmlFor="sheet-date">
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Seleccionar rango..."
                  />
                </FormField>
              </Sheet.Body>
              <Sheet.Footer>
                <Button
                  variant="ghost"
                  onClick={() => setSheetBottomOpen(false)}
                >
                  Limpiar
                </Button>
                <Button onClick={() => setSheetBottomOpen(false)}>
                  Aplicar Filtros
                </Button>
              </Sheet.Footer>
            </Sheet.Panel>
          </Sheet>

          {/* Top Sheet - Notification/alert example */}
          <Sheet open={sheetTopOpen} onClose={setSheetTopOpen}>
            <Sheet.Panel side="top" size="sm">
              <Sheet.Header>
                <Sheet.Title>Notificaciones</Sheet.Title>
              </Sheet.Header>
              <Sheet.Body>
                <div className="space-y-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                    Nuevo reclamo #12345 requiere revisión
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    Reclamo #12340 ha sido liquidado
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    3 reclamos pendientes de información
                  </div>
                </div>
              </Sheet.Body>
            </Sheet.Panel>
          </Sheet>
        </Section>

        {/* MODAL */}
        <Section title="Modal">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setModalSmOpen(true)}>size="sm"</Button>
            <Button variant="secondary" onClick={() => setModalMdOpen(true)}>
              size="md" (default)
            </Button>
            <Button variant="secondary" onClick={() => setModalLgOpen(true)}>
              size="lg"
            </Button>
          </div>

          {/* Small Modal - Simple confirmation with input */}
          <Modal open={modalSmOpen} onClose={setModalSmOpen}>
            <Modal.Panel size="sm">
              <Modal.Header>
                <Modal.Title>Cancelar Reclamo</Modal.Title>
                <Modal.Description>
                  Esta acción no se puede deshacer.
                </Modal.Description>
              </Modal.Header>
              <Modal.Body>
                <FormField
                  label="Motivo de cancelación"
                  htmlFor="modal-reason-sm"
                >
                  <Textarea
                    id="modal-reason-sm"
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="Ingrese el motivo..."
                    rows={3}
                  />
                </FormField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setModalSmOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    alert(`Reason: ${modalReason}`);
                    setModalSmOpen(false);
                  }}
                >
                  Confirmar
                </Button>
              </Modal.Footer>
            </Modal.Panel>
          </Modal>

          {/* Medium Modal - Transition reason */}
          <Modal open={modalMdOpen} onClose={setModalMdOpen}>
            <Modal.Panel size="md">
              <Modal.Header>
                <Modal.Title>Solicitar Información</Modal.Title>
                <Modal.Description>
                  El reclamo quedará en estado "Pendiente de Información" hasta
                  que el cliente responda.
                </Modal.Description>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <FormField label="Información requerida" htmlFor="modal-info">
                  <Textarea
                    id="modal-info"
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="Describa la información que necesita del cliente..."
                    rows={4}
                  />
                </FormField>
                <FormField label="Prioridad" htmlFor="modal-priority">
                  <Select
                    options={[
                      { value: "low", label: "Baja" },
                      { value: "medium", label: "Media" },
                      { value: "high", label: "Alta" },
                    ]}
                    value="medium"
                    onChange={() => {}}
                  />
                </FormField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setModalMdOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    alert("Request sent!");
                    setModalMdOpen(false);
                  }}
                >
                  Enviar Solicitud
                </Button>
              </Modal.Footer>
            </Modal.Panel>
          </Modal>

          {/* Large Modal - Edit form */}
          <Modal open={modalLgOpen} onClose={setModalLgOpen}>
            <Modal.Panel size="lg">
              <Modal.Header>
                <Modal.Title>Editar Reclamo #12345</Modal.Title>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Tipo de Atención" htmlFor="modal-care">
                    <Select
                      options={[
                        { value: "ambulatory", label: "Ambulatorio" },
                        { value: "hospitalary", label: "Hospitalario" },
                      ]}
                      value="ambulatory"
                      onChange={() => {}}
                    />
                  </FormField>
                  <FormField label="Diagnóstico" htmlFor="modal-diagnosis">
                    <Input
                      id="modal-diagnosis"
                      defaultValue="Consulta general"
                    />
                  </FormField>
                </div>
                <FormField label="Descripción" htmlFor="modal-desc">
                  <Textarea
                    id="modal-desc"
                    defaultValue="Consulta médica de rutina con especialista."
                    rows={3}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Monto Enviado" htmlFor="modal-amount">
                    <Input id="modal-amount" defaultValue="$12,500.00" />
                  </FormField>
                  <FormField label="Fecha de Incidente" htmlFor="modal-date">
                    <Input
                      id="modal-date"
                      type="date"
                      defaultValue="2024-12-15"
                    />
                  </FormField>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setModalLgOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    alert("Saved!");
                    setModalLgOpen(false);
                  }}
                >
                  Guardar Cambios
                </Button>
              </Modal.Footer>
            </Modal.Panel>
          </Modal>
        </Section>

        {/* DETAIL HEADER */}
        <Section title="DetailHeader">
          <div className="-mx-6 border border-border rounded-lg overflow-hidden">
            <DetailHeader>
              <DetailHeader.TopBar
                onBack={() => alert("Back clicked")}
                backLabel="Volver a Reclamos"
              >
                <Button variant="secondary">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="primary">
                  Cambiar Estado
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DetailHeader.TopBar>
              <DetailHeader.Main
                title="#12345"
                badge={
                  <StatusBadge<ClaimStatus>
                    status="IN_REVIEW"
                    styles={STATUS_STYLES}
                    labels={STATUS_LABELS}
                  />
                }
              >
                <DetailHeader.InfoItem value="Sarah Mitchell" />
                <DetailHeader.InfoItem label="Enviado" value="Dec 18, 2024" />
                <DetailHeader.InfoItem value="$12,500" />
                <DetailHeader.InfoItem label="Cliente" value="Acme Corp" />
              </DetailHeader.Main>
            </DetailHeader>
          </div>
        </Section>

        {/* TABS */}
        <Section title="Tabs">
          <div className="space-y-4">
            <div className="-mx-6 border border-border rounded-lg overflow-hidden">
              <Tabs<DemoTab>
                value={activeTab}
                onChange={setActiveTab}
                options={[
                  { value: "overview", label: "Overview" },
                  { value: "details", label: "Details", count: 5 },
                  { value: "files", label: "Files", count: 12 },
                  { value: "history", label: "History", count: 48 },
                ]}
              />
            </div>
            <p className="text-sm text-text-muted">
              Active tab:{" "}
              <span className="font-medium text-text">{activeTab}</span>
            </p>
          </div>
        </Section>

        {/* WORKFLOW STEPPER */}
        <Section title="WorkflowStepper">
          <div className="space-y-4">
            <WorkflowStepper<DemoWorkflowStatus>
              steps={[
                { id: "DRAFT", label: "Borrador" },
                { id: "IN_REVIEW", label: "En Revisión" },
                { id: "SUBMITTED", label: "Enviado" },
                { id: "SETTLED", label: "Liquidado" },
              ]}
              currentStatus={workflowStatus}
              transitions={{
                DRAFT: ["IN_REVIEW", "CANCELLED"],
                IN_REVIEW: ["SUBMITTED", "CANCELLED"],
                SUBMITTED: ["SETTLED", "CANCELLED"],
                SETTLED: [],
                CANCELLED: [],
              }}
              terminalStates={["SETTLED", "CANCELLED"]}
              onTransition={setWorkflowStatus}
              statusLabels={{
                DRAFT: "Borrador",
                IN_REVIEW: "En Revisión",
                SUBMITTED: "Enviado",
                SETTLED: "Liquidado",
                CANCELLED: "Cancelado",
              }}
              transitionLabels={{
                "DRAFT->IN_REVIEW": "Enviar a Revisión",
                "DRAFT->CANCELLED": "Cancelar",
                "IN_REVIEW->SUBMITTED": "Enviar Reclamo",
                "IN_REVIEW->CANCELLED": "Cancelar",
                "SUBMITTED->SETTLED": "Liquidar",
                "SUBMITTED->CANCELLED": "Cancelar",
              }}
              terminalVariants={{
                SETTLED: "success",
                CANCELLED: "error",
              }}
              cancelStatus="CANCELLED"
            />
            <p className="text-sm text-text-muted">
              Current status:{" "}
              <span className="font-medium text-text">{workflowStatus}</span>
              {" • "}
              <button
                type="button"
                onClick={() => setWorkflowStatus("DRAFT")}
                className="text-primary hover:underline"
              >
                Reset to Draft
              </button>
            </p>
          </div>
        </Section>

        {/* FIELD SECTION */}
        <Section title="FieldSection">
          <div className="space-y-4">
            <FieldSection
              title="Claim Details"
              columns={2}
              fields={[
                { label: "Claim Type", value: "Property Damage" },
                { label: "Category", value: "Auto" },
                { label: "Date of Loss", value: "Dec 15, 2024" },
                { label: "Date Reported", value: "Dec 18, 2024" },
                { label: "Policy Number", value: "POL-2024-001234" },
                { label: "Claim Amount", value: "$12,500.00" },
              ]}
            />
            <FieldSection
              title="Loss Details (with full-width description)"
              columns={2}
              fields={[
                { label: "Cause of Loss", value: "Vehicle Collision" },
                { label: "Location", value: "123 Main Street, City" },
                {
                  label: "Description",
                  value:
                    "Policyholder reports vehicle was rear-ended at a traffic light. Minor damage to rear bumper and trunk. No injuries reported. Police report filed.",
                  span: "full",
                },
                { label: "Estimated Damage", value: "$8,500.00" },
                { label: "Deductible", value: "$500.00" },
              ]}
            />
            <FieldSection
              title="Quick Stats (3 columns)"
              columns={3}
              fields={[
                { label: "Priority", value: "High" },
                {
                  label: "Status",
                  value: (
                    <StatusBadge<ClaimStatus>
                      status="IN_REVIEW"
                      styles={STATUS_STYLES}
                      labels={STATUS_LABELS}
                    />
                  ),
                },
                { label: "Assigned To", value: "Jane Smith" },
              ]}
            />
          </div>
        </Section>

        {/* DROPDOWN MENU */}
        <Section title="DropdownMenu">
          <div className="flex gap-4">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="secondary">
                  Actions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => alert("Edit clicked")}>
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => alert("Duplicate clicked")}>
                  Duplicate
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  destructive
                  onClick={() => alert("Delete clicked")}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </Section>

        {/* LIST HEADER */}
        <Section title="ListHeader">
          <div className="space-y-4 -mx-6 border border-border rounded-lg overflow-hidden">
            <ListHeader title="Claims" count={1234}>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Claim
              </Button>
            </ListHeader>
            <ListHeader title="Patients" />
            <ListHeader title="Invoices" count={42} />
          </div>
        </Section>

        {/* ERROR BANNER */}
        <Section title="Error Banner (API Error State)">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant={showError ? "primary" : "secondary"}
                onClick={() => setShowError(!showError)}
              >
                {showError ? "Hide Error" : "Show Error"}
              </Button>
              <span className="text-xs text-text-muted">
                Toggle to simulate API error state
              </span>
            </div>
            {showError && (
              <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>Failed to load claims. Please try again.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowError(false)}
                >
                  <RotateCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        </Section>

        {/* FILTER BAR */}
        <Section title="FilterBar & FilterChip">
          <div className="-mx-6 border border-border rounded-lg overflow-hidden">
            <FilterBar>
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search claims..."
              />
              <FilterBar.Divider />
              <FilterChip label="Status" value="Open" onRemove={() => {}} />
              <FilterChip label="Assigned to me" onRemove={() => {}} />
              <FilterChip label="Priority" value="High" />
              <FilterBar.Spacer />
              <Button variant="ghost" size="sm">
                Clear all
              </Button>
            </FilterBar>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <FilterChip
              label="With value"
              value="Example"
              onRemove={() => {}}
            />
            <FilterChip label="Label only" onRemove={() => {}} />
            <FilterChip label="No remove" value="Static" />
            <FilterChip label="Category" value="Invoice" />
          </div>
        </Section>

        {/* SEARCH INPUT */}
        <Section title="SearchInput">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Default</span>
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search claims..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">
                With value: "{searchValue || "type something"}"
              </span>
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Disabled</span>
              <SearchInput value="Cannot edit" onChange={() => {}} disabled />
            </div>
          </div>
        </Section>

        {/* SELECT */}
        <Section title="Select">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">
                size="sm" (filter bar)
              </span>
              <Select
                options={[
                  { value: "ambulatory", label: "Ambulatory" },
                  { value: "hospitalary", label: "Hospitalary" },
                  { value: "other", label: "Other" },
                ]}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Care type..."
                size="sm"
              />
            </div>
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">size="md" (form)</span>
              <Select
                options={[
                  { value: "asc", label: "Ascending" },
                  { value: "desc", label: "Descending" },
                ]}
                value="desc"
                onChange={() => {}}
                placeholder="Sort order"
                size="md"
              />
            </div>
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">Error state</span>
              <Select
                options={[{ value: "err", label: "Error Option" }]}
                value=""
                onChange={() => {}}
                placeholder="Select..."
                error
              />
            </div>
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">Disabled</span>
              <Select
                options={[{ value: "locked", label: "Locked Option" }]}
                value="locked"
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </Section>

        {/* MULTISELECT */}
        <Section title="MultiSelect">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">
                size="sm" (filter bar)
              </span>
              <MultiSelect
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "submitted", label: "Submitted" },
                  { value: "in_review", label: "In Review" },
                  { value: "pending_info", label: "Pending Info" },
                  { value: "settled", label: "Settled" },
                ]}
                value={multiSelectValue}
                onChange={setMultiSelectValue}
                placeholder="Status..."
                size="sm"
              />
            </div>
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">size="md" (form)</span>
              <MultiSelect
                options={[
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "critical", label: "Critical" },
                ]}
                value={multiSelectValue}
                onChange={setMultiSelectValue}
                placeholder="Severity..."
                size="md"
              />
            </div>
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">
                Selected: {multiSelectValue.length}
              </span>
              <MultiSelect
                options={[
                  { value: "a", label: "Option A" },
                  { value: "b", label: "Option B" },
                  { value: "c", label: "Option C" },
                ]}
                value={multiSelectValue}
                onChange={setMultiSelectValue}
                placeholder="Select..."
              />
            </div>
            <div className="w-48 space-y-1">
              <span className="text-xs text-text-muted">Disabled</span>
              <MultiSelect
                options={[{ value: "locked", label: "Locked" }]}
                value={["locked"]}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </Section>

        {/* DATE RANGE PICKER */}
        <Section title="DateRangePicker">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">
                Default (with presets)
              </span>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select dates..."
              />
            </div>
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">size="md" (form)</span>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select dates..."
                size="md"
              />
            </div>
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">
                Selected:{" "}
                {dateRange.from
                  ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString() ?? "..."}`
                  : "None"}
              </span>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </Section>

        {/* COMBOBOX */}
        <Section title="Combobox (Async Search)">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">
                size="sm" (filter bar)
              </span>
              <Combobox
                value={comboboxValue}
                onChange={setComboboxValue}
                onSearch={mockAsyncSearch}
                placeholder="Search clients..."
                size="sm"
              />
            </div>
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">size="md" (form)</span>
              <Combobox
                value={comboboxValue}
                onChange={setComboboxValue}
                onSearch={mockAsyncSearch}
                placeholder="Search clients..."
                size="md"
              />
            </div>
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">Error state</span>
              <Combobox
                value={null}
                onChange={() => {}}
                onSearch={mockAsyncSearch}
                placeholder="Search..."
                error
              />
            </div>
            <div className="w-64 space-y-1">
              <span className="text-xs text-text-muted">
                Selected: {comboboxValue?.label ?? "None"}
              </span>
              <Combobox
                value={comboboxValue}
                onChange={setComboboxValue}
                onSearch={mockAsyncSearch}
                placeholder="Type to search..."
              />
            </div>
          </div>
        </Section>

        {/* CHECKBOX */}
        <Section title="Checkbox">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">Unchecked</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm">Checked</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked="indeterminate" />
              <span className="text-sm">Indeterminate</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox disabled />
              <span className="text-sm text-text-muted">Disabled</span>
            </label>
          </div>
        </Section>

        {/* DATA TABLE */}
        <Section title="DataTable">
          <DataTable
            data={DEMO_TABLE_DATA}
            columns={demoColumns}
            getRowId={(row) => row.id}
            onRowClick={(row) => alert(`Clicked: ${row.name}`)}
            sorting={sorting}
            onSortingChange={setSorting}
            pagination={pagination}
            onPaginationChange={setPagination}
            pageCount={Math.ceil(DEMO_TABLE_DATA.length / pagination.pageSize)}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            enableRowSelection
            enableSorting
            enablePagination
            itemName="users"
            totalRows={DEMO_TABLE_DATA.length}
          />
        </Section>

        {/* BUTTON */}
        <Section title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <span className="mx-2 text-border">|</span>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="h-5 w-5" />
            </Button>
            <span className="mx-2 text-border">|</span>
            <Button>
              <Mail className="h-4 w-4" />
              With Icon
            </Button>
            <Button disabled>Disabled</Button>
            <Button
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 2000);
              }}
            >
              {loading ? "Loading..." : "Click me"}
            </Button>
          </div>
        </Section>

        {/* INPUT */}
        <Section title="Input">
          <div className="grid grid-cols-4 gap-3">
            <Input placeholder="Default" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Error state" error />
            <Input defaultValue="With value" />
          </div>
        </Section>

        {/* PASSWORD INPUT */}
        <Section title="PasswordInput">
          <div className="grid grid-cols-4 gap-3">
            <PasswordInput placeholder="Password" />
            <PasswordInput defaultValue="secret123" />
            <PasswordInput placeholder="Disabled" disabled />
            <PasswordInput placeholder="Error" error />
          </div>
        </Section>

        {/* SEARCHABLE SELECT */}
        <Section title="SearchableSelect">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-text-muted">
                size="md" (form, default)
              </span>
              <SearchableSelect
                value={selectedClient}
                onChange={setSelectedClient}
                options={DEMO_CLIENTS}
                placeholder="Seleccionar cliente..."
                size="md"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">
                size="sm" (filter bar)
              </span>
              <SearchableSelect
                value={selectedPatient}
                onChange={setSelectedPatient}
                options={DEMO_PATIENTS}
                placeholder="Seleccionar paciente..."
                size="sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Loading</span>
              <SearchableSelect
                value=""
                onChange={() => {}}
                options={[]}
                loading
                placeholder="Cargando..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Error</span>
              <SearchableSelect
                value=""
                onChange={() => {}}
                options={DEMO_CLIENTS}
                error
                placeholder="Seleccionar..."
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Disabled</span>
              <SearchableSelect
                value=""
                onChange={() => {}}
                options={DEMO_CLIENTS}
                disabled
                placeholder="Deshabilitado"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Empty options</span>
              <SearchableSelect
                value=""
                onChange={() => {}}
                options={[]}
                emptyMessage="No hay clientes"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-muted">Simulate loading</span>
              <SearchableSelect
                value=""
                onChange={() => {}}
                options={selectLoading ? [] : DEMO_CLIENTS}
                loading={selectLoading}
                placeholder="Click button..."
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={() => {
                  setSelectLoading(true);
                  setTimeout(() => setSelectLoading(false), 2000);
                }}
              >
                Toggle Loading
              </Button>
            </div>
          </div>
        </Section>

        {/* FORM FIELD */}
        <Section title="FormField">
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Email" htmlFor="f1">
              <Input id="f1" placeholder="tu@empresa.com" />
            </FormField>
            <FormField label="Password" htmlFor="f2" error="Required">
              <PasswordInput id="f2" error />
            </FormField>
            <FormField
              label="Password"
              htmlFor="f3"
              labelAction={
                <Link
                  to="/test"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Forgot?
                </Link>
              }
            >
              <PasswordInput id="f3" placeholder="With action" />
            </FormField>
          </div>
        </Section>

        {/* FILE UPLOADER */}
        <Section title="FileUploader">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs text-text-muted">
                Empty (select category first)
              </span>
              <FileUploader
                files={emptyFiles}
                onAddFiles={(files) => {
                  const newFiles: UploadingFile<
                    import("shared").ClaimFileCategory
                  >[] = files.map((f) => ({
                    id: crypto.randomUUID(),
                    file: f,
                    status: "success" as const,
                    progress: 100,
                    category: selectedCategory!,
                  }));
                  setEmptyFiles((prev) => [...prev, ...newFiles]);
                }}
                onRemoveFile={(id) =>
                  setEmptyFiles((prev) => prev.filter((f) => f.id !== id))
                }
                onRetryFile={() => {}}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={CLAIM_FILE_CATEGORIES}
                categoryIcons={CLAIM_CATEGORY_ICONS}
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-text-muted">
                With files (category pre-selected)
              </span>
              <FileUploader
                files={mockFiles}
                onAddFiles={(files) => {
                  const newFiles: UploadingFile<
                    import("shared").ClaimFileCategory
                  >[] = files.map((f) => ({
                    id: crypto.randomUUID(),
                    file: f,
                    status: "success" as const,
                    progress: 100,
                    category: selectedCategory!,
                  }));
                  setMockFiles((prev) => [...prev, ...newFiles]);
                }}
                onRemoveFile={(id) =>
                  setMockFiles((prev) => prev.filter((f) => f.id !== id))
                }
                onRetryFile={(id) =>
                  setMockFiles((prev) =>
                    prev.map((f) =>
                      f.id === id
                        ? { ...f, status: "success" as const, progress: 100 }
                        : f
                    )
                  )
                }
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={CLAIM_FILE_CATEGORIES}
                categoryIcons={CLAIM_CATEGORY_ICONS}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <span className="text-xs text-text-muted">Disabled</span>
              <FileUploader
                files={[]}
                onAddFiles={() => {}}
                onRemoveFile={() => {}}
                onRetryFile={() => {}}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={CLAIM_FILE_CATEGORIES}
                categoryIcons={CLAIM_CATEGORY_ICONS}
                disabled
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-text-muted">Error state</span>
              <FileUploader
                files={[]}
                onAddFiles={() => {}}
                onRemoveFile={() => {}}
                onRetryFile={() => {}}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={CLAIM_FILE_CATEGORIES}
                categoryIcons={CLAIM_CATEGORY_ICONS}
                error
              />
            </div>
          </div>
        </Section>

        {/* LOGO */}
        <Section title="Logo">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" />
            <div className="rounded-lg bg-primary px-4 py-2">
              <Logo variant="light" size="lg" />
            </div>
            <div className="rounded-lg bg-primary px-4 py-2">
              <Logo variant="light" size="lg" showTagline />
            </div>
          </div>
        </Section>

        {/* COMPLETE FORM EXAMPLE */}
        <Section title="Example Form">
          <div className="max-w-sm space-y-4 rounded-xl border border-border bg-white p-6">
            <FormField label="Email" htmlFor="ex-email">
              <Input id="ex-email" type="email" placeholder="tu@empresa.com" />
            </FormField>
            <FormField
              label="Password"
              htmlFor="ex-pw"
              labelAction={
                <Link
                  to="/test"
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </Link>
              }
            >
              <PasswordInput id="ex-pw" placeholder="Enter password" />
            </FormField>
            <Button className="w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
