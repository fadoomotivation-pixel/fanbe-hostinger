import { useEffect, useRef } from 'react';

// Schedule a browser Notification at each lead's follow-up time,
// plus a 15-minute pre-warning. De-dupes per (lead, dueTime) so the
// same reminder can't fire twice in one browser session. Caps timer
// horizon at 6 hours so we don't hold a stale setTimeout for days.

const WARN_BEFORE_MS = 15 * 60 * 1000;
const MAX_HORIZON_MS = 6 * 60 * 60 * 1000;

const FINISHED_STATUSES = new Set([
  'lost', 'Lost', 'booked', 'Booked', 'NotInterested', 'not_interested',
]);

// The live lead schema stores follow-up as separate date + time columns
// (follow_up_date YYYY-MM-DD + follow_up_time HH:MM:SS). Combine into
// a JS timestamp. Fall back to 10:00 local if time is missing.
function leadDueAt(lead) {
  if (!lead) return null;
  const date = lead.followUpDate || lead.follow_up_date || lead.next_followup_date;
  if (!date) return null;
  // Full ISO already
  if (typeof date === 'string' && date.includes('T')) {
    const t = new Date(date).getTime();
    return Number.isFinite(t) ? t : null;
  }
  const time = lead.followUpTime || lead.follow_up_time || lead.next_followup_time || '10:00:00';
  const t = new Date(`${String(date).split('T')[0]}T${time}`).getTime();
  return Number.isFinite(t) ? t : null;
}

export function useFollowUpNotifications(leads) {
  const fired  = useRef(new Set());
  const timers = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Clear timers from previous render — leads array re-mounts often.
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const now = Date.now();
    for (const l of leads || []) {
      if (!l || FINISHED_STATUSES.has(l.status)) continue;
      const due = leadDueAt(l);
      if (due === null) continue;
      const key = `${l.id}:${due}`;

      const fireDue = () => {
        if (fired.current.has(key)) return;
        fired.current.add(key);
        if (Notification.permission !== 'granted') return;
        const note = l.quickNote || l.last_note || '';
        const n = new Notification(`📞 Follow up: ${l.name || 'Lead'}`, {
          body: `${l.phone || ''}${note ? ' · ' + note : ''}`,
          tag: String(l.id),
        });
        n.onclick = () => { window.focus(); n.close(); };
      };

      if (!fired.current.has(key)) {
        const delay = due - now;
        if (delay <= 0) {
          fireDue();
        } else if (delay < MAX_HORIZON_MS) {
          timers.current.push(window.setTimeout(fireDue, delay));
        }
      }

      const warnKey = `${key}:warn`;
      if (!fired.current.has(warnKey)) {
        const warnDelay = due - WARN_BEFORE_MS - now;
        if (warnDelay > 0 && warnDelay < MAX_HORIZON_MS) {
          timers.current.push(window.setTimeout(() => {
            if (fired.current.has(warnKey)) return;
            fired.current.add(warnKey);
            if (Notification.permission !== 'granted') return;
            const note = l.quickNote || l.last_note || '';
            new Notification(`⏰ Call in 15 min: ${l.name || 'Lead'}`, {
              body: `${l.phone || ''}${note ? ' · ' + note : ''}`,
              tag: `${l.id}:warn`,
            });
          }, warnDelay));
        }
      }
    }

    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [leads]);
}
