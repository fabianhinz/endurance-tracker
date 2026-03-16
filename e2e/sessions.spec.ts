import { test, expect } from '@playwright/test';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

test.describe('Session browsing', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
    // Upload two sessions so there's data to browse
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('session list shows uploaded sessions', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    // Session items are links containing sport badge, date, metrics
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });

    // Each session item should have visible text content (name/date, distance, duration)
    const firstSession = sessionLinks.first();
    await expect(firstSession).toBeVisible();
    // Session items display distance and duration separated by middot
    await expect(firstSession).toContainText('km');
  });

  test('click session → navigate to detail page', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });

    // Click the open-session button inside the first session item
    await sessionLinks
      .first()
      .getByRole('button', { name: /open session/i })
      .click();

    // Should navigate to /sessions/:id
    await page.waitForURL(/\/sessions\/.+/);

    // Detail page should show key sections
    // Training effect card
    await expect(page.getByText(/training effect/i)).toBeVisible({ timeout: 10_000 });

    // Stats grid should be present
    await expect(page.getByText(/duration/i).first()).toBeVisible();
  });

  test('navigate back from detail to session list', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });

    // Go to detail
    await sessionLinks
      .first()
      .getByRole('button', { name: /open session/i })
      .click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByText(/training effect/i)).toBeVisible({ timeout: 10_000 });

    // Navigate back via the Sessions nav link in the dock
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    // Session list should be visible again
    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
