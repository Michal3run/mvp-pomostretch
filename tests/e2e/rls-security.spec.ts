import { test, expect } from "@playwright/test";

interface SessionHistoryItem {
  id: string;
  user_id: string;
  break_type: string;
  created_at: string;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

test.describe("M8: RLS Security and Isolation", () => {
  const suffix = Date.now();
  const userA = { email: `usera_${suffix}@example.com`, password: "testpassword123" };
  const userB = { email: `userb_${suffix}@example.com`, password: "testpassword123" };
  let sessionAId = "";

  test("User B cannot see or delete User A's session", async ({ browser }) => {
    // 1. Tworzymy osobny kontekst dla Użytkownika A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto("/auth/signup");
    await pageA.fill('input[name="email"]', userA.email);
    await pageA.fill('input[name="password"]', userA.password);
    await pageA.click('button[type="submit"]');

    await expect(pageA).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/);

    if (!pageA.url().includes("/dashboard")) {
      await pageA.goto("/auth/signin");
      await pageA.fill('input[name="email"]', userA.email);
      await pageA.fill('input[name="password"]', userA.password);
      await pageA.click('button[type="submit"]');
    }

    await expect(pageA.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 });

    // Utworzenie sesji dla Użytkownika A
    await pageA.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
    await expect(pageA.getByText("Czas skupienia")).toBeVisible();

    await pageA.getByRole("button", { name: "Zakończ" }).click();
    await expect(pageA.getByText("Czas na przerwę!")).toBeVisible();

    await pageA.getByRole("button", { name: "Tylko kark" }).click();
    await expect(pageA.getByRole("button", { name: "Zrobione" }).first()).toBeVisible({ timeout: 10000 });

    while (await pageA.getByRole("button", { name: "Zrobione" }).first().isVisible()) {
      await pageA.getByRole("button", { name: "Zrobione" }).first().click();
      await pageA.waitForTimeout(300);
    }

    await expect(pageA.getByText("Świetna robota!")).toBeVisible();

    // Pobieramy ID sesji przez pageA.request (uwzględnia ciasteczka zalogowanego pageA)
    const historyResA = await pageA.request.get("/api/session-history");
    expect(historyResA.ok()).toBeTruthy();
    const historyA = (await historyResA.json()) as ApiResponse<SessionHistoryItem[]>;

    expect(historyA.data.length).toBeGreaterThan(0);
    sessionAId = historyA.data[0].id;
    expect(sessionAId).toBeTruthy();

    // 2. Tworzymy całkowicie odrębny kontekst dla Użytkownika B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await pageB.goto("/auth/signup");
    await pageB.fill('input[name="email"]', userB.email);
    await pageB.fill('input[name="password"]', userB.password);
    await pageB.click('button[type="submit"]');

    await expect(pageB).toHaveURL(/\/auth\/(confirm-email|signin|dashboard)/);

    if (!pageB.url().includes("/dashboard")) {
      await pageB.goto("/auth/signin");
      await pageB.fill('input[name="email"]', userB.email);
      await pageB.fill('input[name="password"]', userB.password);
      await pageB.click('button[type="submit"]');
    }

    await expect(pageB.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 15000 });

    // Weryfikacja UI/API dla Użytkownika B
    const historyResB = await pageB.request.get("/api/session-history");
    expect(historyResB.ok()).toBeTruthy();
    const historyB = (await historyResB.json()) as ApiResponse<SessionHistoryItem[]>;

    // Użytkownik B nie powinien widzieć sesji Użytkownika A
    expect(historyB.data).toHaveLength(0);

    // Próba usunięcia sesji Użytkownika A przez Użytkownika B (oczekiwane 404 z uwagi na RLS)
    const deleteAttempt = await pageB.request.delete(`/api/session-history/${sessionAId}`);
    expect(deleteAttempt.status()).toBe(404);

    await contextA.close();
    await contextB.close();
  });
});
