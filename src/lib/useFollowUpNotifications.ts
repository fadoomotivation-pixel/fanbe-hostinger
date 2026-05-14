import { useEffect, useRef } from 'react'
import type { CrmLead } from '@/types'

const WARN_BEFORE_MS = 15 * 60 * 1000 // 15 minutes pre-warning

// Fires a desktop notification when a lead's next_follow_up_at becomes due.
// Also fires a 15-minute early warning so the telecaller can prepare.
// Each (lead, scheduled-time) pair fires at most once per browser session.
export function useFollowUpNotifications(leads: CrmLead[]) {
  const fired  = useRef<Set<string>>(new Set())
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

      // On-time notification
      if (!fired.current.has(key)) {
        const delay = due - now
        const fire = () => {
          if (fired.current.has(key)) return
          fired.current.add(key)
          if (Notification.permission === 'granted') {
            const n = new Notification(`📞 Follow up: ${l.name}`, {
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

      // 15-minute pre-warning
      const warnKey = `${key}:warn`
      if (!fired.current.has(warnKey)) {
        const warnDelay = due - WARN_BEFORE_MS - now
        if (warnDelay > 0 && warnDelay < 6 * 60 * 60 * 1000) {
          timers.current.push(window.setTimeout(() => {
            if (fired.current.has(warnKey)) return
            fired.current.add(warnKey)
            if (Notification.permission === 'granted') {
              new Notification(`⏰ Call in 15 min: ${l.name}`, {
                body: `${l.phone}${l.quick_note ? ' · ' + l.quick_note : ''}`,
                tag: `${l.id}:warn`,
              })
            }
          }, warnDelay))
        }
      }
    }

    return () => { timers.current.forEach(clearTimeout); timers.current = [] }
  }, [leads])
}
