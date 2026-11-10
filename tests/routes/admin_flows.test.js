import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../src/server.js';
import fs from 'node:fs';

describe('Admin Flows API & Toggle Controls', () => {
  let app;
  let testDb;

  beforeEach(async () => {
    testDb = `test_flows_${Math.random().toString(36).substring(2, 9)}.db`;
    app = await buildServer({ DB_PATH: testDb, EMAIL_PROVIDER: 'mock', ENABLE_AUTO_DISPATCH: 'false' });
  });

  afterEach(async () => {
    await app.close();
    try { if (fs.existsSync(testDb)) fs.unlinkSync(testDb); } catch (e) {}
    try { if (fs.existsSync(`${testDb}-wal`)) fs.unlinkSync(`${testDb}-wal`); } catch (e) {}
    try { if (fs.existsSync(`${testDb}-shm`)) fs.unlinkSync(`${testDb}-shm`); } catch (e) {}
  });

  it('lists all 5 behavioral flows with default disabled status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/flows' });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);

    expect(data.flows.length).toBe(5);
    const keys = data.flows.map(f => f.flow_key);
    expect(keys).toEqual(['welcome', 'abandoned_cart', 'browse_abandonment', 'winback', 'post_purchase']);

    for (const f of data.flows) {
      expect(f.is_enabled).toBe(false);
      expect(f.pendingCount).toBe(0);
      expect(f.sentCount).toBe(0);
    }
  });

  it('toggles a flow ON and OFF via POST /api/admin/flows/:flowKey/toggle', async () => {
    // 1. Toggle ON
    const toggleOnRes = await app.inject({
      method: 'POST',
      url: '/api/admin/flows/abandoned_cart/toggle',
      payload: { enabled: true }
    });
    expect(toggleOnRes.statusCode).toBe(200);
    const onData = JSON.parse(toggleOnRes.body);
    expect(onData.success).toBe(true);
    expect(onData.isEnabled).toBe(true);

    // Verify in database
    expect(app.db.isFlowEnabled('abandoned_cart')).toBe(true);

    // 2. Toggle OFF
    const toggleOffRes = await app.inject({
      method: 'POST',
      url: '/api/admin/flows/abandoned_cart/toggle',
      payload: { enabled: false }
    });
    expect(toggleOffRes.statusCode).toBe(200);
    const offData = JSON.parse(toggleOffRes.body);
    expect(offData.success).toBe(true);
    expect(offData.isEnabled).toBe(false);

    expect(app.db.isFlowEnabled('abandoned_cart')).toBe(false);
  });

  it('cancels pending jobs when a flow is toggled OFF', async () => {
    // Enable welcome flow and schedule a job
    app.db.setFlowEnabled('welcome', true);
    app.db.scheduleJob({
      flowType: 'welcome_1',
      recipientEmail: 'test_cancel@homecartel.ph',
      executeAt: new Date(Date.now() + 60000).toISOString()
    });
    app.db.scheduleJob({
      flowType: 'welcome_2',
      recipientEmail: 'test_cancel@homecartel.ph',
      executeAt: new Date(Date.now() + 120000).toISOString()
    });

    // Verify jobs are pending
    const initialJobs = app.db.getPendingDueJobs(new Date(Date.now() + 200000).toISOString());
    expect(initialJobs.filter(j => j.recipient_email === 'test_cancel@homecartel.ph').length).toBe(2);

    // Toggle flow OFF
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/flows/welcome/toggle',
      payload: { enabled: false }
    });
    expect(res.statusCode).toBe(200);

    // Verify pending jobs are cancelled
    const remainingJobs = app.db.getPendingDueJobs(new Date(Date.now() + 200000).toISOString());
    expect(remainingJobs.filter(j => j.recipient_email === 'test_cancel@homecartel.ph').length).toBe(0);
  });

  it('updates flow delay hours via POST /api/admin/flows/:flowKey/delay', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/flows/browse_abandonment/delay',
      payload: { delayHours: 4.5 }
    });
    expect(res.statusCode).toBe(200);

    const setting = app.db.getFlowSetting('browse_abandonment');
    expect(setting.delay_hours).toBe(4.5);
  });
});
