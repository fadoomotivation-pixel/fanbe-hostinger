// Surfaces "you forgot to call X today" reminders to the employee. Data
// comes from the missed_followups_for_employee(uuid) Supabase RPC, which
// looks for leads with follow_up_date <= today AND no call to that lead's
// phone in the last 24h. The RPC runs server-side so it's always fresh
// (no client cache invalidation needed).
//
// Auto-hides when:
//   • The RPC returns an empty list (nothing forgotten)
//   • The user dismisses with the X button (in-memory only, comes back
//     on next mount — intentional: a fresh page-load == another chance
//     to remind)

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Phone, ChevronRight, X } from 'lucide-react';

export default function MissedFollowupsBanner() {
  const { user } = useAuth();
  const [missed, setMissed] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    supabase
      .rpc('missed_followups_for_employee', { p_employee_id: user.id })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.warn('[MissedFollowups]', error.message); return; }
        setMissed(data || []);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  if (dismissed || missed.length === 0) return null;

  const top = missed.slice(0, expanded ? missed.length : 3);

  return (
    <div className="mx-3 mt-3 rounded-2xl border border-rose-200 bg-rose-50/70 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertCircle size={14} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-800">
              {missed.length} missed follow-up{missed.length === 1 ? '' : 's'}
            </p>
            <p className="text-[11px] text-rose-600/80">
              You haven't called these leads in the last 24h
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-100 active:scale-95"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <div className="border-t border-rose-200/60 divide-y divide-rose-200/40">
        {top.map(l => {
          const tel = (l.phone || '').replace(/\D/g, '');
          return (
            <div key={l.lead_id} className="flex items-center gap-2 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{l.lead_name || 'Unknown'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-rose-600 font-bold">
                    {l.days_overdue === 0 ? 'TODAY' :
                     l.days_overdue === 1 ? '1 day overdue' :
                     `${l.days_overdue} days overdue`}
                  </span>
                  {l.project && <span className="text-[10px] text-gray-400 truncate">· {l.project}</span>}
                </div>
              </div>
              {tel && (
                <a
                  href={`tel:${tel}`}
                  className="flex-shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-emerald-500 text-white text-xs font-bold active:scale-95"
                >
                  <Phone size={12} /> Call
                </a>
              )}
            </div>
          );
        })}
      </div>

      {missed.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 border-t border-rose-200/60"
        >
          {expanded ? 'Show fewer' : `Show ${missed.length - 3} more`}
          <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}
    </div>
  );
}
