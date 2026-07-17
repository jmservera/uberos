// S6 - Code editor panel can open, edit, and save a file in the ROS workspace.
// Machine-testable version: the ROS container reads the saved content at the
// same workspace path. The editor (code-server) and the ROS container share
// /ros_ws/src, so a file written through the editor container must be byte-for-
// byte readable from the ROS container (I-13: editor writes the ROS build tree).
import { test, expect } from '@playwright/test';
import { execInService } from '../helpers/stack.js';

test.describe('S6 - editor saves into the shared ROS workspace', () => {
  test('editor endpoint is reachable through the proxy', async ({ request }) => {
    // code-server issues a redirect to its workbench; any non-5xx proves routing.
    const res = await request.get('/editor/', { maxRedirects: 0 });
    expect(res.status()).toBeLessThan(400);
  });

  test('a file saved via the editor container is readable from the ROS container', () => {
    const name = `s6_${Date.now()}.txt`;
    const content = `uberos-s6-${Date.now()}`;

    // Simulate an editor save into the shared workspace.
    execInService('editor', `printf '%s' '${content}' > /ros_ws/src/${name}`);

    let readBack = '';
    try {
      readBack = execInService('ros', `cat /ros_ws/src/${name}`).trim();
      expect(readBack).toBe(content);
    } finally {
      // Clean up the marker file from the shared volume.
      execInService('ros', `rm -f /ros_ws/src/${name}`);
    }
  });
});
