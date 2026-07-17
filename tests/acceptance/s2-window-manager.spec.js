// S2 - Browser shows the window manager with at least one embedded panel.
// Machine-testable version: root returns 200 and the DOM contains at least one
// iframe with a src attribute (the Golden Layout canvas builds iframe panels).
import { test, expect } from '@playwright/test';

test.describe('S2 - window manager renders panels', () => {
  test('root returns 200', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
  });

  test('canvas contains at least one iframe panel with a src', async ({ page }) => {
    await page.goto('/');
    const frames = page.locator('iframe.panel-frame');
    await expect(frames.first()).toBeAttached({ timeout: 20_000 });

    const count = await frames.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const src = await frames.nth(i).getAttribute('src');
      expect(src, `iframe ${i} should have a src`).toBeTruthy();
    }
  });
});
