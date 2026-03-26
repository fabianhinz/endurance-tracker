import { test, expect } from '@playwright/test';
import { seedOnboardingComplete } from '../helpers/seed';

const mapToggle = (page: import('@playwright/test').Page) =>
  page.locator('[data-layout="dock"]').getByRole('button', { name: /show map|hide map/i });

const content = (page: import('@playwright/test').Page) => page.locator('[data-layout="main"]');

test.describe('mobile map toggle', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
  });

  test('toggle is visible on mobile', async ({ page }) => {
    await expect(mapToggle(page)).toBeVisible();
  });

  test('toggle defaults to off', async ({ page }) => {
    await expect(mapToggle(page)).toHaveAttribute('data-state', 'off');
  });

  test('tapping toggle activates map view', async ({ page }) => {
    await mapToggle(page).click();

    await expect(mapToggle(page)).toHaveAttribute('data-state', 'on');
    await expect(content(page)).toHaveClass(/translate-x-full/);
    await expect(content(page)).toHaveClass(/pointer-events-none/);
  });

  test('tapping again deactivates map view', async ({ page }) => {
    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('data-state', 'on');

    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('data-state', 'off');
    await expect(content(page)).not.toHaveClass(/translate-x-full/);
    await expect(content(page)).not.toHaveClass(/pointer-events-none/);
  });

  test('aria-label reflects toggle state', async ({ page }) => {
    await expect(mapToggle(page)).toHaveAttribute('aria-label', 'Show map');

    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('aria-label', 'Hide map');

    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('aria-label', 'Show map');
  });
});
