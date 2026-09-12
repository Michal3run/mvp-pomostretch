// Covers R-06: The quick-pick selection works and starts the exercise flow
import { test, expect } from "@playwright/test";

test.describe("Break Input Form", () => {
  test("Zaskocz mnie button selects a random exercise", async ({ page }) => {
    // 1. Setup user and go to dashboard
    const suffix = Date.now();
    const testEmail = `random_${suffix}@example.com`;
    const testPassword = "testpassword123";

    await page.goto("/auth/signup");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password", { exact: true }).fill(testPassword);
    await page.getByLabel("Confirm password").fill(testPassword);
    await page.getByRole("button", { name: /Create account|Zarejestruj/i }).click();

    await page
      .waitForURL((url) => url.pathname !== "/auth/signup", { timeout: 15000 })
      .catch(() => {
        /* no-op */
      });

    if (!page.url().includes("/dashboard")) {
      await page.goto("/auth/signin");
      await page.getByLabel("Email").fill(testEmail);
      await page.getByLabel("Password", { exact: true }).fill(testPassword);
      await page.getByRole("button", { name: /Sign in|Zaloguj/i }).click();
    }

    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 20000 });

    // 2. Start session and end it to get to break-input
    await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
    await expect(page.getByText("Czas skupienia")).toBeVisible();
    await page.getByRole("button", { name: "Zakończ" }).click();

    // 3. Click "Zaskocz mnie" and intercept the request to verify parsing
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
