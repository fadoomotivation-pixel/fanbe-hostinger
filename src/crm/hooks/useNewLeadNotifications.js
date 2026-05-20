// Fires a browser Notification + invokes onNewLead callback when a lead
// is freshly assigned (INSERT or UPDATE on leads.assigned_to → me) by
// admin or via reassign flow.
//
// Uses Supabase Realtime postgres_changes with a server-side filter so
// only events for this user's UUID reach the client.
//
// `recently` guard (60s): UPDATE fires for unrelated column changes too
// (status, follow_up_date etc.). Only fire the notification when the
// assignment is fresh — assigned_at within last minute. Otherwise every
// edit of an existing assigned lead would re-notify.
//
// Mobile-safety: same try/catch + sticky-disable pattern as
// useFollowUpNotifications so Chrome/Brave Android (which can't
// construct Notification directly) downgrades silently instead of
// crashing the app.

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const FRESHNESS_MS = 60 * 1000;

export function useNewLeadNotifications(onNewLead) {
  const { user } = useAuth();
  const supportsDirectNotification = useRef(true);

  useEffect(() => {
    if (!user?.id) return;

    const handler = (payload) => {
      const lead = payload?.new;
      if (!lead || lead.assigned_to !== user.id) return;

      const assignedAt = lead.assigned_at ? new Date(lead.assigned_at).getTime() : 0;
      if (!assignedAt || Date.now() - assignedAt > FRESHNESS_MS) return;

      // Browser notification (no-op gracefully on mobile WebView)
      if (typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          supportsDirectNotification.current) {
        try {
          const n = new Notification(`🎯 New lead assigned: ${lead.full_name || 'Lead'}`, {
            body: `${lead.phone || ''}${lead.project ? ' · ' + lead.project : ''}`,
            tag: `new-lead-${lead.id}`,
          });
          n.onclick = () => { window.focus(); n.close(); };
        } catch (err) {
          console.warn('[useNewLeadNotifications] Direct Notification not supported here — disabling for this session.', err && err.message);
          supportsDirectNotification.current = false;
        }
      }

      // Always invoke the in-app callback so the UI can show a toast/banner
      // even when the browser-level notification isn't available.
      try { onNewLead?.(lead); } catch { /* swallow */ }
    };

    const channel = supabase
      .channel(`new-leads-${user.id}`)
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'leads', filter: `assigned_to=eq.${user.id}` },
          handler)
      .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'leads', filter: `assigned_to=eq.${user.id}` },
          handler)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, onNewLead]);
}
