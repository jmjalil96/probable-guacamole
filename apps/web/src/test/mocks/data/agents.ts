import type {
  Agent,
  ListAgentsResponse,
  CreateAgentResponse,
  AgentClient,
  ListAgentClientsResponse,
  AssignAgentClientResponse,
} from "shared";

// =============================================================================
// Factory Functions
// =============================================================================

export const createMockAgent = (overrides?: Partial<Agent>): Agent => ({
  id: "agent-1",
  firstName: "Carlos",
  lastName: "Garcia",
  email: "carlos.garcia@agency.com",
  phone: "+1234567890",
  licenseNumber: "LIC-001",
  agencyName: "Garcia Insurance Agency",
  isActive: true,
  hasAccount: false,
  clientCount: 0,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

export const createMockAgentClient = (overrides?: Partial<AgentClient>): AgentClient => ({
  clientId: "client-1",
  clientName: "Test Client",
  assignedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

// =============================================================================
// Mock Data Fixtures
// =============================================================================

export const mockAgents: Agent[] = [
  createMockAgent({
    id: "agent-1",
    firstName: "Carlos",
    lastName: "Garcia",
    email: "carlos.garcia@agency.com",
    phone: "+573001234567",
    licenseNumber: "LIC-001",
    agencyName: "Garcia Insurance Agency",
    isActive: true,
    hasAccount: true,
    clientCount: 3,
  }),
  createMockAgent({
    id: "agent-2",
    firstName: "Maria",
    lastName: "Rodriguez",
    email: "maria.rodriguez@agency.com",
    phone: "+573002345678",
    licenseNumber: "LIC-002",
    agencyName: "Rodriguez & Associates",
    isActive: true,
    hasAccount: false,
    clientCount: 5,
  }),
  createMockAgent({
    id: "agent-3",
    firstName: "Pedro",
    lastName: "Martinez",
    email: "pedro.martinez@agency.com",
    phone: null,
    licenseNumber: null,
    agencyName: null,
    isActive: true,
    hasAccount: false,
    clientCount: 0,
  }),
  createMockAgent({
    id: "agent-4",
    firstName: "Ana",
    lastName: "Lopez",
    email: "ana.lopez@agency.com",
    phone: null,
    licenseNumber: "LIC-004",
    agencyName: "Lopez Insurance",
    isActive: false,
    hasAccount: false,
    clientCount: 2,
  }),
];

export const mockAgentDetail: Agent = createMockAgent({
  id: "agent-detail-1",
  firstName: "Detail",
  lastName: "Agent",
  email: "detail.agent@agency.com",
  phone: "+573009876543",
  licenseNumber: "LIC-DETAIL",
  agencyName: "Detail Agency Co",
  isActive: true,
  hasAccount: true,
  clientCount: 4,
  createdAt: "2024-01-01T08:00:00Z",
  updatedAt: "2024-06-15T14:30:00Z",
});

export const mockAgentClients: AgentClient[] = [
  createMockAgentClient({
    clientId: "client-1",
    clientName: "Acme Corporation",
    assignedAt: "2024-01-15T10:00:00Z",
  }),
  createMockAgentClient({
    clientId: "client-2",
    clientName: "Tech Innovations LLC",
    assignedAt: "2024-02-20T14:30:00Z",
  }),
  createMockAgentClient({
    clientId: "client-3",
    clientName: "Global Industries",
    assignedAt: "2024-03-10T09:15:00Z",
  }),
];

// =============================================================================
// Mock API Responses
// =============================================================================

export const mockAgentListResponse: ListAgentsResponse = {
  data: mockAgents,
  pagination: {
    page: 1,
    limit: 20,
    total: mockAgents.length,
    totalPages: 1,
  },
};

export const mockCreateAgentResponse: CreateAgentResponse = {
  id: "new-agent-id",
};

export const mockAgentClientsResponse: ListAgentClientsResponse = {
  data: mockAgentClients,
};

export const mockAssignAgentClientResponse: AssignAgentClientResponse = {
  agentId: "agent-1",
  clientId: "client-new",
  clientName: "New Client",
  assignedAt: "2024-06-01T10:00:00Z",
};
