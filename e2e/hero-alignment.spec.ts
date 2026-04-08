import { test, expect } from '@playwright/test';

test.describe('Hero headline alignment over bending girl', () => {
  test('headline text is positioned over the bending girl in the hero image', async ({ page, viewport }) => {
    // Skip on mobile-sized viewports where hero text is below the image
    if (!viewport || viewport.width < 768) {
      test.skip();
      return;
    }

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Target the desktop hero specifically by its unique class combination
    const heroSection = page.locator('section.grad-dark-glow.md\\:flex');
    await expect(heroSection).toBeVisible({ timeout: 15000 });

    // Wait for hero image to load
    const heroImage = heroSection.locator('img').first();
    await heroImage.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Get the h1 bounding box
    const h1 = heroSection.locator('h1');
    await expect(h1).toBeVisible();

    const h1Box = await h1.boundingBox();
    const sectionBox = await heroSection.boundingBox();

    expect(h1Box).toBeTruthy();
    expect(sectionBox).toBeTruthy();

    if (!h1Box || !sectionBox) return;

    // Calculate the h1 center position as a percentage of the section width
    const h1CenterX = h1Box.x + h1Box.width / 2;
    const sectionLeft = sectionBox.x;
    const sectionWidth = sectionBox.width;
    const h1CenterPct = ((h1CenterX - sectionLeft) / sectionWidth) * 100;

    console.log(`Viewport: ${viewport.width}x${viewport.height}`);
    console.log(`H1 center: ${h1CenterPct.toFixed(1)}% from left (${h1CenterX.toFixed(0)}px)`);
    console.log(`H1 box: x=${h1Box.x.toFixed(0)} w=${h1Box.width.toFixed(0)}`);
    console.log(`Section box: x=${sectionBox.x.toFixed(0)} w=${sectionBox.width.toFixed(0)}`);

    // The bending girl is at roughly 25-30% from the left of the image.
    // The text should be centered somewhere in the 20-38% range to overlap her.
    expect(h1CenterPct).toBeGreaterThan(18);
    expect(h1CenterPct).toBeLessThan(38);

    // Take a screenshot for visual verification
    await heroSection.screenshot({
      path: `test-results/hero-${viewport.width}x${viewport.height}.png`,
    });
  });
});
