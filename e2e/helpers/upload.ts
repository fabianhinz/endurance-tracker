import { type Page, expect } from '@playwright/test';

/**
 * Uploads FIT files via the hidden file input and waits for the upload
 * done message to appear in the UploadProgress banner.
 */
export const uploadFitFiles = async (page: Page, filePaths: string[]) => {
  const fileInput = page.locator('input[type="file"][accept=".fit"]');
  await fileInput.setInputFiles(filePaths);

  // Wait for the done message banner (UploadProgress shows doneMessage after upload)
  const doneBanner = page.locator('.fixed.bottom-6 span.text-sm.font-semibold');
  await expect(doneBanner).toBeVisible({ timeout: 30_000 });

  return doneBanner;
};
