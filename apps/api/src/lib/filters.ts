// =============================================================================
// Reusable Prisma Filter Builders
// =============================================================================

// String contains (case-insensitive)
export const contains = (val?: string) =>
  val ? { contains: val, mode: "insensitive" as const } : undefined;

// Date range filter
export const dateRange = (from?: string, to?: string) =>
  from || to
    ? {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
      }
    : undefined;

// Array "in" filter
export const inArray = <T>(val?: T[]) =>
  val?.length ? { in: val } : undefined;

// Name search (firstName OR lastName contains)
export const nameContains = (val?: string) =>
  val
    ? { OR: [{ firstName: contains(val) }, { lastName: contains(val) }] }
    : undefined;

// Strip undefined values from object
export const compact = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
