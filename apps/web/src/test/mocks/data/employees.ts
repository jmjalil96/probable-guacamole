import type {
  Employee,
  ListEmployeesResponse,
  CreateEmployeeResponse,
} from "shared";

// =============================================================================
// Factory Function
// =============================================================================

export const createMockEmployee = (overrides?: Partial<Employee>): Employee => ({
  id: "employee-1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  department: "Engineering",
  isActive: true,
  hasAccount: false,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  ...overrides,
});

// =============================================================================
// Mock Data Fixtures
// =============================================================================

export const mockEmployees: Employee[] = [
  createMockEmployee({
    id: "employee-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+573001234567",
    department: "Engineering",
    isActive: true,
    hasAccount: true,
  }),
  createMockEmployee({
    id: "employee-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+573002345678",
    department: "Sales",
    isActive: true,
    hasAccount: false,
  }),
  createMockEmployee({
    id: "employee-3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    phone: null,
    department: null,
    isActive: true,
    hasAccount: false,
  }),
  createMockEmployee({
    id: "employee-4",
    firstName: "Alice",
    lastName: "Williams",
    email: "alice.williams@example.com",
    phone: null,
    department: "HR",
    isActive: false,
    hasAccount: false,
  }),
];

export const mockEmployeeDetail: Employee = createMockEmployee({
  id: "employee-detail-1",
  firstName: "Detail",
  lastName: "Employee",
  email: "detail.employee@example.com",
  phone: "+573009876543",
  department: "Operations",
  isActive: true,
  hasAccount: true,
  createdAt: "2024-01-01T08:00:00Z",
  updatedAt: "2024-06-15T14:30:00Z",
});

// =============================================================================
// Mock API Responses
// =============================================================================

export const mockEmployeeListResponse: ListEmployeesResponse = {
  data: mockEmployees,
  pagination: {
    page: 1,
    limit: 20,
    total: mockEmployees.length,
    totalPages: 1,
  },
};

export const mockCreateEmployeeResponse: CreateEmployeeResponse = {
  id: "new-employee-id",
};
