import { test, expect } from "@playwright/test";
import { testUsers, login } from "./helpers/auth";

test.describe("Claims", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    // Wait for auth to fully settle before navigating
    await page.waitForLoadState("networkidle");
  });

  test.describe("claims list", () => {
    test("displays claims list page", async ({ page }) => {
      await page.goto("/claims");

      // Should show claims heading and table
      await expect(page.getByRole("heading", { name: /reclamos/i })).toBeVisible();
    });

    test("shows claims table", async ({ page }) => {
      await page.goto("/claims");

      // Should show data table
      await expect(page.locator("table")).toBeVisible();
    });
  });

  test.describe("claim creation", () => {
    test("navigates to new claim form", async ({ page, isMobile }) => {
      await page.goto("/claims");

      // On mobile, the button only shows an icon; on desktop it has text "Nuevo Reclamo"
      if (isMobile) {
        // On mobile, use the link in the sidebar instead
        await page.getByRole("button", { name: /open menu/i }).click();
        await page.waitForTimeout(300);
        await page.getByRole("link", { name: /nuevo reclamo/i }).click();
      } else {
        // On desktop, click the button with text
        const newClaimButton = page.getByRole("button", { name: /nuevo/i });
        await expect(newClaimButton).toBeVisible();
        await newClaimButton.click();
      }

      await expect(page).toHaveURL(/new-claim/);
    });

    test("displays new claim form", async ({ page }) => {
      await page.goto("/new-claim");

      // Should show form with "Nuevo Reclamo" heading
      await expect(page.getByRole("heading", { name: /nuevo reclamo/i })).toBeVisible();
    });
  });

  test.describe("claim detail", () => {
    test("can click on claim row to view detail", async ({ page }) => {
      await page.goto("/claims");

      // Wait for table to load
      await expect(page.locator("table")).toBeVisible();

      // Try to click on first claim row if any exist
      const firstClaimRow = page.locator("table tbody tr").first();
      const rowCount = await page.locator("table tbody tr").count();

      if (rowCount > 0) {
        await firstClaimRow.click();

        // Should navigate to detail page (URL may have query params)
        await expect(page).toHaveURL(/\/claims\/[a-zA-Z0-9-]+/);
      }
    });
  });

  test.describe("view toggle", () => {
    test("switches between list and kanban views", async ({ page }) => {
      await page.goto("/claims");

      // Should start on list view
      await expect(page.locator("table")).toBeVisible();

      // Find kanban toggle (it's a radio button, not a regular button)
      const kanbanToggle = page.getByRole("radio", { name: /kanban/i });
      await kanbanToggle.click();

      // URL should update to include view=kanban
      await expect(page).toHaveURL(/view=kanban/);

      // Switch back to list
      const listToggle = page.getByRole("radio", { name: /lista/i });
      await listToggle.click();

      // Should be back on list view
      await expect(page.locator("table")).toBeVisible();
    });
  });
});
