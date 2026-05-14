import { useMemo, useState, useEffect } from 'react'
import { ALL_TAGS, LOST_REASONS, analyzeQuickNote, LeadTag, PickupStatus } from '@/lib/quickNoteIntel'
import { Button } from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Input'
import { AlertTriangle, Sparkles, CalendarClock, X } from 'lucide-react'

export interface SmartQuickNoteValue {
  note: string
  tags: LeadTag[]
  pickupStatus: PickupStatus | null
  nextFollowUpAt: string | null
  lostReason: string | null
}

// One-tap outcome presets — fills note + tags + follow-up automatically
const QUICK_PRESETS = [
  { key: 'no_pickup',        emoji: '📵', label: 'No Pickup',     note: 'No pickup',                         tags: [] as LeadTag[],                              hoursLater: 3    },
  { key: 'busy',             emoji: '🔄', label: 'Busy',          note: 'Busy, will call back',               tags: ['callback_requested'] as LeadTag[],          hoursLater: 2    },
  { key: 'interested',       emoji: '✅', label: 'Interested',    note: 'Interested, wants more details',     tags: ['interested'] as LeadTag[],                  daysLater: 1, atHour: 10 },
  { key: 'site_visit',       emoji: '🏘️', label: 'Site Visit',    note: 'Site visit to be arranged',          tags: ['interested', 'site_visit'] as LeadTag[],    daysLater: 1, atHour: 10 },
  { key: 'call_later',       emoji: '📅', label: 'Call Later',    note: 'Asked to call later',                tags: ['call_later'] as LeadTag[],                  daysLater: 1, atHour: 11 },
  { key: 'not_interested',   emoji: '❌', label: 'Not Int.',      note: 'Not interested',                    tags: ['not_interested'] as LeadTag[],              hoursLater: null },
  { key: 'wrong_number',     emoji: '🚫', label: 'Wrong No.',     note: 'Wrong number',                      tags: ['wrong_number'] as LeadTag[],                hoursLater: null },
  { key: 'brochure_sent',    emoji: '📄', label: 'Brochure Sent', note: 'Asked for brochure — sent',          tags: ['interested'] as LeadTag[],                  hoursLater: 24   },
] as const

// Quick time chips for follow-up picker
const TIME_CHIPS = [
  { label: '+1 hr',      get: () => { const d = new Date(); d.setHours(d.getHours()+1); return d } },
  { label: '+3 hr',      get: () => { const d = new Date(); d.setHours(d.getHours()+3); return d } },
  { label: 'Tmrw 10am', get: () => { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(10,0,0,0); return d } },
  { label: 'Tmrw 5pm',  get: () => { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(17,0,0,0); return d } },
  { label: 'Next Mon',  get: () => { const d = new Date(); const diff = (8-d.getDay())%7||7; d.setDate(d.getDate()+diff); d.setHours(10,0,0,0); return d } },
]

export function SmartQuickNote({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<SmartQuickNoteValue>
  onSave: (v: SmartQuickNoteValue) => void
  onCancel?: () => void
  saving?: boolean
}) {
  const [note, setNote] = useState(initial?.note ?? '')
  const [tags, setTags] = useState<LeadTag[]>(initial?.tags ?? [])
  const [followUp, setFollowUp] = useState<string>(initial?.nextFollowUpAt ?? '')
  const [followUpDirty, setFollowUpDirty] = useState(false)
  const [lostReason, setLostReason] = useState<string>(initial?.lostReason ?? '')

  const intel = useMemo(() => analyzeQuickNote(note, tags), [note, tags])

  useEffect(() => {
    if (followUpDirty) return
    if (intel.suggestedFollowUp) setFollowUp(toLocalInput(intel.suggestedFollowUp))
    else setFollowUp('')
  }, [intel.suggestedFollowUp, followUpDirty])

  const applyPreset = (p: typeof QUICK_PRESETS[number]) => {
    setNote(p.note)
    setTags([...p.tags])
    const d = new Date()
    let fu = ''
    if ('hoursLater' in p && p.hoursLater != null) {
      d.setHours(d.getHours() + p.hoursLater)
      fu = toLocalInput(d)
    } else if ('daysLater' in p && p.daysLater != null) {
      d.setDate(d.getDate() + p.daysLater)
      d.setHours((p as any).atHour ?? 10, 0, 0, 0)
      fu = toLocalInput(d)
    }
    setFollowUp(fu)
    setFollowUpDirty(true)
    setLostReason('')
  }

  const toggleTag = (t: LeadTag) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const blockSave =
    !note.trim() ||
    (intel.requiresLostReason && !lostReason) ||
    (intel.missingNextAction && !followUp)

  const submit = () => {
    onSave({
      note: note.trim(),
      tags: intel.suggestedTags,
      pickupStatus: intel.pickupStatus,
      nextFollowUpAt: followUp ? new Date(followUp).toISOString() : null,
      lostReason: intel.requiresLostReason ? (lostReason || null) : null,
    })
  }

  return (
    <div className="space-y-3">

      {/* Quick outcome presets — 4 cols on mobile so all 8 fit without scroll */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Quick outcome — tap to fill</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {QUICK_PRESETS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p)}
              className="flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 transition-colors text-center"
            >
              <span className="text-xl leading-none">{p.emoji}</span>
              <span className="text-[11px] font-medium text-gray-700 mt-0.5">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note textarea */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Note</label>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Sparkles size={11}/> Auto-detects intent, time & tags
          </span>
        </div>
        <Textarea
          rows={3}
          value={note}
          onChange={(e: any) => setNote(e.target.value)}
          placeholder="e.g. Interested, wants site visit tomorrow 5pm. Budget ~25L."
        />
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_TAGS.map(({ tag, label }) => {
          const on   = intel.suggestedTags.includes(tag)
          const auto = on && !tags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                on
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
              }`}
              title={auto ? 'Auto-detected from note' : ''}
            >
              {auto && '✨ '}{label}
            </button>
          )
        })}
      </div>

      {/* Follow-up datetime + quick time chips */}
      <div>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1">
          <CalendarClock size={14}/> Next follow-up
          {intel.suggestedFollowUp && !followUpDirty && (
            <span className="text-[11px] text-blue-600">(auto)</span>
          )}
        </label>
        <div className="flex gap-1 mb-1.5">
          <input
            type="datetime-local"
            value={followUp}
            onChange={e => { setFollowUp(e.target.value); setFollowUpDirty(true) }}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {followUp && (
            <button
              type="button"
              onClick={() => { setFollowUp(''); setFollowUpDirty(true) }}
              className="px-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700"
            ><X size={14}/></button>
          )}
        </div>
        {/* Quick time chips */}
        <div className="flex flex-wrap gap-1">
          {TIME_CHIPS.map(tc => (
            <button
              key={tc.label}
              type="button"
              onClick={() => { setFollowUp(toLocalInput(tc.get())); setFollowUpDirty(true) }}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              {tc.label}
            </button>
          ))}
        </div>
      </div>

      {intel.requiresLostReason && (
        <Select
          label="Lost reason (required)"
          value={lostReason}
          onChange={(e: any) => setLostReason(e.target.value)}
        >
          <option value="">Select a reason…</option>
          {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      )}

      {(intel.urgency !== 'low' || intel.budgetLakhs !== null) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {intel.urgency === 'high'   && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">🔥 High urgency</span>}
          {intel.urgency === 'medium' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚡ Medium urgency</span>}
          {intel.budgetLakhs !== null && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">💰 ₹{intel.budgetLakhs}L budget</span>}
          {intel.needsDecisionMaker   && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">👥 Loop in decision-maker</span>}
        </div>
      )}

      {intel.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
          {intel.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0"/> {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>}
        <Button onClick={submit} loading={saving} disabled={blockSave}>Save note</Button>
      </div>
    </div>
  )
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
