import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useNewLeadNotifications
 * ───────────────────────
 * Subscribes to `INSERT` events on `crm_leads` via Supabase Realtime.
 * Fires a browser notification (if permission granted) and calls onNewLead
 * so the parent can refetch / show a toast / play a sound.
 *
 * In this snapshot `@/lib/supabase` exports `null`, so the hook gracefully
 * no-ops. In the production CRM where supabase is wired, it runs.
 *
 * @param {(lead: any) => void} [onNewLead] - optional callback per new row
 */
export function useNewLeadNotifications(onNewLead) {
  const permRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const cbRef = useRef(onNewLead);
  cbRef.current = onNewLead;

  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return;

    const syncPerm = () => {
      if (typeof Notification !== 'undefined') {
        permRef.current = Notification.permission;
      }
    };
    document.addEventListener('visibilitychange', syncPerm);

    const channel = supabase
      .channel('crm_leads_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_leads' },
        (payload) => {
          const lead = payload.new || {};
          cbRef.current?.(lead);
          if (permRef.current !== 'granted') return;
          try {
            const name  = lead.name  ?? 'Unknown';
            const phone = lead.phone ?? '';
            const src   = lead.source ?? '';
            const n = new Notification('🔔 New Lead — FanBe CRM', {
              body: `${name}${phone ? ' · ' + phone : ''}${src ? ' · via ' + src : ''}`,
              icon: '/crm/favicon.ico',
              tag: `new-lead-${lead.id ?? Date.now()}`,
            });
            setTimeout(() => n.close(), 8000);
          } catch { /* notifications can throw in sandboxed contexts */ }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', syncPerm);
      try { supabase.removeChannel(channel); } catch { /* no-op */ }
    };
  }, []);
}
