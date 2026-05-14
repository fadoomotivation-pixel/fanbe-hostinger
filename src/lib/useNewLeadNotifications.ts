import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { CrmLead } from '@/types'

/**
 * useNewLeadNotifications
 *
 * Subscribes to the crm_leads Supabase Realtime channel for INSERT events.
 * When a new lead arrives, fires a browser Notification (if permission granted)
 * and calls the optional onNewLead callback so the caller can invalidate queries.
 *
 * Design notes:
 * - Uses a seen-IDs ref so rapid re-renders never double-fire for the same lead.
 * - Channel is torn down and recreated if supabase client identity changes.
 * - Requests permission lazily on first INSERT rather than on mount, to avoid
 *   a cold permission prompt before the user has seen any benefit.
 */
export function useNewLeadNotifications(onNewLead?: (lead: CrmLead) => void) {
  const seen    = useRef<Set<string>>(new Set())
  const cbRef   = useRef(onNewLead)
  cbRef.current = onNewLead   // keep ref fresh without re-subscribing

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const channel = supabase
      .channel('crm_leads:new')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_leads' },
        async (payload) => {
          const lead = payload.new as CrmLead
          if (!lead?.id || seen.current.has(lead.id)) return
          seen.current.add(lead.id)

          // Request permission lazily on first real event
          if (Notification.permission === 'default') {
            await Notification.requestPermission().catch(() => {})
          }

          if (Notification.permission === 'granted') {
            const n = new Notification('🆕 New lead assigned', {
              body: `${lead.name ?? 'Unknown'} · ${lead.phone ?? ''}${
                lead.source ? ' · ' + lead.source : ''
              }`,
              tag: `new-lead:${lead.id}`,
              // icon can be added here once a favicon path is confirmed
            })
            n.onclick = () => { window.focus(); n.close() }
          }

          // Propagate to caller (e.g. invalidate React Query cache)
          cbRef.current?.(lead)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // empty deps — channel is stable for the lifetime of the component
}
