import { test, expect } from "@playwright/test";

test.describe("US-01: Happy Path Pomodoro cycle", () => {
  test("Completes a full cycle", async ({ page }) => {
    // 1. Zalogowanie się za pomocą danych testowych (lub test@example.com jeśli brak w env)
    const testEmail = process.env.TEST_USER_EMAIL ?? "test@example.com";

    // 1. Sprawdzamy stronę logowania oraz ustawiamy ciasteczka dla środowiska testowego
    await page.goto("/auth/signin");
    await expect(page.locator("form")).toBeVisible();

    await page.context().addCookies([
      { name: "e2e_test_user", value: testEmail, domain: "localhost", path: "/" },
      { name: "e2e_test_user", value: testEmail, domain: "127.0.0.1", path: "/" },
    ]);

    await page.goto("/dashboard");

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
    await page.getByRole("button", { name: "Tylko kark" }).click();

    // 7. Sekwencja ćwiczeń - przeklikujemy ćwiczenia dopóki widoczny jest przycisk "Zrobione"
    await expect(page.getByRole("button", { name: "Zrobione" })).toBeVisible({ timeout: 10000 });

    while (await page.getByRole("button", { name: "Zrobione" }).isVisible()) {
      await page.getByRole("button", { name: "Zrobione" }).click();
      await page.waitForTimeout(300);
    }

    // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
    await expect(page.getByText("Świetna robota!")).toBeVisible();
    await page.getByRole("button", { name: "Rozpocznij nową sesję (25 min)" }).click();

    // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
    await expect(page.getByText("Czas skupienia")).toBeVisible();
  });
});
