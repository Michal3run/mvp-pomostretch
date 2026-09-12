import { test, expect } from "@playwright/test";

test.describe("Break Input Form", () => {
  test("Zaskocz mnie button selects a random exercise", async ({ page }) => {
    // 1. Setup user and go to dashboard
    const suffix = Date.now();
    const testEmail = `random_${suffix}@example.com`;
    const testPassword = "testpassword123";

    await page.goto("/auth/signup");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    await page
      .waitForURL((url) => url.pathname !== "/auth/signup", { timeout: 15000 })
      .catch(() => {
        /* no-op */
      });

    if (!page.url().includes("/dashboard")) {
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
    }

    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 20000 });

    // 2. Start session and end it to get to break-input
    await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
    await expect(page.getByText("Czas skupienia")).toBeVisible();
    await page.getByRole("button", { name: "Zakończ" }).click();

    // 3. Click "Zaskocz mnie" and intercept the request to verify parsing
    await expect(page.getByText("Czas na przerwę!")).toBeVisible();

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes("/api/break-input") && req.method() === "POST",
    );
    await page.getByRole("button", { name: "Zaskocz mnie" }).click();

    const request = await requestPromise;
    const postData = request.postData();
    expect(postData).toContain("quickPick=Zaskocz+mnie");

    // 4. Verify we got into an exercise sequence
    await expect(page.getByRole("button", { name: "Zrobione" })).toBeVisible({ timeout: 10000 });

    // We should be in the exercise sequence, we can't easily verify randomness,
    // but we can verify that the flow passes without errors
    const doneButton = page.getByRole("button", { name: "Zrobione" });
    await expect(doneButton).toBeVisible();
  });
});
