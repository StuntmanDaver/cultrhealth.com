import { test as base, expect, Page } from '@playwright/test';

// Typically 'stewart@cultrhealth.com' is allowed for staging bypass
const ADMIN_EMAIL = 'stewart@cultrhealth.com';

type AuthFixtures = {
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    let response = await page.request.post('/api/auth/magic-link', {
      data: { email: ADMIN_EMAIL, redirect: '/admin' }
    });
    
    // Simple retry for rate-limits
    if (!response.ok()) {
      await page.waitForTimeout(2000);
      response = await page.request.post('/api/auth/magic-link', {
        data: { email: ADMIN_EMAIL, redirect: '/admin' }
      });
    }
    
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    
    // The staging bypass returns redirectUrl directly instead of sending email
    expect(json.success).toBeTruthy();
    expect(json.stagingAccess).toBeTruthy();
    expect(json.redirectUrl).toBeDefined();
    
    // Follow the magic link, which hits /api/auth/verify, sets cookies, and redirects to /admin
    await page.goto(json.redirectUrl);
    
    // Wait to land on the admin page
    await page.waitForURL('**/admin**');
    await page.waitForLoadState('networkidle');
    
    await use(page);
    await context.close();
  }
});

export { expect };
