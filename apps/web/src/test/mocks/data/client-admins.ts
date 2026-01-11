import type {
  ClientAdmin,
  ListClientAdminsResponse,
  CreateClientAdminResponse,
  ClientAdminClient,
  ListClientAdminClientsResponse,
  AssignClientAdminClientResponse,
} from "shared";

// =============================================================================
// Factory Functions
// =============================================================================

export const createMockClientAdmin = (overrides?: Partial<ClientAdmin>): ClientAdmin => ({
  id: "client-admin-1",
  firstName: "Laura",
  lastName: "Gomez",
  email: "laura.gomez@client.com",
  phone: "+1234567890",
  jobTitle: "Account Manager",
  isActive: true,
  hasAccount: false,
  clientCount: 0,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

export const createMockClientAdminClient = (overrides?: Partial<ClientAdminClient>): ClientAdminClient => ({
  clientId: "client-1",
  clientName: "Test Client",
  assignedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

// =============================================================================
// Mock Data Fixtures
// =============================================================================

export const mockClientAdmins: ClientAdmin[] = [
  createMockClientAdmin({
    id: "client-admin-1",
    firstName: "Laura",
    lastName: "Gomez",
    email: "laura.gomez@client.com",
    phone: "+573001234567",
    jobTitle: "Account Manager",
    isActive: true,
    hasAccount: true,
    clientCount: 2,
  }),
  createMockClientAdmin({
    id: "client-admin-2",
    firstName: "Diego",
    lastName: "Hernandez",
    email: "diego.hernandez@client.com",
    phone: "+573002345678",
    jobTitle: "HR Director",
    isActive: true,
    hasAccount: false,
    clientCount: 4,
  }),
  createMockClientAdmin({
    id: "client-admin-3",
    firstName: "Sofia",
    lastName: "Ramirez",
    email: "sofia.ramirez@client.com",
    phone: null,
    jobTitle: null,
    isActive: true,
    hasAccount: false,
    clientCount: 0,
  }),
  createMockClientAdmin({
    id: "client-admin-4",
    firstName: "Andres",
    lastName: "Torres",
    email: "andres.torres@client.com",
    phone: null,
    jobTitle: "Operations Lead",
    isActive: false,
    hasAccount: false,
    clientCount: 1,
  }),
];

export const mockClientAdminDetail: ClientAdmin = createMockClientAdmin({
  id: "client-admin-detail-1",
  firstName: "Detail",
  lastName: "ClientAdmin",
  email: "detail.clientadmin@client.com",
  phone: "+573009876543",
  jobTitle: "Senior Account Manager",
  isActive: true,
  hasAccount: true,
  clientCount: 3,
  createdAt: "2024-01-01T08:00:00Z",
  updatedAt: "2024-06-15T14:30:00Z",
});

export const mockClientAdminClients: ClientAdminClient[] = [
  createMockClientAdminClient({
    clientId: "client-1",
    clientName: "Acme Corporation",
    assignedAt: "2024-01-15T10:00:00Z",
  }),
  createMockClientAdminClient({
    clientId: "client-2",
    clientName: "Tech Innovations LLC",
    assignedAt: "2024-02-20T14:30:00Z",
  }),
];

// =============================================================================
// Mock API Responses
// =============================================================================

export const mockClientAdminListResponse: ListClientAdminsResponse = {
  data: mockClientAdmins,
  pagination: {
    page: 1,
    limit: 20,
    total: mockClientAdmins.length,
    totalPages: 1,
  },
};

export const mockCreateClientAdminResponse: CreateClientAdminResponse = {
  id: "new-client-admin-id",
};

export const mockClientAdminClientsResponse: ListClientAdminClientsResponse = {
  data: mockClientAdminClients,
};

export const mockAssignClientAdminClientResponse: AssignClientAdminClientResponse = {
  clientAdminId: "client-admin-1",
  clientId: "client-new",
  clientName: "New Client",
  assignedAt: "2024-06-01T10:00:00Z",
};
