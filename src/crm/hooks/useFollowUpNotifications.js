import { useEffect, useRef } from 'react';

const WARN_BEFORE_MS = 15 * 60 * 1000;
const MAX_SCHEDULE_HORIZON_MS = 6 * 60 * 60 * 1000;

function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = String(dateStr).split('T')[0];
  const t = timeStr || '10:00:00';
  const iso = `${d}T${t}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getTime();
}

function leadDueAt(lead) {
  const date = lead.followUpDate || lead.follow_up_date || lead.next_followup_date;
  if (!date) return null;
  if (typeof date === 'string' && date.includes('T')) {
    const parsed = new Date(date).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  const time = lead.followUpTime || lead.follow_up_time || lead.next_followup_time;
  return combineDateAndTime(date, time);
}

const FINISHED_STATUSES = new Set([
  'lost', 'Lost', 'booked', 'Booked', 'NotInterested', 'not_interested',
]);

export function useFollowUpNotifications(leads) {
  const fired  = useRef(new Set());
  const timers = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const now = Date.now();
    for (const l of leads || []) {
      if (!l || FINISHED_STATUSES.has(l.status)) continue;
      const due = leadDueAt(l);
      if (due === null) continue;

      const key = `${l.id}:${due}`;

      const fire = () => {
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

      const delay = due - now;
      if (!fired.current.has(key)) {
        if (delay <= 0) fire();
        else if (delay < MAX_SCHEDULE_HORIZON_MS) {
          timers.current.push(window.setTimeout(fire, delay));
        }
      }

      const warnKey = `${key}:warn`;
      if (!fired.current.has(warnKey)) {
        const warnDelay = due - WARN_BEFORE_MS - now;
        if (warnDelay > 0 && warnDelay < MAX_SCHEDULE_HORIZON_MS) {
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
