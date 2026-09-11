// Covers R-03: Full US-01 Pomodoro cycle has no dead-ends (integration gap check).
import { test, expect } from "@playwright/test";

test.describe("US-01: Happy Path Pomodoro cycle", () => {
  test("Completes a full cycle", async ({ page }) => {
    // 1. Rejestracja nowego użytkownika do testu E2E.
    // suffix is generated here (not at module scope) so retries get fresh emails.
    const suffix = Date.now();
    const testEmail = `us01_${suffix}@example.com`;
    const testPassword = "testpassword123";

    await page.goto("/auth/signup");
    await expect(page.locator("form")).toBeVisible();

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // After signup, Supabase may redirect to confirm-email, signin, or dashboard.
    // Sometimes the page stays on /auth/signup (Supabase rate-limit, slow redirect).
    // We wait for navigation but don't hard-fail — always try signin as fallback.
    await page
      .waitForURL((url) => url.pathname !== "/auth/signup", { timeout: 15000 })
      .catch(() => {
        // Still on signup page — that's okay, we'll try signin next
      });

    if (!page.url().includes("/dashboard")) {
      await page.goto("/auth/signin");
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
    }

    // 2. Oczekiwanie na przejście na Dashboard i zakończenie hydracji React Islands
    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 20000 });

    // 3. Start nowej sesji
    await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();

    // 4. Potwierdzenie, że timer stał się aktywny
    await expect(page.getByText("Czas skupienia")).toBeVisible();

    // 5. Wykorzystanie Manual End, by pominąć 25 minut
    await page.getByRole("button", { name: "Zakończ" }).click();

    // 6. Przejście do wyboru przerwy
    await expect(page.getByText("Czas na przerwę!")).toBeVisible();
    await page.getByRole("button", { name: /Kark i szyja|Tylko kark/ }).click();

    // 7. Sekwencja ćwiczeń - sprawdź, że ćwiczenie dotyczy karku (rule engine działa)
    await expect(page.getByRole("button", { name: "Zrobione" })).toBeVisible({ timeout: 10000 });

    // Verify that at least one exercise card shows neck-related content
    // (validates that selectExercises filters by body_areas, not arbitrary slicing)
    await expect(page.locator("text=/kark|szyj|brod|głow/i").first()).toBeVisible();

    while (await page.getByRole("button", { name: "Zrobione" }).isVisible()) {
      await page.getByRole("button", { name: "Zrobione" }).click();
      await expect(async () => {
        expect(
          (await page.getByText("Świetna robota!").isVisible()) ||
            (await page.getByRole("button", { name: "Zrobione" }).isVisible()),
        ).toBeTruthy();
      }).toPass({ timeout: 5000 });
    }

    // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
    await expect(page.getByText("Świetna robota!")).toBeVisible();
    await page.getByRole("button", { name: "Wróć do pracy (Nowe Pomodoro)" }).click();

    // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
    await expect(page.getByText("Czas skupienia")).toBeVisible();
  });
});
