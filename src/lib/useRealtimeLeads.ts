import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CrmLead } from '@/types'

/**
 * useRealtimeLeads
 * ─────────────────
 * Subscribes to INSERT events on crm_leads via Supabase Realtime.
 * On a new lead:
 *   1. Invalidates ['crm_leads'] so the list refetches instantly.
 *   2. Fires a browser Notification (if permission is already granted).
 *
 * Permission requesting is handled separately in CallCRM to keep this
 * hook pure (no UI side-effects).
 */
export function useRealtimeLeads() {
  const qc = useQueryClient()
  const permRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  useEffect(() => {
    const syncPerm = () => {
      if (typeof Notification !== 'undefined') {
        permRef.current = Notification.permission
      }
    }
    document.addEventListener('visibilitychange', syncPerm)

    const channel = supabase
      .channel('crm_leads_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_leads' },
        (payload) => {
          qc.invalidateQueries({ queryKey: ['crm_leads'] })
          qc.invalidateQueries({ queryKey: ['crm_overdue_count'] })

          if (permRef.current === 'granted') {
            const lead = payload.new as Partial<CrmLead>
            const name  = lead.name  ?? 'Unknown'
            const phone = lead.phone ?? ''
            const src   = (lead as any).source ?? ''
            try {
              // Cast to any — `renotify` is valid at runtime but missing from
              // some older @types/web / lib.dom.d.ts versions in this project.
              const opts: any = {
                body: `${name}${phone ? ' · ' + phone : ''}${src ? ' · via ' + src : ''}`,
                icon: '/crm/favicon.ico',
                tag: `new-lead-${(lead as any).id ?? Date.now()}`,
                renotify: false,
              }
              const n = new Notification('🔔 New Lead — FanBe CRM', opts)
              setTimeout(() => n.close(), 8000)
            } catch {
              // Notification API can throw in sandboxed / private contexts
            }
          }
        }
      )
      .subscribe()

    return () => {
      document.removeEventListener('visibilitychange', syncPerm)
      supabase.removeChannel(channel)
    }
  }, [qc])
}
