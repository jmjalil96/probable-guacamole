import { z } from "zod";

// =============================================================================
// Lookup Item Schemas
// =============================================================================

export const clientLookupItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const affiliateLookupItemSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
});

export const patientLookupItemSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  name: z.string(),
  relationship: z
    .enum(["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"])
    .nullable(),
});

export const policyLookupItemSchema = z.object({
  id: z.string(),
  policyNumber: z.string(),
  insurerName: z.string(),
  status: z.string(),
});

// =============================================================================
// Response Schemas
// =============================================================================

export const lookupClientsResponseSchema = z.object({
  data: z.array(clientLookupItemSchema),
});

export const lookupAffiliatesResponseSchema = z.object({
  data: z.array(affiliateLookupItemSchema),
});

export const lookupPatientsResponseSchema = z.object({
  data: z.array(patientLookupItemSchema),
});

export const lookupPoliciesResponseSchema = z.object({
  data: z.array(policyLookupItemSchema),
});

// =============================================================================
// Query Param Schemas
// =============================================================================

export const lookupAffiliatesQuerySchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
});

export const lookupPatientsQuerySchema = z.object({
  affiliateId: z.string().min(1, "affiliateId is required"),
});

export const lookupPoliciesQuerySchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
});

// =============================================================================
// Types
// =============================================================================

export type ClientLookupItem = z.infer<typeof clientLookupItemSchema>;
export type AffiliateLookupItem = z.infer<typeof affiliateLookupItemSchema>;
export type PatientLookupItem = z.infer<typeof patientLookupItemSchema>;
export type PolicyLookupItem = z.infer<typeof policyLookupItemSchema>;

export type LookupClientsResponse = z.infer<typeof lookupClientsResponseSchema>;
export type LookupAffiliatesResponse = z.infer<
  typeof lookupAffiliatesResponseSchema
>;
export type LookupPatientsResponse = z.infer<
  typeof lookupPatientsResponseSchema
>;
export type LookupPoliciesResponse = z.infer<
  typeof lookupPoliciesResponseSchema
>;

export type LookupAffiliatesQuery = z.infer<typeof lookupAffiliatesQuerySchema>;
export type LookupPatientsQuery = z.infer<typeof lookupPatientsQuerySchema>;
export type LookupPoliciesQuery = z.infer<typeof lookupPoliciesQuerySchema>;
