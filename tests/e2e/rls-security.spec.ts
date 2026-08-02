import { test, expect } from "@playwright/test";

test.describe("M8: RLS Security and Isolation", () => {
  // Use a unique suffix for this run to avoid collisions
  const suffix = Date.now();
  const userA = { email: `usera_${suffix}@example.com`, password: "testpassword123" };
  const userB = { email: `userb_${suffix}@example.com`, password: "testpassword123" };
  let sessionAId = "";

  test("User B cannot see or delete User A's session", async ({ page, request }) => {
    // === 1. Register and Login User A ===
    await page.goto("/auth/signup");
    await page.fill('input[name="email"]', userA.email);
    await page.fill('input[name="password"]', userA.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to confirm-email, then go to signin
    await expect(page).toHaveURL(/\/auth\/confirm-email/);

    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', userA.email);
    await page.fill('input[name="password"]', userA.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 });

    // === 2. Create a session for User A ===
    await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
    await expect(page.getByText("Czas skupienia")).toBeVisible();
    
    await page.getByRole("button", { name: "Zakończ" }).click();
    await expect(page.getByText("Czas na przerwę!")).toBeVisible();
    
    await page.getByRole("button", { name: "Tylko kark" }).click();
    await expect(page.getByRole("button", { name: "Zrobione" }).first()).toBeVisible({ timeout: 10000 });
    
    while (await page.getByRole("button", { name: "Zrobione" }).first().isVisible()) {
      await page.getByRole("button", { name: "Zrobione" }).first().click();
      await page.waitForTimeout(300);
    }
    
    await expect(page.getByText("Świetna robota!")).toBeVisible();

    // Grab the ID from API as User A
    const historyResA = await request.get("/api/session-history");
    expect(historyResA.ok()).toBeTruthy();
    const historyA = await historyResA.json();
    
    expect(historyA.data.length).toBeGreaterThan(0);
    sessionAId = historyA.data[0].id;
    expect(sessionAId).toBeTruthy();

    // === 3. Logout User A ===
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Wyloguj się" }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);

    // === 4. Register and Login User B ===
    await page.goto("/auth/signup");
    await page.fill('input[name="email"]', userB.email);
    await page.fill('input[name="password"]', userB.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/auth\/confirm-email/);

    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', userB.email);
    await page.fill('input[name="password"]', userB.password);
    await page.click('button[type="submit"]');
    
    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 });

    // === 5. Check UI/API as User B ===
    const historyResB = await request.get("/api/session-history");
    expect(historyResB.ok()).toBeTruthy();
    const historyB = await historyResB.json();
    
    // User B should not see User A's sessions
    expect(historyB.data).toHaveLength(0);

    // === 6. Direct API attack: try to delete User A's session as User B ===
    const deleteAttempt = await request.delete(`/api/session-history/${sessionAId}`);
    // Supabase RLS returns empty data for records we don't own. 
    // The API handler returns 404 "Not Found" if data.length === 0
    expect(deleteAttempt.status()).toBe(404);
  });
});
