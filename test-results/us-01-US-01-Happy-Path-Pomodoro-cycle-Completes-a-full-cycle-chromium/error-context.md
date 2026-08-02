# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: us-01.spec.ts >> US-01: Happy Path Pomodoro cycle >> Completes a full cycle
- Location: tests\e2e\us-01.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:4321/auth/signin", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("US-01: Happy Path Pomodoro cycle", () => {
  4  |   test("Completes a full cycle", async ({ page }) => {
  5  |     // 1. Zalogowanie się za pomocą danych testowych (lub test@example.com jeśli brak w env)
  6  |     const testEmail = process.env.TEST_USER_EMAIL ?? "test@example.com";
  7  | 
  8  |     // 1. Sprawdzamy stronę logowania oraz ustawiamy ciasteczka dla środowiska testowego
> 9  |     await page.goto("/auth/signin");
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  10 |     await expect(page.locator("form")).toBeVisible();
  11 | 
  12 |     await page.context().addCookies([
  13 |       { name: "e2e_test_user", value: testEmail, domain: "localhost", path: "/" },
  14 |       { name: "e2e_test_user", value: testEmail, domain: "127.0.0.1", path: "/" },
  15 |     ]);
  16 | 
  17 |     await page.goto("/dashboard");
  18 | 
  19 |     // 2. Oczekiwanie na przejście na Dashboard i zakończenie hydracji React Islands
  20 |     await expect(page.getByText("Gotowy na sesję?")).toBeVisible({ timeout: 20000 });
  21 | 
  22 |     // 3. Start nowej sesji
  23 |     await page.getByRole("button", { name: "Rozpocznij nową sesję" }).click();
  24 | 
  25 |     // 4. Potwierdzenie, że timer stał się aktywny
  26 |     await expect(page.getByText("Czas skupienia")).toBeVisible();
  27 | 
  28 |     // 5. Wykorzystanie Manual End, by pominąć 25 minut
  29 |     await page.getByRole("button", { name: "Zakończ" }).click();
  30 | 
  31 |     // 6. Przejście do wyboru przerwy
  32 |     await expect(page.getByText("Czas na przerwę!")).toBeVisible();
  33 |     await page.getByRole("button", { name: "Tylko kark" }).click();
  34 | 
  35 |     // 7. Sekwencja ćwiczeń - przeklikujemy ćwiczenia dopóki widoczny jest przycisk "Zrobione"
  36 |     await expect(page.getByRole("button", { name: "Zrobione" })).toBeVisible({ timeout: 10000 });
  37 | 
  38 |     while (await page.getByRole("button", { name: "Zrobione" }).isVisible()) {
  39 |       await page.getByRole("button", { name: "Zrobione" }).click();
  40 |       await page.waitForTimeout(300);
  41 |     }
  42 | 
  43 |     // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
  44 |     await expect(page.getByText("Świetna robota!")).toBeVisible();
  45 |     await page.getByRole("button", { name: "Rozpocznij nową sesję (25 min)" }).click();
  46 | 
  47 |     // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
  48 |     await expect(page.getByText("Czas skupienia")).toBeVisible();
  49 |   });
  50 | });
  51 | 
```