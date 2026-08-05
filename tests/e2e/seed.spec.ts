import { test, expect } from "@playwright/test";

test("created session persists after page reload", async ({ page }) => {
  await page.goto("/");

  // Role-based locators and isolated state
  await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();

  // Wait for state, not time
  await expect(page.getByText("Czas skupienia")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Czas skupienia")).toBeVisible();

  // Cleanup to ensure independence
  await page.getByRole("button", { name: "Zakończ" }).click();
  await expect(page.getByText("Czas na przerwę!")).toBeVisible();
});
