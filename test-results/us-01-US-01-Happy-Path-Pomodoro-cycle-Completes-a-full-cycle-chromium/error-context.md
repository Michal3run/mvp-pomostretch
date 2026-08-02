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

Locator: getByRole('button', { name: 'Zrobione' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: 'Zrobione' })
    2 × waiting for "http://127.0.0.1:4321/exercise-sequence" navigation to finish...
      - navigated to "http://127.0.0.1:4321/exercise-sequence"

```

```yaml
- checkbox "Use dark theme"
- text: Use dark theme
- banner:
  - heading [level=2]
  - heading "An error occurred." [level=1]
- text: "Failed to load url ../lib/exercise-catalog (resolved id: ../lib/exercise-catalog) in C:/src/10xDevs/mvp-pomostretch/src/components/ExerciseSequence.tsx. Does the file exist?"
- heading "Stack Trace" [level=2]
- text: at runInRunnerObject (workers/runner-worker/index.js:107:3) at _NonRunnablePipeline.getComponentByRoute (C:/src/10xDevs/mvp-pomostretch/node_modules/.vite/deps_ssr/astro_app_entrypoint_dev.js?v=222f57cb:278:20) at matchRoute (C:/src/10xDevs/mvp-pomostretch/node_modules/.vite/deps_ssr/astro_app_entrypoint_dev.js?v=222f57cb:348:14) at DevApp.devMatch (C:/src/10xDevs/mvp-pomostretch/node_modules/.vite/deps_ssr/astro_app_entrypoint_dev.js?v=222f57cb:457:26) at Object.handle [as fetch] (C:/src/10xDevs/mvp-pomostretch/node_modules/.vite/deps_ssr/@astrojs_cloudflare_entrypoints_server.js?v=222f57cb:160:20) at maybeCaptureError (workers/runner-worker/index.js:51:10)
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
  9  |     // 1. Sprawdzamy stronę logowania oraz ustawiamy ciasteczka dla środowiska testowego
  10 |     await page.goto('/auth/signin');
  11 |     await expect(page.locator('form')).toBeVisible();
  12 | 
  13 |     await page.context().addCookies([
  14 |       { name: 'e2e_test_user', value: testEmail, domain: 'localhost', path: '/' },
  15 |       { name: 'e2e_test_user', value: testEmail, domain: '127.0.0.1', path: '/' },
  16 |     ]);
  17 | 
  18 |     await page.goto('/dashboard');
  19 | 
  20 |     // 2. Oczekiwanie na przejście na Dashboard i zakończenie hydracji React Islands
  21 |     await expect(page.getByText('Gotowy na sesję?')).toBeVisible({ timeout: 20000 });
  22 | 
  23 |     // 3. Start nowej sesji
  24 |     await page.getByRole('button', { name: 'Rozpocznij nową sesję' }).click();
  25 | 
  26 |     // 4. Potwierdzenie, że timer stał się aktywny
  27 |     await expect(page.getByText('Czas skupienia')).toBeVisible();
  28 | 
  29 |     // 5. Wykorzystanie Manual End, by pominąć 25 minut
  30 |     await page.getByRole('button', { name: 'Zakończ' }).click();
  31 | 
  32 |     // 6. Przejście do wyboru przerwy
  33 |     await expect(page.getByText('Czas na przerwę!')).toBeVisible();
  34 |     await page.getByRole('button', { name: 'Tylko kark' }).click();
  35 | 
  36 |     // 7. Sekwencja ćwiczeń - przeklikujemy ćwiczenia dopóki widoczny jest przycisk "Zrobione"
> 37 |     await expect(page.getByRole('button', { name: 'Zrobione' })).toBeVisible({ timeout: 10000 });
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  38 | 
  39 |     while (await page.getByRole('button', { name: 'Zrobione' }).isVisible()) {
  40 |       await page.getByRole('button', { name: 'Zrobione' }).click();
  41 |       await page.waitForTimeout(300);
  42 |     }
  43 | 
  44 |     // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
  45 |     await expect(page.getByText('Świetna robota!')).toBeVisible();
  46 |     await page.getByRole('button', { name: 'Rozpocznij nową sesję (25 min)' }).click();
  47 | 
  48 |     // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
  49 |     await expect(page.getByText('Czas skupienia')).toBeVisible();
  50 |   });
  51 | });
  52 | 
```