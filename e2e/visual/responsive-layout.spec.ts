import { test, expect } from '../fixtures/auth';
import { test as baseTest } from '@playwright/test';

test.describe('Responsive Layout & Visual Checks', () => {
  test('Admin dashboard should not have horizontal overflow, key elements should be visible', async ({ adminPage: page }) => {
    // Assert no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // Assert key shell elements visible
    const topBar = page.locator('header, div.border-b').first();
    await expect(topBar).toBeVisible();
    
    // Check that CULTR brand is somewhere on screen
    await expect(page.locator('body')).toContainText('CULTR');
  });

  baseTest('Join landing should not have horizontal overflow, key elements should be visible', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => {
      errors.push(err);
    });

    await page.goto('/join');
    
    // Assert no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();

    // Assert key elements visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    // Verify no major console/render errors (React runtime crashes)
    expect(errors.length).toBe(0);
  });
});
