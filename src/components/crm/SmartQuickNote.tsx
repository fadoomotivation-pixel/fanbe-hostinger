import { useMemo, useState, useEffect } from 'react'
import { ALL_TAGS, LOST_REASONS, analyzeQuickNote, LeadTag, PickupStatus } from '@/lib/quickNoteIntel'
import { Button } from '@/components/ui/Button'
import { Textarea, Select } from '@/components/ui/Input'
import { AlertTriangle, Sparkles, CalendarClock, X } from 'lucide-react'

export interface SmartQuickNoteValue {
  note: string
  tags: LeadTag[]
  pickupStatus: PickupStatus | null
  nextFollowUpAt: string | null  // ISO
  lostReason: string | null
}

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

  // Auto-fill follow-up from suggestion unless user has edited it.
  useEffect(() => {
    if (followUpDirty) return
    if (intel.suggestedFollowUp) setFollowUp(toLocalInput(intel.suggestedFollowUp))
    else setFollowUp('')
  }, [intel.suggestedFollowUp, followUpDirty])

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
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Quick Note</label>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Sparkles size={11}/> Smart: detects intent, time & next action
          </span>
        </div>
        <Textarea
          rows={3}
          value={note}
          onChange={(e: any) => setNote(e.target.value)}
          placeholder="e.g. Interested, wants site visit tomorrow 5pm. Budget ~25L."
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALL_TAGS.map(({ tag, label }) => {
          const on = intel.suggestedTags.includes(tag)
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1">
            <CalendarClock size={14}/> Next follow-up
            {intel.suggestedFollowUp && !followUpDirty && (
              <span className="text-[11px] text-blue-600">(auto)</span>
            )}
          </label>
          <div className="flex gap-1">
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
                title="Clear"
              ><X size={14}/></button>
            )}
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
      </div>

      {(intel.urgency !== 'low' || intel.budgetLakhs !== null) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {intel.urgency === 'high' && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">🔥 High urgency</span>}
          {intel.urgency === 'medium' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚡ Medium urgency</span>}
          {intel.budgetLakhs !== null && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">💰 ₹{intel.budgetLakhs}L budget</span>}
          {intel.needsDecisionMaker && <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">👥 Loop in decision-maker</span>}
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
