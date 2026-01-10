import type {
  Insurer,
  InsurerType,
  ListInsurersResponse,
  CreateInsurerResponse,
} from "shared";

// =============================================================================
// Factory Function
// =============================================================================

export const createMockInsurer = (overrides?: Partial<Insurer>): Insurer => ({
  id: "insurer-1",
  name: "Test Insurance Co",
  code: "TIC-001",
  email: "contact@test.com",
  phone: "+1234567890",
  website: "https://test.com",
  type: "COMPANIA_DE_SEGUROS",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

// =============================================================================
// Mock Data Fixtures
// =============================================================================

export const mockInsurers: Insurer[] = [
  createMockInsurer({
    id: "insurer-1",
    name: "Seguros Bolívar",
    code: "SB-001",
    email: "contacto@segurosbolivar.com",
    phone: "+573001234567",
    website: "https://segurosbolivar.com",
    type: "COMPANIA_DE_SEGUROS",
    isActive: true,
  }),
  createMockInsurer({
    id: "insurer-2",
    name: "Colsanitas",
    code: "CS-002",
    email: "info@colsanitas.com",
    phone: "+573002345678",
    website: "https://colsanitas.com",
    type: "MEDICINA_PREPAGADA",
    isActive: true,
  }),
  createMockInsurer({
    id: "insurer-3",
    name: "Sura EPS",
    code: "SURA-003",
    email: "atencion@sura.com",
    phone: "+573003456789",
    website: "https://sura.com",
    type: "MEDICINA_PREPAGADA",
    isActive: true,
  }),
  createMockInsurer({
    id: "insurer-4",
    name: "Aseguradora Inactiva",
    code: null,
    email: null,
    phone: null,
    website: null,
    type: "COMPANIA_DE_SEGUROS",
    isActive: false,
  }),
];

export const mockInsurerDetail: Insurer = createMockInsurer({
  id: "insurer-detail-1",
  name: "Detalle Aseguradora S.A.",
  code: "DET-001",
  email: "detalle@aseguradora.com",
  phone: "+573009876543",
  website: "https://detalleaseguradora.com",
  type: "COMPANIA_DE_SEGUROS",
  isActive: true,
  createdAt: "2024-01-01T08:00:00Z",
  updatedAt: "2024-06-15T14:30:00Z",
});

// =============================================================================
// Mock API Responses
// =============================================================================

export const mockInsurerListResponse: ListInsurersResponse = {
  data: mockInsurers,
  pagination: {
    page: 1,
    limit: 20,
    total: mockInsurers.length,
    totalPages: 1,
  },
};

export const mockCreateInsurerResponse: CreateInsurerResponse = {
  id: "new-insurer-id",
};

// =============================================================================
// Typed Helpers
// =============================================================================

export const INSURER_TYPES: InsurerType[] = [
  "MEDICINA_PREPAGADA",
  "COMPANIA_DE_SEGUROS",
];
