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
      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(3);
    });

    test('filter by cycling shows only cycling sessions', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /cycle/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Evening Ride');
    });

    test('filter by running shows only running sessions', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /run$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2);
    });

    test('switching back to all restores full list', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /cycle/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(1);

      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /all/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(3);
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
      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(4);
    });

    test('7d filter shows only sessions from last 7 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Recent Run');
    });

    test('30d filter shows sessions from last 30 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^30d$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2);
    });

    test('90d filter shows sessions from last 90 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^90d$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(3);
    });

    test('switching back to all restores full list', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(1);

      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^all$/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(4);
    });
  });

  test.describe('custom date range', () => {
    // Use dates anchored to the 8th, 12th, 18th, and 25th of last month.
    // Days 10-20 are always safe to click in a month grid (no adjacent-month overflow).
    const lastMonth = () => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    };

    const dayOfMonth = (base: Date, day: number) =>
      new Date(base.getFullYear(), base.getMonth(), day, 12).getTime();

    // Helper: click a day number inside the dialog calendar grid.
    // Excludes disabled (overflow) cells to avoid ambiguity with 6-row grid.
    const clickCalendarDay = (page: Page, day: number) =>
      page
        .getByRole('dialog')
        .locator('td button:not([aria-disabled="true"])')
        .filter({ hasText: new RegExp(`^${day}$`) })
        .click();

    test.beforeEach(async ({ page }) => {
      const base = lastMonth();
      await seedWithSessions(page, [
        { sport: 'running', date: dayOfMonth(base, 8), name: 'Early Run' },
        { sport: 'cycling', date: dayOfMonth(base, 12), name: 'Mid Ride' },
        { sport: 'running', date: dayOfMonth(base, 18), name: 'Late Run' },
        { sport: 'cycling', date: dayOfMonth(base, 25), name: 'End Ride' },
      ]);
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');
    });

    // Navigate the calendar dialog to a specific month/year using the select dropdowns
    const navigateCalendar = async (page: Page, monthName: string, year: number) => {
      const dialog = page.getByRole('dialog');
      // Month select — first combobox/trigger in the calendar header
      const monthTrigger = dialog.locator('button[role="combobox"]').first();
      await monthTrigger.click();
      await page.getByRole('option', { name: monthName }).click();
      // Year select — second combobox/trigger
      const yearTrigger = dialog.locator('button[role="combobox"]').last();
      await yearTrigger.click();
      await page.getByRole('option', { name: String(year) }).click();
    };

    test('custom range filters sessions to selected dates', async ({ page }) => {
      const base = lastMonth();
      const targetMonth = base.toLocaleString('en-US', { month: 'long' });
      const targetYear = base.getFullYear();

      // Open time filter panel, click the "Custom" radio to open dialog
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /custom/i).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Navigate to last month using select dropdowns
      await navigateCalendar(page, targetMonth, targetYear);

      // Select range: 10th to 20th (captures Mid Ride at 12th and Late Run at 18th)
      await clickCalendarDay(page, 10);
      await clickCalendarDay(page, 20);

      // Apply
      await dialog.getByRole('button', { name: /apply/i }).click();
      await expect(dialog).not.toBeVisible();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2);
      await expect(sessionLinks.filter({ hasText: 'Mid Ride' })).toHaveCount(1);
      await expect(sessionLinks.filter({ hasText: 'Late Run' })).toHaveCount(1);
    });

    test('selecting all preset after custom range restores full list', async ({ page }) => {
      const base = lastMonth();
      const targetMonth = base.toLocaleString('en-US', { month: 'long' });
      const targetYear = base.getFullYear();

      // Apply a custom range first
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /custom/i).click();

      const dialog = page.getByRole('dialog');
      await navigateCalendar(page, targetMonth, targetYear);
      await clickCalendarDay(page, 10);
      await clickCalendarDay(page, 20);
      await dialog.getByRole('button', { name: /apply/i }).click();

      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(2);

      // Switch back to All
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^all$/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(4);
    });
  });
});
