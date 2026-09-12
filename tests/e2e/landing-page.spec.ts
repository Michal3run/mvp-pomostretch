import { test, expect } from '@playwright/test';

// Covers R-14: Landing page rendering and unauthenticated entry flow
test.describe('Landing Page (Unauthenticated)', () => {
  test('renders hero content and navigates to signup', async ({ page }) => {
    // Navigate to /
    await page.goto('/');

    // Assert page title contains "PomoStretch"
    await expect(page).toHaveTitle(/PomoStretch/i);

    // Assert main heading is visible
    const heading = page.getByRole('heading', { level: 1, name: /Skup sie na kodzie/i });
    await expect(heading).toBeVisible();

    // Assert main CTA is visible
    const ctaLink = page.getByRole('link', { name: /Zacznij za darmo/i });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/auth/signup');

    // Click the main CTA link
    await ctaLink.click();

    // Assert navigation to /auth/signup
    await expect(page).toHaveURL(/\/auth\/signup/);
    
    // Assert signup form is visible
    await expect(page.locator('form')).toBeVisible();
  });
});
