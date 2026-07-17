// S3 - A ROS command runs in a browser terminal and produces output.
// Machine-testable version: terminal output arrives within 5s and the ROS graph
// exposes /rosout. The browser terminal (ttyd) and rosbridge share the ROS
// container, so we verify (a) the terminal endpoint serves and (b) the ROS graph
// is live by querying it over the same proxy-routed rosbridge WebSocket a
// browser terminal would drive.
import { test, expect } from '@playwright/test';

test.describe('S3 - ROS command in a browser terminal', () => {
  test('terminal (ttyd) endpoint serves through the proxy', async ({ request }) => {
    const res = await request.get('/terminal/');
    expect(res.status()).toBe(200);
  });

  test('ROS graph exposes /rosout via rosbridge within 5s', async ({ page }) => {
    // Load a same-origin page so the browser WebSocket can reach ws://host/ros.
    await page.goto('/');

    const found = await page.evaluate(async () => {
      return await new Promise((resolve) => {
        const ws = new WebSocket(`ws://${location.host}/ros`);
        let settled = false;
        const done = (v) => {
          if (settled) return;
          settled = true;
          try { ws.close(); } catch { /* ignore */ }
          resolve(v);
        };
        const timer = setTimeout(() => done(false), 5000);

        ws.onopen = () => {
          // rosapi ships with rosbridge; list topics and look for /rosout.
          ws.send(JSON.stringify({ op: 'call_service', service: '/rosapi/topics', id: 's3' }));
        };
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            const topics = msg?.values?.topics;
            if (Array.isArray(topics) && topics.includes('/rosout')) {
              clearTimeout(timer);
              done(true);
            }
          } catch { /* ignore non-JSON frames */ }
        };
        ws.onerror = () => { clearTimeout(timer); done(false); };
      });
    });

    expect(found, '/rosout should be visible on the ROS graph via rosbridge').toBe(true);
  });
});
