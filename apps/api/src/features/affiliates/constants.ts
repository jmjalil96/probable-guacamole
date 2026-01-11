import type { Prisma } from "@prisma/client";

export const ORDER_BY_MAP: Record<
  string,
  keyof Prisma.AffiliateOrderByWithRelationInput
> = {
  lastName: "lastName",
  firstName: "firstName",
  createdAt: "createdAt",
  documentNumber: "documentNumber",
};
