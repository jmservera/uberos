// S9 - The system menu can reset an individual service without a full stack
// restart (BR-007). The control plane restarts one allowlisted service and it
// recovers to healthy while the others keep running.
import { test, expect } from '@playwright/test';
import { SERVICES, healthSnapshot } from '../helpers/stack.js';

test.describe('S9 - per-service reset', () => {
  test('control plane lists resettable services with health', async ({ request }) => {
    const cfg = await request.get('/control/config');
    expect(cfg.status()).toBe(200);
    const { services: allowlist } = await cfg.json();
    expect(Array.isArray(allowlist)).toBe(true);

    const res = await request.get('/control/services');
    expect(res.status()).toBe(200);
    const { services } = await res.json();
    expect(Array.isArray(services)).toBe(true);

    const names = services.map((s) => s.name);
    // /control/services should reflect exactly the allowlisted resettable names.
    expect(names.sort()).toEqual([...allowlist].sort());

    for (const svc of services) {
      expect(typeof svc.name).toBe('string');
      expect(typeof svc.state).toBe('string');
      expect(typeof svc.status).toBe('string');
      expect(typeof svc.health).toBe('string');
    }
  });

  test('control plane lists installed simulators with lifecycle state', async ({ request }) => {
    const res = await request.get('/control/simulators');
    expect(res.status()).toBe(200);

    const { simulators } = await res.json();
    expect(Array.isArray(simulators)).toBe(true);

    const allowedStates = new Set([
      'available',
      'starting',
      'running',
      'stopped',
      'failed',
      'unknown',
    ]);

    for (const sim of simulators) {
      expect(typeof sim.id).toBe('string');
      expect(typeof sim.label).toBe('string');
      expect(typeof sim.service).toBe('string');
      expect(typeof sim.transport).toBe('string');
      expect(typeof sim.panelRoute).toBe('string');
      expect(typeof sim.rosIntegration).toBe('string');
      expect(typeof sim.autostart).toBe('boolean');
      expect(typeof sim.enabled).toBe('boolean');
      expect(typeof sim.state).toBe('string');
      expect(allowedStates.has(sim.state), `${sim.id} state`).toBe(true);
    }
  });

  test('restarting one service recovers it and leaves others running', async ({ request }) => {
    // Editor is the least disruptive service to bounce.
    const target = 'editor';
    const others = SERVICES.filter((s) => s !== target && s !== 'proxy');

    const res = await request.post(`/control/services/${target}/restart`);
    expect(res.status()).toBe(200);
    expect((await res.json()).restarted).toBe(target);

    // Poll until the restarted service reports healthy again.
    await expect
      .poll(() => healthSnapshot()[target], { timeout: 60_000, intervals: [2000] })
      .toBe('healthy');

    // The other services were never stopped.
    const after = healthSnapshot();
    for (const svc of others) {
      expect(after[svc], `${svc} kept running`).not.toBe('exited');
    }
  });

  test('a service outside the allowlist cannot be restarted', async ({ request }) => {
    const res = await request.post('/control/services/proxy/restart');
    expect(res.status()).toBe(403);
  });
});
