import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../../src/server.js';
import fs from 'node:fs';

describe('Admin Manual Send & Staged Behavioral Flows', () => {
  let app;
  let testDb;

  beforeEach(async () => {
    testDb = `test_manual_${Math.random().toString(36).substring(2, 9)}.db`;
    app = await buildServer({ DB_PATH: testDb, EMAIL_PROVIDER: 'mock', ENABLE_AUTO_DISPATCH: 'false' });
  });

  afterEach(async () => {
    await app.close();
    try { if (fs.existsSync(testDb)) fs.unlinkSync(testDb); } catch (e) {}
    try { if (fs.existsSync(`${testDb}-wal`)) fs.unlinkSync(`${testDb}-wal`); } catch (e) {}
    try { if (fs.existsSync(`${testDb}-shm`)) fs.unlinkSync(`${testDb}-shm`); } catch (e) {}
  });

  it('stages Flow 1 to Flow 5 without sending automatically', async () => {
    // Stage Flow 1: Abandoned Cart
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/admin/simulate',
      payload: { scenario: 'abandoned_cart', data: { email: 'client1@homecartel.ph', name: 'Client One' } }
    });
    expect(res1.statusCode).toBe(200);

    // Stage Flow 2: Welcome
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/admin/simulate',
      payload: { scenario: 'welcome', data: { email: 'client2@homecartel.ph', name: 'Client Two' } }
    });
    expect(res2.statusCode).toBe(200);

    // Stage Flow 3: Browse Abandonment
    const res3 = await app.inject({
      method: 'POST',
      url: '/api/admin/simulate',
      payload: { scenario: 'browse_abandonment', data: { email: 'client3@homecartel.ph', name: 'Client Three' } }
    });
    expect(res3.statusCode).toBe(200);

    // Stage Flow 4: Post-Purchase
    const res4 = await app.inject({
      method: 'POST',
      url: '/api/admin/simulate',
      payload: { scenario: 'post_purchase', data: { email: 'client4@homecartel.ph', name: 'Client Four' } }
    });
    expect(res4.statusCode).toBe(200);

    // Stage Flow 5: Winback
    const res5 = await app.inject({
      method: 'POST',
      url: '/api/admin/simulate',
      payload: { scenario: 'winback', data: { email: 'client5@homecartel.ph', name: 'Client Five' } }
    });
    expect(res5.statusCode).toBe(200);

    // Fetch staged jobs
    const stagedRes = await app.inject({
      method: 'GET',
      url: '/api/admin/staged-jobs'
    });
    expect(stagedRes.statusCode).toBe(200);
    const data = JSON.parse(stagedRes.body);
    expect(data.stagedJobs.length).toBe(5);

    // Verify all 5 flow numbers and emails are listed
    const flows = data.stagedJobs.map(j => ({ flow: j.flowNumber, email: j.recipientEmail }));
    expect(flows).toContainEqual({ flow: 1, email: 'client1@homecartel.ph' });
    expect(flows).toContainEqual({ flow: 2, email: 'client2@homecartel.ph' });
    expect(flows).toContainEqual({ flow: 3, email: 'client3@homecartel.ph' });
    expect(flows).toContainEqual({ flow: 4, email: 'client4@homecartel.ph' });
    expect(flows).toContainEqual({ flow: 5, email: 'client5@homecartel.ph' });

    // Verify 0 emails have been sent yet (safety guarantee)
    const logsRes = await app.inject({ method: 'GET', url: '/api/admin/overview' });
    const overview = JSON.parse(logsRes.body);
    expect(overview.counts.sentEmails).toBe(0);
  });

  it('manually sends a specific client flow when button is triggered', async () => {
    // Stage Flow 1 for client
    const simRes = await app.inject({
      method: 'POST',
      url: '/api/admin/simulate',
      payload: { scenario: 'abandoned_cart', data: { email: 'maria.test@homecartel.ph' } }
    });
    const { jobId } = JSON.parse(simRes.body);

    // Trigger manual send for this specific job
    const sendRes = await app.inject({
      method: 'POST',
      url: `/api/admin/jobs/${jobId}/send`
    });
    expect(sendRes.statusCode).toBe(200);
    const sendData = JSON.parse(sendRes.body);
    expect(sendData.success).toBe(true);
    expect(sendData.to).toBe('maria.test@homecartel.ph');
    expect(sendData.flow).toBe('abandoned_cart');

    // Verify email log recorded
    const overviewRes = await app.inject({ method: 'GET', url: '/api/admin/overview' });
    const overview = JSON.parse(overviewRes.body);
    expect(overview.counts.sentEmails).toBe(1);
    expect(overview.logs[0].recipient_email).toBe('maria.test@homecartel.ph');

    // Verify it is no longer in pending staged list
    const stagedRes = await app.inject({ method: 'GET', url: '/api/admin/staged-jobs' });
    const stagedData = JSON.parse(stagedRes.body);
    expect(stagedData.stagedJobs.filter(j => j.id === jobId).length).toBe(0);
  });
});
