import { db } from "../config/db.js";

/**
 * Clean all test data from the database.
 * Order matters due to foreign keys - delete in reverse dependency order.
 */
export async function cleanDatabase() {
  await db.$transaction([
    // Audit & session
    db.auditLog.deleteMany(),
    db.session.deleteMany(),
    db.verificationToken.deleteMany(),
    db.invitation.deleteMany(),
    // Tickets
    db.ticketMessage.deleteMany(),
    db.ticket.deleteMany(),
    // Documents
    db.documentAccess.deleteMany(),
    db.document.deleteMany(),
    // Files
    db.file.deleteMany(),
    db.pendingUpload.deleteMany(),
    // Claims
    db.claimInvoice.deleteMany(),
    db.claimHistory.deleteMany(),
    db.claim.deleteMany(),
    // Invoices
    db.invoiceDiscrepancyCause.deleteMany(),
    db.invoiceHistory.deleteMany(),
    db.invoicePolicy.deleteMany(),
    db.invoice.deleteMany(),
    // Policies
    db.enrollmentDependent.deleteMany(),
    db.policyHistory.deleteMany(),
    db.policyEnrollment.deleteMany(),
    db.policy.deleteMany(),
    db.insurer.deleteMany(),
    // Users & profiles
    db.rolePermission.deleteMany(),
    db.user.deleteMany(),
    db.affiliate.deleteMany(),
    db.employee.deleteMany(),
    db.agentClient.deleteMany(),
    db.agent.deleteMany(),
    db.clientAdminClient.deleteMany(),
    db.clientAdmin.deleteMany(),
    db.client.deleteMany(),
    db.permission.deleteMany(),
    db.role.deleteMany(),
    // Counters
    db.globalCounter.deleteMany(),
  ]);
}

/**
 * Seed the default user role for tests.
 */
export async function seedTestRole() {
  return db.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      displayName: "User",
      description: "Standard user role for tests",
      scopeType: "SELF",
    },
  });
}
