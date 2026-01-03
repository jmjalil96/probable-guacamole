import type { Prisma } from "@prisma/client";

// Re-export state machine from shared package
export * from "shared/schemas/claim-state-machine";

export const ORDER_BY_MAP: Record<
  string,
  keyof Prisma.ClaimOrderByWithRelationInput
> = {
  claimNumber: "claimNumber",
  submittedDate: "submittedDate",
  incidentDate: "incidentDate",
  createdAt: "createdAt",
  status: "status",
  amountSubmitted: "amountSubmitted",
};
