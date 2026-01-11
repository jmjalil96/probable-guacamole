// Re-export from parent fixtures for consistency
export {
  seedRoleWithClientAdminsPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestClientAdmin,
  createTestClient,
  assignClientAdminClient,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";
