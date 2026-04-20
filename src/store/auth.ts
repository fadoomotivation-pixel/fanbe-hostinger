import type { Session } from '@supabase/supabase-js'

let _session: Session | null = null
let _setSessionCallback: ((s: Session | null) => void) | null = null

export function getStoredSession() { return _session }
export function setStoredSession(s: Session | null) {
  _session = s
  _setSessionCallback?.(s)
}
export function onSessionChange(cb: (s: Session | null) => void) {
  _setSessionCallback = cb
}