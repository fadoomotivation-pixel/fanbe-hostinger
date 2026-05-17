
import { sendEmail } from './emailService';

const DIGEST_KEY = 'crm_last_daily_digest';

export const checkDailyDigest = async (leads, employees) => {
  const lastRun = localStorage.getItem(DIGEST_KEY);
  const now = new Date();
  const todayStr = now.toDateString();

  // If already run today, skip
  if (lastRun === todayStr) return;

  // Ideally run after 9 AM
  if (now.getHours() < 9) return;

  console.log('[Scheduler] Running Daily Digest...');

  // Calculate Stats
  const newLeads = leads.filter(l => new Date(l.createdAt).toDateString() === todayStr).length; // Mocking today logic for demo
  const siteVisits = leads.filter(l => l.status === 'Site Visit Done').length; // Just total for demo simplicity
  const bookings = leads.filter(l => l.status === 'Booked').length;
  const unassigned = leads.filter(l => !l.assignedTo).length;

  // Find top performer (mock logic)
  const topPerformer = employees[0] ? { name: employees[0].name, actionCount: 15 } : null;

  try {
    await sendEmail({
      recipientEmail: 'admin@fanbegroup.com',
      subject: `Daily Digest: ${todayStr}`,
      templateName: 'dailyDigest',
      templateParams: {
        stats: { newLeads, siteVisits, bookings, unassigned, topPerformer }
      }
    });
    localStorage.setItem(DIGEST_KEY, todayStr);
    console.log('[Scheduler] Daily Digest Sent.');
  } catch (e) {
    console.error('[Scheduler] Digest Failed', e);
  }
};
