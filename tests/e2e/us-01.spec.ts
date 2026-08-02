import { test, expect } from '@playwright/test';

test.describe('US-01: Happy Path Pomodoro cycle', () => {
  test('Completes a full cycle', async ({ page }) => {
    // 1. Zalogowanie się za pomocą danych testowych (lub test@example.com jeśli brak w env)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.goto('/auth/signin');
    
    // Upewniamy się, że to strona logowania
    await expect(page.locator('form')).toBeVisible();
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 2. Oczekiwanie na przekierowanie na Dashboard i zakończenie hydracji React Islands
    await expect(page.getByText('Gotowy na sesję?')).toBeVisible({ timeout: 15000 });

    // 3. Start nowej sesji
    await page.getByRole('button', { name: 'Rozpocznij nową sesję' }).click();

    // 4. Potwierdzenie, że timer stał się aktywny
    await expect(page.getByText('Czas skupienia')).toBeVisible();

    // 5. Wykorzystanie Manual End, by pominąć 25 minut
    await page.getByRole('button', { name: 'Zakończ' }).click();

    // 6. Przejście do wyboru przerwy
    await expect(page.getByText('Czas na przerwę!')).toBeVisible();
    await page.getByRole('button', { name: 'Tylko kark' }).click();

    // 7. Sekwencja ćwiczeń
    // Ponieważ możemy mieć 1 do 3 ćwiczeń, klikamy "Zrobione" w pętli dopóki nie zobaczymy ekranu końcowego
    await expect(page.getByRole('button', { name: 'Zrobione' })).toBeVisible({ timeout: 10000 });

    for (let i = 0; i < 3; i++) {
      const finished = await page.getByText('Świetna robota!').isVisible();
      if (finished) break;

      await page.getByRole('button', { name: 'Zrobione' }).click();
      await page.waitForTimeout(500); // drobne opóźnienie na animacje i zmianę stanu
    }

    // 8. Weryfikacja ekranu końcowego i ominięcie Idle Break
    await expect(page.getByText('Świetna robota!')).toBeVisible();
    await page.getByRole('button', { name: 'Rozpocznij nową sesję (25 min)' }).click();

    // 9. Potwierdzenie powrotu do działającego timera na Dashboardzie
    await expect(page.getByText('Czas skupienia')).toBeVisible();
  });
});
