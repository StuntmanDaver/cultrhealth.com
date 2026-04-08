import { test, expect } from '@playwright/test';

test.describe('Join Host Routing and Behavior', () => {
  test.use({ baseURL: 'http://localhost:3000/join' });

  test('should render the join landing page without redirecting', async ({ page }) => {
    const response = await page.goto('/join');
    expect(response?.ok()).toBeTruthy();
    
    await expect(page.locator('h1')).toContainText('Choose the level of support');
  });

  test('should navigate to tier checkout pages correctly', async ({ page }) => {
    // core requires a therapy parameter, others do not
    const paths = ['/join/core?therapy=semaglutide', '/join/catalyst', '/join/concierge', '/join/club'];
    for (const path of paths) {
      await page.goto(path, { waitUntil: 'commit' });
      await page.waitForURL(`**${path.split('?')[0]}**`);
      // Wait for page to settle
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain(path.split('?')[0]);
      // Also verify some basic text exists indicating rendering worked
      await expect(page.locator('body')).toContainText('CULTR');
    }
  });

  test('should prevent body scroll when consent modal is open', async ({ page, isMobile }) => {
    await page.goto('/join/catalyst');
    
    // Click the consent review button
    const consentButton = page.locator('button:has-text("Review & sign informed consent")');
    await expect(consentButton).toBeVisible();
    await consentButton.click();

    // Verify modal is open and body scroll is locked
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden', { timeout: 15000 });
  });
});
