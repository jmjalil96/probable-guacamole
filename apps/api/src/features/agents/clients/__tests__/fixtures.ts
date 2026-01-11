// Re-export from parent fixtures for consistency
export {
  seedRoleWithAgentsPermission,
  seedRoleWithoutPermission,
  seedRoleWithNonUnlimitedScope,
  createTestUser,
  createTestSession,
  createTestEmployee,
  createTestAgent,
  createTestClient,
  assignAgentClient,
  SESSION_COOKIE_NAME,
} from "../../__tests__/fixtures.js";
