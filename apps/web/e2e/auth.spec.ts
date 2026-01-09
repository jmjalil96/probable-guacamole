import { test, expect } from "@playwright/test";
import { testUsers, login } from "./helpers/auth";

test.describe("Authentication", () => {
  test.describe("login page", () => {
    test("displays login form", async ({ page }) => {
      await page.goto("/login");

      // Page title is "Bienvenido de nuevo"
      await expect(page.getByRole("heading", { name: /bienvenido/i })).toBeVisible();
      // Check for form fields by their id/name
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.getByRole("button", { name: /iniciar/i })).toBeVisible();
    });

    test("shows forgot password link", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByText(/olvidaste/i)).toBeVisible();
    });

    test("validates required fields", async ({ page }) => {
      await page.goto("/login");

      await page.click('button[type="submit"]');

      // Zod validation messages
      await expect(page.locator("form")).toContainText(/invalid email|too small/i);
    });
  });

  test.describe("login flow", () => {
    test("logs in with valid credentials", async ({ page, isMobile }) => {
      await login(page, testUsers.admin);

      // Should be on home page
      await expect(page).toHaveURL("/");

      // On mobile, sidebar is collapsed - check for mobile menu button instead
      if (isMobile) {
        // On mobile, look for the hamburger menu or dashboard content
        await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
      } else {
        // On desktop, user menu should be visible in sidebar
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      }
    });

    test("shows error with invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.fill('[name="email"]', "wrong@example.com");
      await page.fill('[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message (Spanish: "Credenciales inválidas")
      await expect(page.locator("form")).toContainText(
        /invalid|inválidas?|credentials/i
      );
    });
  });

  test.describe("protected routes", () => {
    test("redirects unauthenticated users to login", async ({ page }) => {
      // Try to access protected route
      await page.goto("/claims");

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });

    test("allows authenticated users to access protected routes", async ({
      page,
    }) => {
      await login(page, testUsers.admin);
      // Wait for auth to settle before navigating
      await page.waitForLoadState("networkidle");

      await page.goto("/claims");

      // Should stay on claims page
      await expect(page).toHaveURL(/claims/);
    });
  });

  test.describe("logout", () => {
    test("logs out user and redirects to login", async ({ page, isMobile }) => {
      await login(page, testUsers.admin);

      if (isMobile) {
        // On mobile, open the sidebar first via hamburger menu
        await page.getByRole("button", { name: /open menu/i }).click();
        // Wait for sidebar dialog to open
        await page.waitForSelector('[role="dialog"]');
        // Click the user menu button inside the dialog
        await page.locator('[role="dialog"] [data-testid="user-menu"]').click();
      } else {
        // On desktop, user menu is directly visible
        await page.click('[data-testid="user-menu"]');
      }

      // Click logout
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });
  });
});
