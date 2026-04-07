import { test, expect } from '../fixtures/auth';
import { Page } from '@playwright/test';

// Verify there's no horizontal overflow on the page
async function assertNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalOverflow).toBeFalsy();
}

test.describe('Admin Dashboard and Routes', () => {
  test('should render the admin dashboard and allow mobile drawer interaction', async ({ adminPage: page, isMobile }) => {
    // Auth fixture already logs in and lands on /admin
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await assertNoHorizontalOverflow(page);
    
    if (isMobile) {
      // Test mobile menu button accessibility and interaction
      const menuButton = page.locator('button[aria-label="Open navigation menu"]');
      await expect(menuButton).toBeVisible();
      
      // Click menu to open sidebar drawer
      await menuButton.click();
      
      // Wait for body scroll to be locked
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden', { timeout: 15000 });
      
      // Verify close button is accessible
      const closeButton = page.locator('button[aria-label="Close navigation menu"]').last();
      await expect(closeButton).toBeVisible();
      
      // Click close to dismiss sidebar
      await closeButton.click();
      
      // Wait for body scroll to be restored
      await expect(page.locator('body')).toHaveCSS('overflow', 'visible', { timeout: 15000 });
    }
  });

  test('should navigate to different admin routes without horizontal overflow', async ({ adminPage: page }) => {
    const routes = [
      '/admin/orders',
      '/admin/customers',
      '/admin/members',
      '/admin/creators',
      '/admin/intakes',
      '/admin/marketing',
      '/admin/inventory'
    ];

    for (const route of routes) {
      // Navigate, waiting for the navigation to fully resolve
      await page.goto(route, { waitUntil: 'commit' });
      await page.waitForURL(`**${route}**`);
      await page.waitForLoadState('networkidle');
      // Assert no horizontal scrolling issue
      await assertNoHorizontalOverflow(page);
    }
  });
});

