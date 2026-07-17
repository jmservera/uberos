// S4 - Simulator GUI is visible in a noVNC panel.
// Machine-testable version: a non-blank frame appears within 30s and differs
// from all-black by more than 5% of pixels. This also exercises SPIKE-A P5:
// software-rendered Gazebo output reaching a browser noVNC canvas.
import { test, expect } from '@playwright/test';
import { pollNonBlackRatio } from '../helpers/stack.js';

test.describe('S4 - simulator GUI in noVNC', () => {
  test('noVNC renders a non-blank frame within 30s', async ({ page }) => {
    await page.goto('/novnc/vnc.html?autoconnect=true&resize=scale&path=novnc/websockify');

    const canvas = page.locator('#noVNC_canvas, canvas').first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    const ratio = await pollNonBlackRatio(page, 30_000, 0.05);
    expect(
      ratio,
      `non-black pixel ratio (${(ratio * 100).toFixed(1)}%) should exceed 5%`
    ).toBeGreaterThan(0.05);
  });
});
