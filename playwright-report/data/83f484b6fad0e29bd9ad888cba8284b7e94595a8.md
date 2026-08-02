# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: us-01.spec.ts >> US-01: Happy Path Pomodoro cycle >> Completes a full cycle
- Location: tests\e2e\us-01.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Gotowy na sesję?')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Gotowy na sesję?')

```

```yaml
- alert:
  - strong: "Uwaga:"
  - text: Supabase nie jest skonfigurowany — funkcje uwierzytelniania są wyłączone.
  - link "Zobacz instrukcję konfiguracji":
    - /url: https://github.com/przeprogramowani/10x-astro-starter#supabase-configuration
  - text: .
- heading "Sign in" [level=1]
- text: Email
- textbox "Email":
  - /placeholder: you@example.com
- text: Password
- textbox "Password":
  - /placeholder: Your password
- button "Show password"
- paragraph: Supabase is not configured
- button "Sign in"
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /auth/signup
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('US-01: Happy Path Pomodoro cycle', () => {
  4  |   test('Completes a full cycle', async ({ page }) => {
  5  |     // 1. Zalogowanie się za pomocą danych testowych (lub test@example.com jeśli brak w env)
  6  |     const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
  7  |     const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';
  8  | 
  9  |     await page.goto('/auth/signin');
  10 |     
  11 |     // Upewniamy się, że to strona logowania
  12 |     await expect(page.locator('form')).toBeVisible();
  13 |     
  14 |     await page.fill('input[name="email"]', testEmail);
  15 |     await page.fill('input[name="password"]', testPassword);
  16 |     await page.click('button[type="submit"]');
  17 | 
  18 |     // 2. Oczekiwanie na przekierowanie na Dashboard i zakończenie hydracji React Islands
> 19 |     await expect(page.getByText('Gotowy na sesję?')).toBeVisible({ timeout: 15000 });
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  20 | 
  21 |     // 3. Start nowej sesji
  22 |     await page.getByRole('button', { name: 'Rozpocznij nową sesję' }).click();
  23 | 
  24 |     // 4. Potwierdzenie, że timer stał się aktywny
  25 |     await expect(page.getByText('Czas skupienia')).toBeVisible();
  26 | 
  27 |     // 5. Wykorzystanie Manual End, by pominąć 25 minut
  28 |     await page.getByRole('button', { name: 'Zakończ' }).click();
  29 | 
  30 |     // 6. Przejście do wyboru przerwy
  31 |     await expect(page.getByText('Czas na przerwę!')).toBeVisible();
  32 |     await page.getByRole('button', { name: 'Tylko kark' }).click();
  33 | 
  34 |     // 7. Sekwencja ćwiczeń
  35 |     // Ponieważ możemy mieć 1 do 3 ćwiczeń, klikamy "Zrobione" w pętli dopóki nie zobaczymy ekranu końcowego
  36 |     await expect(page.getByRole('button', { name: 'Zrobione' })).toBeVisible({ timeout: 10000 });
  37 | 
  38 |     for (let i = 0; i < 3; i++) {
  39 |       const finished = await page.getByText('Świetna robota!').isVisible();
  40 |       if (finished) break;
  41 | 
  42 |       await page.getByRole('button', { name: 'Zrobione' }).click();
  43 |       await page.waitForTimeout(500); // drobne opóźnienie na animacje i zmianę stanu
  44 |     }
  45 | 
  46 |     // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
  47 |     await expect(page.getByText('Świetna robota!')).toBeVisible();
  48 |     await page.getByRole('button', { name: 'Rozpocznij nową sesję (25 min)' }).click();
  49 | 
  50 |     // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
  51 |     await expect(page.getByText('Czas skupienia')).toBeVisible();
  52 |   });
  53 | });
  54 | 
```