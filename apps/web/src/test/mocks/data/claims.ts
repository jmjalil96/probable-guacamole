import type { ClaimStatus, CareType } from "shared";

export interface MockClaimListItem {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  careType: CareType;
  patientName: string;
  clientName: string;
  affiliateName: string;
  amountSubmitted: string;
  amountApproved: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export const mockClaims: MockClaimListItem[] = [
  {
    id: "claim-1",
    claimNumber: "CLM-2024-0001",
    status: "DRAFT",
    careType: "AMBULATORY",
    patientName: "John Doe",
    clientName: "ACME Corp",
    affiliateName: "Sucursal Norte",
    amountSubmitted: "1500.00",
    amountApproved: null,
    submittedAt: null,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "claim-2",
    claimNumber: "CLM-2024-0002",
    status: "SUBMITTED",
    careType: "HOSPITALARY",
    patientName: "Jane Smith",
    clientName: "Globex Inc",
    affiliateName: "Sucursal Sur",
    amountSubmitted: "5000.00",
    amountApproved: null,
    submittedAt: "2024-01-16T14:30:00Z",
    createdAt: "2024-01-16T09:00:00Z",
  },
  {
    id: "claim-3",
    claimNumber: "CLM-2024-0003",
    status: "IN_REVIEW",
    careType: "AMBULATORY",
    patientName: "Bob Johnson",
    clientName: "Initech",
    affiliateName: "Casa Matriz",
    amountSubmitted: "2500.00",
    amountApproved: null,
    submittedAt: "2024-01-17T11:00:00Z",
    createdAt: "2024-01-17T08:00:00Z",
  },
  {
    id: "claim-4",
    claimNumber: "CLM-2024-0004",
    status: "SETTLED",
    careType: "HOSPITALARY",
    patientName: "Alice Brown",
    clientName: "ACME Corp",
    affiliateName: "Sucursal Norte",
    amountSubmitted: "10000.00",
    amountApproved: "8500.00",
    submittedAt: "2024-01-10T16:00:00Z",
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "claim-5",
    claimNumber: "CLM-2024-0005",
    status: "CANCELLED",
    careType: "OTHER",
    patientName: "Charlie Wilson",
    clientName: "Globex Inc",
    affiliateName: "Sucursal Este",
    amountSubmitted: "750.00",
    amountApproved: null,
    submittedAt: null,
    createdAt: "2024-01-18T13:00:00Z",
  },
];

export const mockClaimDetail = {
  id: "claim-1",
  claimNumber: "CLM-2024-0001",
  status: "DRAFT" as ClaimStatus,
  careType: "AMBULATORY" as CareType,
  description: "Consulta médica general",
  diagnosis: "Revisión de rutina",
  patientId: "patient-1",
  patientName: "John Doe",
  clientId: "client-1",
  clientName: "ACME Corp",
  affiliateId: "affiliate-1",
  affiliateName: "Sucursal Norte",
  policyId: "policy-1",
  policyNumber: "POL-2024-001",
  amountSubmitted: "1500.00",
  amountApproved: null,
  incidentDate: "2024-01-14",
  submittedAt: null,
  settledAt: null,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  createdBy: {
    id: "user-1",
    firstName: "Admin",
    lastName: "User",
  },
  updatedBy: {
    id: "user-1",
    firstName: "Admin",
    lastName: "User",
  },
};
