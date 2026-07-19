// S5b - Golden Layout NATIVE pop-out DOCK-BACK, validated with a real Chromium.
//
// This drives Golden Layout's own header pop-out control (window.open), then
// CLOSES the detached window and asserts the panel docks back into the main
// canvas AT NON-ZERO SIZE with no duplicate. It targets the fix in
// services/frontend/src/App.svelte where settings.popInOnClose is false and our
// windowClosed handler re-docks via layout.addComponent(...). The previous bug
// left Simulator / ROS Status docked-but-0x0.
//
// REQUIRES a real Chromium (Playwright's bundled headless chromium honors a
// click-initiated window.open) — the integrated VS Code browser blocks it.
// Each panel runs as an independent test() from a fresh context (clean
// localStorage: uberos.layout.v1) so every panel starts present in the default
// layout and a failure in one still reports the others.
import { test, expect } from '@playwright/test';

// Panel identity in the MAIN canvas:
//  - iframe panels: iframe.panel-frame whose src contains `match`
//  - ros-status:    a .panel-body element (non-iframe)
// `title` is the Golden Layout tab title (.lm_title) used to find the stack.
const PANELS = [
  { key: 'simulator', title: 'Simulator', kind: 'iframe', match: 'novnc' },
  { key: 'terminal', title: 'Terminal', kind: 'iframe', match: '/terminal/' },
  { key: 'editor', title: 'Code Editor', kind: 'iframe', match: '/editor/' },
  { key: 'ros-status', title: 'ROS Status', kind: 'body', match: null },
];

// Runs in-page: count matching panel instances and measure the first one.
// Returns { count, w, h } — count is how many copies exist (dup detector),
// w/h are offsetWidth/offsetHeight of the first (zero-size bug detector).
function measurePanel(spec) {
  let els;
  if (spec.kind === 'iframe') {
    els = [...document.querySelectorAll('iframe.panel-frame')].filter((f) =>
      f.src.includes(spec.match)
    );
  } else {
    els = [...document.querySelectorAll('.panel-body')];
  }
  if (els.length === 0) return { count: 0, w: 0, h: 0 };
  const el = els[0];
  return { count: els.length, w: el.offsetWidth, h: el.offsetHeight };
}

// Wait until the default layout has fully rendered: all three iframe panels
// plus the ROS Status body. Guards against popping out before GL is ready.
async function waitForAllPanels(page) {
  await page.waitForFunction(
    () =>
      document.querySelectorAll('iframe.panel-frame').length >= 3 &&
      document.querySelectorAll('.panel-body').length >= 1,
    undefined,
    { timeout: 30_000 }
  );
}

test.describe('S5b - native pop-out docks back at non-zero size', () => {
  for (const spec of PANELS) {
    test(`${spec.title}: pop out -> close -> docks back visibly`, async ({
      page,
      context,
    }) => {
      await page.goto('/');
      await waitForAllPanels(page);

      // Sanity: panel present in the main canvas before pop-out.
      const before = await page.evaluate(measurePanel, spec);
      expect(before.count, `${spec.title} present before pop-out`).toBe(1);

      // 1) Drive Golden Layout's real pop-out control for THIS stack. GL opens
      //    the child window via window.open, which surfaces as a 'page' event.
      const header = page.locator('.lm_header', {
        has: page.locator('.lm_title', { hasText: spec.title }),
      });
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        header.locator('.lm_popout').click(),
      ]);
      await popup.waitForLoadState('domcontentloaded');

      // 2) Assert the panel MOVED OUT: it renders in the popup and is REMOVED
      //    from the main canvas.
      await expect
        .poll(async () => (await popup.evaluate(measurePanel, spec)).count, {
          message: `${spec.title} present in popped-out window`,
          timeout: 20_000,
        })
        .toBeGreaterThanOrEqual(1);

      await expect
        .poll(async () => (await page.evaluate(measurePanel, spec)).count, {
          message: `${spec.title} removed from main canvas after pop-out`,
          timeout: 20_000,
        })
        .toBe(0);

      // 3) Close the detached window to trigger dock-back. Use a script-
      //    initiated window.close() from INSIDE the popup rather than
      //    Playwright's page.close(): Golden Layout registers the dock-back
      //    trigger as a `beforeunload` listener on the child window from the
      //    PARENT realm, and only a real child-window unload (which
      //    window.close() produces) delivers that event. Playwright's
      //    popup.close({ runBeforeUnload: true }) does NOT fire the
      //    parent-registered listener, so GL never emits 'closed' and the
      //    panel would stay undocked — an artifact of the close mechanism, not
      //    the fix. (Empirically compared; window.close() is the real-user path.)
      await popup.evaluate(() => window.close()).catch(() => {});

      // 4) Assert dock-back happened AND the panel is rendered at non-zero size.
      //    Poll rather than sleep: dock-back runs after GL's ~50ms 'closed'
      //    event plus our settle tick.
      await expect
        .poll(async () => await page.evaluate(measurePanel, spec), {
          message: `${spec.title} docked back at non-zero size`,
          timeout: 20_000,
        })
        .toMatchObject({ count: 1 });

      const after = await page.evaluate(measurePanel, spec);
      // count === 1 => no duplicate; w/h > 0 => not the zero-size bug.
      expect(after.count, `${spec.title} exactly one instance (no duplicate)`).toBe(1);
      expect(after.w, `${spec.title} docked-back width > 0 (got ${after.w})`).toBeGreaterThan(0);
      expect(after.h, `${spec.title} docked-back height > 0 (got ${after.h})`).toBeGreaterThan(0);
    });
  }
});
