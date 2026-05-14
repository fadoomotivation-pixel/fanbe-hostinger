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
  // Track notification permission across re-renders without causing re-renders
  const permRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  useEffect(() => {
    // Keep permRef in sync if the user grants/denies while on the page
    const syncPerm = () => {
      if (typeof Notification !== 'undefined') {
        permRef.current = Notification.permission
      }
    }
    // Browsers fire 'permissionchange' on the Notification object (non-standard
    // but widely supported). We also sync on visibility change as a fallback.
    document.addEventListener('visibilitychange', syncPerm)

    const channel = supabase
      .channel('crm_leads_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_leads' },
        (payload) => {
          // 1. Invalidate query so LeadCard list refreshes immediately
          qc.invalidateQueries({ queryKey: ['crm_leads'] })
          qc.invalidateQueries({ queryKey: ['crm_overdue_count'] })

          // 2. Browser push notification
          if (permRef.current === 'granted') {
            const lead = payload.new as Partial<CrmLead>
            const name  = lead.name  ?? 'Unknown'
            const phone = lead.phone ?? ''
            const src   = (lead as any).source ?? ''
            try {
              const n = new Notification('🔔 New Lead — FanBe CRM', {
                body: `${name}${phone ? ' · ' + phone : ''}${src ? ' · via ' + src : ''}`,
                icon: '/crm/favicon.ico',
                tag: `new-lead-${(lead as any).id ?? Date.now()}`,
                renotify: false,
              })
              // Auto-close after 8 s so it doesn't stack up
              setTimeout(() => n.close(), 8000)
            } catch {
              // Notification API can throw in some environments (iframe, private)
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
