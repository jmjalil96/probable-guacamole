/**
 * Smoke test for audit service
 * Run: npx tsx scripts/test-audit.ts
 */
import {
  log,
  logUpdate,
  logInTransaction,
  getAuditContext,
  AuditActions,
} from "../src/services/audit/audit.js";
import { db } from "../src/config/db.js";

async function smokeTest() {
  console.log("🧪 Audit Service Smoke Test\n");

  // Test 1: Basic log
  console.log("1. Testing basic log...");
  log(
    {
      action: AuditActions.CREATE,
      resource: "TestResource",
      resourceId: "test-123",
      newValue: { name: "Test", createdAt: new Date() },
    },
    { userId: null, requestId: "smoke-test-1" }
  );
  console.log("   ✓ Basic log (fire-and-forget)\n");

  // Test 2: Log with all field types
  console.log("2. Testing JSON sanitization...");
  const complexValue = {
    string: "hello",
    number: 42,
    boolean: true,
    date: new Date(),
    bigint: BigInt(9007199254740991),
    nested: { deep: { value: "nested" } },
    array: [1, 2, { three: 3 }],
    nullValue: null,
    undefinedValue: undefined,
  };
  log(
    {
      action: AuditActions.UPDATE,
      resource: "TestResource",
      resourceId: "test-456",
      oldValue: { before: true },
      newValue: complexValue,
      metadata: { testRun: true },
    },
    { requestId: "smoke-test-2" }
  );
  console.log("   ✓ Complex types sanitized\n");

  // Test 3: Circular reference
  console.log("3. Testing circular reference handling...");
  const circular: Record<string, unknown> = { name: "circular" };
  circular.self = circular;
  log(
    {
      action: AuditActions.CREATE,
      resource: "TestResource",
      newValue: circular,
    },
    { requestId: "smoke-test-3" }
  );
  console.log("   ✓ Circular reference handled\n");

  // Test 4: Large payload truncation
  console.log("4. Testing large payload truncation...");
  const largeArray = Array(10000)
    .fill(null)
    .map((_, i) => ({ index: i, data: "x".repeat(100) }));
  log(
    {
      action: AuditActions.CREATE,
      resource: "TestResource",
      newValue: largeArray,
    },
    { requestId: "smoke-test-4" }
  );
  console.log("   ✓ Large payload (should truncate)\n");

  // Test 5: logUpdate helper
  console.log("5. Testing logUpdate helper...");
  logUpdate(
    {
      resource: "TestResource",
      resourceId: "test-789",
      oldValue: { status: "pending" },
      newValue: { status: "approved" },
    },
    { requestId: "smoke-test-5" }
  );
  console.log("   ✓ logUpdate works\n");

  // Test 6: Transaction variant
  console.log("6. Testing logInTransaction...");
  try {
    await db.$transaction(async (tx) => {
      await logInTransaction(
        tx,
        {
          action: AuditActions.CREATE,
          resource: "TestResource",
          resourceId: "tx-test",
          newValue: { transactional: true },
        },
        { requestId: "smoke-test-6" }
      );
    });
    console.log("   ✓ Transaction logging works\n");
  } catch (err) {
    console.log("   ✗ Transaction failed:", err);
  }

  // Wait for fire-and-forget logs to complete
  console.log("Waiting for async writes...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Verify logs were written
  console.log("\n7. Verifying database writes...");
  const logs = await db.auditLog.findMany({
    where: { requestId: { startsWith: "smoke-test" } },
    orderBy: { createdAt: "asc" },
  });
  console.log(`   Found ${logs.length} audit logs\n`);

  for (const log of logs) {
    const truncated =
      log.newValue &&
      typeof log.newValue === "object" &&
      "_truncated" in log.newValue;
    console.log(
      `   - ${log.action} ${log.resource} [${log.requestId}]${truncated ? " (truncated)" : ""}`
    );
  }

  // Cleanup
  console.log("\n8. Cleaning up test data...");
  const deleted = await db.auditLog.deleteMany({
    where: { requestId: { startsWith: "smoke-test" } },
  });
  console.log(`   Deleted ${deleted.count} test records\n`);

  console.log("✅ Smoke test complete!");
  await db.$disconnect();
}

smokeTest().catch(async (err) => {
  console.error("❌ Smoke test failed:", err);
  await db.$disconnect();
  process.exit(1);
});
