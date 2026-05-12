// Smart Quick Note intelligence: parse the note text + tag selection
// into structured signals so a telecaller never loses a lead.

export type LeadTag =
  | 'interested' | 'budget_issue' | 'call_later' | 'site_visit'
  | 'wrong_number' | 'not_interested' | 'switched_off' | 'callback_requested'

export type PickupStatus = 'picked' | 'not_picked' | 'wrong_number' | 'switched_off'

export interface SmartNoteResult {
  suggestedTags: LeadTag[]
  suggestedFollowUp: Date | null            // computed next follow-up datetime
  pickupStatus: PickupStatus | null
  requiresLostReason: boolean               // true when tagged not_interested
  missingNextAction: boolean                // true if no follow-up & no terminal status
  warnings: string[]
}

const TAG_KEYWORDS: Record<LeadTag, RegExp> = {
  interested:        /\b(interested|keen|positive|like(d)? (it|the project)|will buy|ready to book)\b/i,
  budget_issue:      /\b(budget|costly|expensive|too high|cheaper|lower price|emi|loan issue)\b/i,
  call_later:        /\b(call (me )?(later|tomorrow|next week|in (a )?(few|couple) days)|busy now|after \d+\s*(min|hr|hour|day))\b/i,
  site_visit:        /\b(site visit|visit (the )?site|come (to )?site|show (me )?the (plot|site)|visiting)\b/i,
  wrong_number:      /\b(wrong number|not (the )?right person|don'?t know|who is this)\b/i,
  not_interested:    /\b(not interested|don'?t call|stop calling|do not disturb|dnd|drop me)\b/i,
  switched_off:      /\b(switched off|switch(ed)? off|out of (coverage|reach|service)|unreachable)\b/i,
  callback_requested:/\b(call ?back|ring back|reach me|get back to me)\b/i,
}

const TIME_PATTERNS: Array<[RegExp, (m: RegExpMatchArray, now: Date) => Date | null]> = [
  // "tomorrow 5pm", "tomorrow at 11"
  [/tomorrow(?: at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i, (m, now) => {
    const d = new Date(now); d.setDate(d.getDate() + 1); return setHM(d, m)
  }],
  // "today 6pm"
  [/today(?: at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i, (m, now) => setHM(new Date(now), m)],
  // "in 2 days", "after 3 days"
  [/(?:in|after)\s+(\d+)\s*days?/i, (m, now) => {
    const d = new Date(now); d.setDate(d.getDate() + parseInt(m[1], 10)); d.setHours(11, 0, 0, 0); return d
  }],
  // "in 2 hours"
  [/(?:in|after)\s+(\d+)\s*(?:hr|hour)s?/i, (m, now) => {
    const d = new Date(now); d.setHours(d.getHours() + parseInt(m[1], 10)); return d
  }],
  // "next week"
  [/next week/i, (_m, now) => {
    const d = new Date(now); d.setDate(d.getDate() + 7); d.setHours(11, 0, 0, 0); return d
  }],
  // "next month"
  [/next month/i, (_m, now) => {
    const d = new Date(now); d.setMonth(d.getMonth() + 1); d.setHours(11, 0, 0, 0); return d
  }],
]

function setHM(d: Date, m: RegExpMatchArray): Date {
  let h = parseInt(m[1], 10); const min = m[2] ? parseInt(m[2], 10) : 0
  const mer = (m[3] || '').toLowerCase()
  if (mer === 'pm' && h < 12) h += 12
  if (mer === 'am' && h === 12) h = 0
  d.setHours(h, min, 0, 0); return d
}

// Default follow-up delay per tag (in days). The earliest non-null wins.
const TAG_FOLLOWUP_DAYS: Partial<Record<LeadTag, number>> = {
  interested: 2,
  callback_requested: 1,
  call_later: 1,
  site_visit: 2,
  budget_issue: 5,
  switched_off: 0,        // same day, +4h
}

export function analyzeQuickNote(
  text: string,
  manualTags: LeadTag[] = [],
  now: Date = new Date()
): SmartNoteResult {
  const t = (text || '').trim()
  const detected = new Set<LeadTag>(manualTags)
  for (const k of Object.keys(TAG_KEYWORDS) as LeadTag[]) {
    if (TAG_KEYWORDS[k].test(t)) detected.add(k)
  }

  let parsed: Date | null = null
  for (const [re, fn] of TIME_PATTERNS) {
    const m = t.match(re); if (m) { parsed = fn(m, now); break }
  }

  let suggestedFollowUp = parsed
  if (!suggestedFollowUp) {
    let best: number | null = null
    for (const tag of detected) {
      const d = TAG_FOLLOWUP_DAYS[tag]
      if (d !== undefined && (best === null || d < best)) best = d
    }
    if (best !== null) {
      const d = new Date(now)
      if (best === 0) d.setHours(d.getHours() + 4)
      else { d.setDate(d.getDate() + best); d.setHours(11, 0, 0, 0) }
      suggestedFollowUp = d
    }
  }

  let pickupStatus: PickupStatus | null = null
  if (detected.has('wrong_number')) pickupStatus = 'wrong_number'
  else if (detected.has('switched_off')) pickupStatus = 'switched_off'
  else if (/\b(not pic(k)?(ed)?|no answer|didn'?t pick|did not pick|missed)\b/i.test(t)) pickupStatus = 'not_picked'
  else if (t) pickupStatus = 'picked'

  const requiresLostReason = detected.has('not_interested')
  const terminal = detected.has('not_interested') || detected.has('wrong_number')
  const missingNextAction = !terminal && !suggestedFollowUp

  const warnings: string[] = []
  if (missingNextAction) warnings.push('No follow-up set — this lead could be forgotten.')
  if (requiresLostReason) warnings.push('Marked Not Interested — capture a reason before saving.')
  if (detected.has('budget_issue') && !/\b\d/.test(t))
    warnings.push('Budget mentioned — note exact figure to match future inventory.')

  return {
    suggestedTags: Array.from(detected),
    suggestedFollowUp,
    pickupStatus,
    requiresLostReason,
    missingNextAction,
    warnings,
  }
}

export const ALL_TAGS: { tag: LeadTag; label: string }[] = [
  { tag: 'interested',         label: 'Interested' },
  { tag: 'callback_requested', label: 'Callback' },
  { tag: 'call_later',         label: 'Call Later' },
  { tag: 'site_visit',         label: 'Site Visit' },
  { tag: 'budget_issue',       label: 'Budget Issue' },
  { tag: 'switched_off',       label: 'Switched Off' },
  { tag: 'wrong_number',       label: 'Wrong Number' },
  { tag: 'not_interested',     label: 'Not Interested' },
]

export const LOST_REASONS = [
  'Already booked elsewhere',
  'Budget mismatch',
  'Location not preferred',
  'Not the decision maker',
  'Just enquiring',
  'Other',
]
