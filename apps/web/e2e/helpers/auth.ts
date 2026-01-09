import type { Page } from "@playwright/test";

/**
 * Test user credentials for E2E tests.
 * These should match users in the test database (see apps/api/scripts/seed.ts).
 */
export const testUsers = {
  admin: {
    email: "admin@example.com",
    password: "TestPassword123!",
  },
  agent: {
    email: "agent1@example.com",
    password: "TestPassword123!",
  },
  employee: {
    email: "employee1@example.com",
    password: "TestPassword123!",
  },
};

/**
 * Log in a user via the login form.
 *
 * IMPORTANT: Test users must exist in the database. Run the seed script first:
 *   cd apps/api && npx tsx scripts/seed.ts
 */
export async function login(
  page: Page,
  credentials: { email: string; password: string }
) {
  await page.goto("/login");
  await page.fill('[name="email"]', credentials.email);
  await page.fill('[name="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for either:
  // 1. Successful redirect away from /login (to "/" or other page)
  // 2. Error message appears on the form
  try {
    await Promise.race([
      // Success: URL changes away from /login
      page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }),
      // Error: error message appears
      page.waitForSelector("form .text-alert", { timeout: 15000 }).then(async () => {
        const errorText = await page.locator("form .text-alert").textContent();
        throw new Error(
          `Login failed: ${errorText}\n\n` +
          `Hint: Make sure test users exist. Run: cd apps/api && npx tsx scripts/seed.ts`
        );
      }),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Login failed")) {
      throw error;
    }
    throw new Error(
      `Login timed out. Make sure the API server is running and test users exist.\n` +
      `Run: cd apps/api && npx tsx scripts/seed.ts`
    );
  }
}

/**
 * Log out the current user.
 */
export async function logout(page: Page) {
  // Open user menu and click logout
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login
  await page.waitForURL("/login");
}

/**
 * Check if user is authenticated by checking for protected content.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
