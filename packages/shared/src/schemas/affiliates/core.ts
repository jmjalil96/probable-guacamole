import { z } from "zod";
import { relatedEntitySchema } from "../../lib/common.js";

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);

export const maritalStatusSchema = z.enum([
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "DOMESTIC_PARTNERSHIP",
]);

export const dependentRelationshipSchema = z.enum([
  "SPOUSE",
  "CHILD",
  "PARENT",
  "SIBLING",
  "OTHER",
]);

export type Gender = z.infer<typeof genderSchema>;
export type MaritalStatus = z.infer<typeof maritalStatusSchema>;
export type DependentRelationship = z.infer<typeof dependentRelationshipSchema>;

// =============================================================================
// Nested Dependent Schema
// =============================================================================

export const affiliateDependentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  documentType: z.string().nullable(),
  documentNumber: z.string().nullable(),
  relationship: dependentRelationshipSchema.nullable(),
  isActive: z.boolean(),
});

export type AffiliateDependent = z.infer<typeof affiliateDependentSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

export const affiliateListItemSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  documentType: z.string().nullable(),
  documentNumber: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: genderSchema.nullable(),
  maritalStatus: maritalStatusSchema.nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),

  // Related
  client: relatedEntitySchema,

  // Portal access status
  hasPortalAccess: z.boolean(),
  portalInvitationPending: z.boolean(),

  // Dependents (nested)
  dependentsCount: z.number(),
  dependents: z.array(affiliateDependentSchema),
});

export const affiliateDetailSchema = affiliateListItemSchema.extend({
  // If this is a dependent, show the primary affiliate
  primaryAffiliate: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
});

export type AffiliateListItem = z.infer<typeof affiliateListItemSchema>;
export type AffiliateDetail = z.infer<typeof affiliateDetailSchema>;
