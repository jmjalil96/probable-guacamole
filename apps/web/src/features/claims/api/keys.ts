import type {
  ListClaimsQuery,
  ClaimAuditTrailQuery,
  ClaimHistoryQuery,
} from "shared";

// =============================================================================
// Query Keys
// =============================================================================

export const claimKeys = {
  all: ["claims"] as const,

  // List
  lists: () => [...claimKeys.all, "list"] as const,
  list: (query: ListClaimsQuery) => [...claimKeys.lists(), query] as const,

  // Detail
  details: () => [...claimKeys.all, "detail"] as const,
  detail: (id: string) => [...claimKeys.details(), id] as const,

  // Lookups
  lookups: {
    clients: () => ["claims", "lookups", "clients"] as const,
    affiliates: (clientId: string) =>
      ["claims", "lookups", "affiliates", clientId] as const,
    patients: (affiliateId: string) =>
      ["claims", "lookups", "patients", affiliateId] as const,
    policies: (clientId: string) =>
      ["claims", "lookups", "policies", clientId] as const,
  },

  // Invoices
  invoices: (claimId: string) =>
    [...claimKeys.detail(claimId), "invoices"] as const,
  invoice: (claimId: string, invoiceId: string) =>
    [...claimKeys.invoices(claimId), invoiceId] as const,

  // Notes
  notes: (claimId: string) => [...claimKeys.detail(claimId), "notes"] as const,
  note: (claimId: string, noteId: string) =>
    [...claimKeys.notes(claimId), noteId] as const,

  // Files
  files: {
    pending: () => ["claims", "files", "pending"] as const,
    list: (claimId: string) => [...claimKeys.detail(claimId), "files"] as const,
    download: (claimId: string, fileId: string) =>
      [...claimKeys.files.list(claimId), fileId, "download"] as const,
  },

  // Audit
  auditTrail: (claimId: string, query?: ClaimAuditTrailQuery) =>
    [...claimKeys.detail(claimId), "audit", query] as const,
  history: (claimId: string, query?: ClaimHistoryQuery) =>
    [...claimKeys.detail(claimId), "history", query] as const,
};
