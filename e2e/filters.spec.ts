import { test, expect, type Page } from '@playwright/test';
import { seedWithSessions } from './helpers/seed';

const DAY_MS = 24 * 60 * 60 * 1000;

// The dock renders filter buttons in both mini (reveal panel) and maxi modes.
// When dockExpanded is true both exist in the DOM — the mini ones are hidden
// via opacity-0 but Playwright still considers them visible. The maxi buttons
// are rendered after the reveal panel in DOM order, so .last() targets them.
const dockButton = (page: Page, name: RegExp) =>
  page.locator('[data-layout="dock"]').getByRole('button', { name }).last();

// When a filter panel opens it gets `pointer-events-auto`. The closed panel
// keeps `pointer-events-none`. Both sport and time panels have an "All" radio,
// so we scope radio selections to the currently interactive panel.
const openPanelRadio = (page: Page, name: RegExp) =>
  page.locator('[data-layout="dock"] .pointer-events-auto').getByRole('radio', { name });

test.describe('Dock filters', () => {
  test.describe('sport filter', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 1 * DAY_MS, name: 'Morning Run' },
        { sport: 'cycling', date: now - 2 * DAY_MS, name: 'Evening Ride' },
        { sport: 'running', date: now - 3 * DAY_MS, name: 'Tempo Run' },
      ]);
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');
    });

    test('shows all sessions by default', async ({ page }) => {
      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(3);
    });

    test('filter by cycling shows only cycling sessions', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /cycle/i).click();

      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Evening Ride');
    });

    test('filter by running shows only running sessions', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /run$/i).click();

      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(2);
    });

    test('switching back to all restores full list', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /cycle/i).click();
      await expect(page.locator('a[href^="/sessions/"]')).toHaveCount(1);

      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /all/i).click();
      await expect(page.locator('a[href^="/sessions/"]')).toHaveCount(3);
    });
  });

  test.describe('time filter', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 2 * DAY_MS, name: 'Recent Run' },
        { sport: 'cycling', date: now - 15 * DAY_MS, name: 'Mid Ride' },
        { sport: 'running', date: now - 60 * DAY_MS, name: 'Older Run' },
        { sport: 'cycling', date: now - 120 * DAY_MS, name: 'Old Ride' },
      ]);
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');
    });

    test('shows all sessions with "All" time filter', async ({ page }) => {
      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(4);
    });

    test('7d filter shows only sessions from last 7 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();

      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Recent Run');
    });

    test('30d filter shows sessions from last 30 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^30d$/i).click();

      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(2);
    });

    test('90d filter shows sessions from last 90 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^90d$/i).click();

      const sessionLinks = page.locator('a[href^="/sessions/"]');
      await expect(sessionLinks).toHaveCount(3);
    });

    test('switching back to all restores full list', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();
      await expect(page.locator('a[href^="/sessions/"]')).toHaveCount(1);

      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^all$/i).click();
      await expect(page.locator('a[href^="/sessions/"]')).toHaveCount(4);
    });
  });
});
