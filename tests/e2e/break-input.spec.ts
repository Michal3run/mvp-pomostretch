// Covers R-04: Quick-pick selection flow returns exercises and starts sequence
import { test, expect } from "@playwright/test";

test.describe("Break Input Form", () => {
  test("Zaskocz mnie button selects a random exercise", async ({ page }) => {
    test.setTimeout(60_000);
    // 1. Setup user and go to dashboard
    const suffix = Date.now();
    const testEmail = `random_${suffix}@example.com`;
    const testPassword = "testpassword123";

    await page.goto("/auth/signup");
    await expect(page.locator("form")).toBeVisible();
    await page.getByLabel(/e-?mail/i).fill(testEmail);
    await page.getByLabel(/^hasło$|^password$/i).fill(testPassword);
    await page.getByLabel(/potwierdź hasło|^confirm password$/i).fill(testPassword);
    await page.getByRole("button", { name: /Create account|Zarejestruj/i }).click();

    await page.waitForURL((url) => url.pathname !== "/auth/signup" || url.searchParams.has("error"), {
      timeout: 15000,
    });

    if (page.url().includes("error=")) {
      throw new Error(`Signup failed with error URL: ${page.url()}`);
    }

    if (!page.url().includes("/dashboard")) {
      await expect(async () => {
        await page.goto("/auth/signin");
        await expect(page.locator("form")).toBeVisible();

        await page.getByLabel(/e-?mail/i).fill(testEmail);
        await page.getByLabel(/^hasło$|^password$/i).fill(testPassword);
        await page.getByRole("button", { name: /Sign in|Zaloguj/i }).click();

        await page.waitForURL((url) => url.pathname === "/dashboard" || url.searchParams.has("error"), {
          timeout: 10000,
        });

        await expect(page).toHaveURL(/\/dashboard/, { timeout: 1000 });
      }).toPass({
        intervals: [1000, 2000, 3000],
        timeout: 30000,
      });
    }

    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 20000 });

    // 2. Start session and end it to get to break-input
    await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
    await expect(page.getByText("Czas skupienia")).toBeVisible();
    await page.getByRole("button", { name: /Zakończ|Do przerwy/ }).click();

    // 3. Click "Zaskocz mnie" and verify transition to exercise sequence
    await expect(page.getByText("Czas na przerwę!")).toBeVisible();

    await page.getByRole("button", { name: "Zaskocz mnie" }).click();

    // 4. Verify we got into an exercise sequence
    await expect(page.getByRole("button", { name: "Zrobione" })).toBeVisible({ timeout: 10000 });

    // We should be in the exercise sequence, we can't easily verify randomness,
    // but we can verify that the flow passes without errors
    const doneButton = page.getByRole("button", { name: "Zrobione" });
    await expect(doneButton).toBeVisible();
  });
});
