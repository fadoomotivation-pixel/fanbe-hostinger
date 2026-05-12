import { useEffect, useRef } from 'react'
import type { CrmLead } from '@/types'

// Fires a desktop notification when a lead's next_follow_up_at becomes due.
// Each (lead, scheduled-time) pair fires at most once per browser session.
export function useFollowUpNotifications(leads: CrmLead[]) {
  const fired = useRef<Set<string>>(new Set())
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    timers.current.forEach(clearTimeout)
    timers.current = []

    const now = Date.now()
    for (const l of leads) {
      if (!l.next_follow_up_at) continue
      if (l.status === 'lost' || l.status === 'booked') continue
      const due = new Date(l.next_follow_up_at).getTime()
      const key = `${l.id}:${l.next_follow_up_at}`
      if (fired.current.has(key)) continue
      const delay = due - now
      const fire = () => {
        if (fired.current.has(key)) return
        fired.current.add(key)
        if (Notification.permission === 'granted') {
          const n = new Notification(`Follow up: ${l.name}`, {
            body: `${l.phone}${l.quick_note ? ' · ' + l.quick_note : ''}`,
            tag: l.id,
          })
          n.onclick = () => { window.focus(); n.close() }
        }
      }
      if (delay <= 0) fire()
      else if (delay < 6 * 60 * 60 * 1000) {
        timers.current.push(window.setTimeout(fire, delay))
      }
    }
    return () => { timers.current.forEach(clearTimeout); timers.current = [] }
  }, [leads])
}
