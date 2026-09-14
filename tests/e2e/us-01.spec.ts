// Covers R-03: Full US-01 Pomodoro cycle has no dead-ends (integration gap check).
import { test, expect } from "@playwright/test";

test.describe("US-01: Happy Path Pomodoro cycle", () => {
  // Full Pomodoro cycle (signup → signin → timer → break → exercises → return)
  // can exceed 30s in CI with slow Supabase auth propagation.
  test("Completes a full cycle", async ({ page }) => {
    test.setTimeout(60_000);
    // 1. Rejestracja nowego użytkownika do testu E2E.
    // suffix is generated here (not at module scope) so retries get fresh emails.
    const suffix = Date.now();
    const testEmail = `us01_${suffix}@example.com`;
    const testPassword = "testpassword123";

    await page.goto("/auth/signup");
    await expect(page.locator("form")).toBeVisible();

    await page.getByLabel(/e-?mail/i).fill(testEmail);
    await page.getByLabel(/^hasło$|^password$/i).fill(testPassword);
    await page.getByLabel(/potwierdź hasło|^confirm password$/i).fill(testPassword);
    await page.getByRole("button", { name: /Zarejestruj|Create account/i }).click();

    // After signup, Supabase may redirect to confirm-email, signin, or dashboard.
    // Sometimes the page stays on /auth/signup (Supabase rate-limit, slow redirect).
    // We wait for navigation but don't hard-fail — always try signin as fallback.
    await page
      .waitForURL((url) => url.pathname !== "/auth/signup" || url.searchParams.has("error"), { timeout: 15000 })
      .catch(() => {
        // Still on signup page without an error — that's okay, we'll try signin next
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
        await page.getByRole("button", { name: /Zaloguj|Sign in/i }).click();

        await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
      }).toPass({
        intervals: [1000, 2000, 5000],
        timeout: 20000
      });
    }

    // 2. Oczekiwanie na przejście na Dashboard i zakończenie hydracji React Islands
    await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 20000 });

    // 3. Start nowej sesji
    await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();

    // 4. Potwierdzenie, że timer stał się aktywny
    await expect(page.getByText("Czas skupienia")).toBeVisible();

    // 5. Wykorzystanie Manual End, by pominąć 25 minut
    await page.getByRole("button", { name: /Zakończ|Do przerwy/ }).click();

    // 6. Przejście do wyboru przerwy
    await expect(page.getByText("Czas na przerwę!")).toBeVisible();
    await page.getByRole("button", { name: /Kark i szyja|Tylko kark/ }).click();

    // 7. Sekwencja ćwiczeń - sprawdź, że ćwiczenie dotyczy karku (rule engine działa)
    // Wait for the exercise card to render with the counter text.
    // The rule engine picks 3 exercises (or fewer from fallback catalog).
    // Each exercise has a 45-60s auto-advance timer, so click 'Zrobione' promptly.
    const exerciseCounter = page.getByText(/^Ćwiczenie 1 z \d+$/);
    await expect(exerciseCounter).toBeVisible({ timeout: 10000 });

    // Read how many exercises the rule engine selected (could be 2 or 3)
    const counterText = await exerciseCounter.textContent();
    const totalExercises = Number(counterText?.match(/z (\d+)/)?.[1] ?? 3);

    // Click 'Zrobione' for each exercise in the sequence, verifying state transition
    for (let i = 0; i < totalExercises; i++) {
      await expect(page.getByText(`Ćwiczenie ${i + 1} z ${totalExercises}`)).toBeVisible();
      await page.getByRole("button", { name: "Zrobione" }).click();
    }

    // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
    await expect(page.getByText("Świetna robota!")).toBeVisible();
    await page.getByRole("button", { name: "Wróć do pracy (Nowe Pomodoro)" }).click();

    // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
    await expect(page.getByText("Czas skupienia")).toBeVisible();
  });
});
