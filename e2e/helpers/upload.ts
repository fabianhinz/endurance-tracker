import { type Page, expect } from '@playwright/test';

/**
 * Uploads FIT files via the hidden file input and waits for the upload
 * done message to appear as a Radix toast.
 */
export const uploadFitFiles = async (page: Page, filePaths: string[]) => {
  const fileInput = page.locator('input[type="file"][accept=".fit"]');
  await fileInput.setInputFiles(filePaths);

  // Wait for the done message toast (replaceProgressWithMessage adds data-testid="upload-done")
  const doneBanner = page.locator('[data-testid="upload-done"]');
  await expect(doneBanner).toBeVisible({ timeout: 30_000 });

  return doneBanner;
};
