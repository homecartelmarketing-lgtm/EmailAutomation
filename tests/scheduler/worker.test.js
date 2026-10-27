import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDatabase } from '../../src/db/database.js';
import { runSchedulerCycle } from '../../src/scheduler/worker.js';

describe('Scheduler Worker', () => {
  let db, mockSender, mockRenderer;
  beforeEach(() => {
    db = initDatabase(':memory:');
    mockSender = { send: vi.fn().mockResolvedValue({ messageId: 'msg_1' }) };
    mockRenderer = { render: vi.fn().mockReturnValue({ subject: 'Test Subject', html: '<html>Body</html>' }) };
  });

  it('dispatches due jobs and enforces 48-hour frequency cap on marketing emails', async () => {
    db.upsertCustomer({ email: 'buyer@test.com', name: 'Buyer', status: 'subscribed' });
    
    // Schedule two jobs due now
    db.scheduleJob({ flowType: 'welcome', recipientEmail: 'buyer@test.com', contextJson: '{}', executeAt: new Date().toISOString() });
    db.scheduleJob({ flowType: 'browse_abandonment', recipientEmail: 'buyer@test.com', contextJson: '{}', executeAt: new Date().toISOString() });

    const result = await runSchedulerCycle({ db, sender: mockSender, renderer: mockRenderer, now: new Date().toISOString() });
    
    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1); // Second email skipped due to 48h frequency cap
    expect(mockSender.send).toHaveBeenCalledTimes(1);
  });

  it('skips and cancels jobs for unsubscribed customers', async () => {
    db.upsertCustomer({ email: 'optout@test.com', name: 'Opt Out', status: 'unsubscribed' });
    db.scheduleJob({ flowType: 'welcome', recipientEmail: 'optout@test.com', contextJson: '{}', executeAt: new Date().toISOString() });

    const result = await runSchedulerCycle({ db, sender: mockSender, renderer: mockRenderer, now: new Date().toISOString() });
    expect(result.sent).toBe(0);
    expect(result.cancelled).toBe(1);
    expect(mockSender.send).not.toHaveBeenCalled();
  });
});
