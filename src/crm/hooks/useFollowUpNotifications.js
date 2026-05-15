import { useEffect, useRef } from 'react';

const WARN_BEFORE_MS = 15 * 60 * 1000; // 15-min pre-warning
const MAX_HORIZON_MS = 6 * 60 * 60 * 1000; // only schedule timers within 6 hours

/**
 * useFollowUpNotifications
 * ────────────────────────
 * Fires a browser notification when a lead's follow-up time is due, and
 * a 15-minute pre-warning. Each (lead, dueIso) pair fires at most once per
 * browser session — re-mounting the component won't double-fire.
 *
 * Pass an array of lead objects with at minimum:
 *   { id, name, phone, nextFollowUpAt, status, quickNote? }
 *
 * Status values 'lost' and 'booked' are skipped.
 */
export function useFollowUpNotifications(leads) {
  const fired  = useRef(new Set());
  const timers = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const now = Date.now();
    for (const l of leads || []) {
      if (!l?.nextFollowUpAt) continue;
      if (l.status === 'lost' || l.status === 'booked' || l.status === 'Lost' || l.status === 'Booked') continue;

      const due = new Date(l.nextFollowUpAt).getTime();
      if (isNaN(due)) continue;
      const key = `${l.id}:${l.nextFollowUpAt}`;

      if (!fired.current.has(key)) {
        const delay = due - now;
        const fire = () => {
          if (fired.current.has(key)) return;
          fired.current.add(key);
          if (Notification.permission === 'granted') {
            const n = new Notification(`📞 Follow up: ${l.name}`, {
              body: `${l.phone || ''}${l.quickNote ? ' · ' + l.quickNote : ''}`,
              tag: l.id,
            });
            n.onclick = () => { window.focus(); n.close(); };
          }
        };
        if (delay <= 0) fire();
        else if (delay < MAX_HORIZON_MS) {
          timers.current.push(window.setTimeout(fire, delay));
        }
      }

      const warnKey = `${key}:warn`;
      if (!fired.current.has(warnKey)) {
        const warnDelay = due - WARN_BEFORE_MS - now;
        if (warnDelay > 0 && warnDelay < MAX_HORIZON_MS) {
          timers.current.push(window.setTimeout(() => {
            if (fired.current.has(warnKey)) return;
            fired.current.add(warnKey);
            if (Notification.permission === 'granted') {
              new Notification(`⏰ Call in 15 min: ${l.name}`, {
                body: `${l.phone || ''}${l.quickNote ? ' · ' + l.quickNote : ''}`,
                tag: `${l.id}:warn`,
              });
            }
          }, warnDelay));
        }
      }
    }

    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [leads]);
}
