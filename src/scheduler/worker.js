/**
 * Runs a single cycle of the delay scheduler.
 * Fetches all pending jobs due up to `now` and processes them according to frequency capping and subscription rules.
 *
 * @param {{
 *   db: ReturnType<import('../db/database.js').initDatabase>,
 *   sender: { send: (msg: { to: string, subject: string, html: string }) => Promise<{ messageId: string }> },
 *   renderer: { render: (templateName: string, context: any) => { subject: string, html: string } },
 *   now?: string
 * }} options
 * @returns {Promise<{ sent: number, skipped: number, cancelled: number }>}
 */
export async function runSchedulerCycle({ db, sender, renderer, now = new Date().toISOString() }) {
  const dueJobs = db.getPendingDueJobs(now);
  let sent = 0;
  let skipped = 0;
  let cancelled = 0;

  const nowMs = new Date(now).getTime();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  for (const job of dueJobs) {
    // 1. Check customer subscription status
    const customer = db.getCustomerByEmail(job.recipient_email);
    if (customer && customer.status === 'unsubscribed') {
      db.rawDb.prepare("UPDATE scheduled_jobs SET status = 'cancelled' WHERE id = ?").run(job.id);
      cancelled++;
      continue;
    }

    // 2. Frequency capping: max 1 marketing email per 48 hours
    const lastSentAt = db.getLastMarketingEmailTime(job.recipient_email);
    if (lastSentAt) {
      const diffMs = nowMs - new Date(lastSentAt).getTime();
      if (diffMs < FORTY_EIGHT_HOURS_MS) {
        db.markJobSkipped(job.id);
        skipped++;
        continue;
      }
    }

    // 3. Render and send
    try {
      const context = JSON.parse(job.context_json || '{}');
      const { subject, html } = renderer.render(job.flow_type, context);
      const { messageId } = await sender.send({
        to: job.recipient_email,
        subject,
        html
      });

      db.recordEmailLog({
        recipientEmail: job.recipient_email,
        flowName: job.flow_type,
        templateName: job.flow_type,
        messageId: messageId || ''
      });

      db.markJobSent(job.id);
      sent++;
    } catch (err) {
      db.rawDb.prepare("UPDATE scheduled_jobs SET status = 'failed' WHERE id = ?").run(job.id);
      cancelled++;
    }
  }

  return { sent, skipped, cancelled };
}
