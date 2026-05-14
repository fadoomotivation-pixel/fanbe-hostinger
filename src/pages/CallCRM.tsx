import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SmartQuickNote, SmartQuickNoteValue } from '@/components/crm/SmartQuickNote'
import { Phone, Search, Plus, Copy, MessageCircle, Clock, StickyNote, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'
import type { CrmLead } from '@/types'
import { useFollowUpNotifications } from '@/lib/useFollowUpNotifications'
import { useNewLeadNotifications } from '@/lib/useNewLeadNotifications'

const STATUS_COLOR: Record<string, string> = {
  new:        'bg-blue-100 text-blue-700',
  open:       'bg-slate-100 text-slate-700',
  follow_up:  'bg-amber-100 text-amber-700',
  hot:        'bg-rose-100 text-rose-700',
  booked:     'bg-emerald-100 text-emerald-700',
  lost:       'bg-gray-200 text-gray-600',
}

type Tab = 'call_now' | 'follow_up' | 'all'
type QuickLogType = 'no_answer' | 'busy' | 'switched_off' | 'wrong_number' | 'brochure_sent' | 'site_visit_booked'

function followUpISO(hoursLater: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursLater)
  return d.toISOString()
}

const QUICK_LOGS: Record<QuickLogType, {
  note: string; tags: string[]; pickupStatus: string; hoursLater: number | null; status: string; msg: string
}> = {
  no_answer:         { note: 'No pickup',                              tags: [],                            pickupStatus: 'not_picked',   hoursLater: 3,    status: 'follow_up', msg: 'No pickup — next call in 3 hrs' },
  busy:              { note: 'Busy, will call back',                   tags: ['callback_requested'],        pickupStatus: 'picked',       hoursLater: 2,    status: 'follow_up', msg: 'Busy — callback in 2 hrs' },
  switched_off:      { note: 'Phone switched off',                     tags: ['switched_off'],              pickupStatus: 'switched_off', hoursLater: 4,    status: 'follow_up', msg: 'Switched off — retry in 4 hrs' },
  wrong_number:      { note: 'Wrong number',                           tags: ['wrong_number'],              pickupStatus: 'not_picked',   hoursLater: null, status: 'lost',      msg: 'Marked as wrong number' },
  brochure_sent:     { note: 'Asked for brochure — sent',              tags: ['interested'],                pickupStatus: 'picked',       hoursLater: 24,   status: 'follow_up', msg: 'Brochure sent — follow-up in 24 hrs' },
  site_visit_booked: { note: 'Site visit booked',                      tags: ['interested', 'site_visit'],  pickupStatus: 'picked',       hoursLater: 12,   status: 'hot',       msg: 'Site visit booked 🏘️' },
}

export default function CallCRM() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('call_now')
  const [q, setQ] = useState('')
  const [activeLead, setActiveLead] = useState<CrmLead | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm_leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_leads').select('*').order('next_follow_up_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as CrmLead[]
    },
  })

  const saveNote = useMutation({
    mutationFn: async ({ lead, v }: { lead: CrmLead; v: SmartQuickNoteValue }) => {
      const nextStatus =
        v.tags.includes('not_interested') ? 'lost' :
        v.tags.includes('interested')     ? 'hot'  :
        v.nextFollowUpAt                  ? 'follow_up' : 'open'
      const patch: any = {
        quick_note: v.note,
        tags: v.tags,
        pickup_status: v.pickupStatus,
        next_follow_up_at: v.nextFollowUpAt,
        lost_reason: v.lostReason,
        last_called_at: new Date().toISOString(),
        call_attempts: (lead.call_attempts ?? 0) + 1,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      }
      const { error: e1 } = await supabase.from('crm_leads').update(patch).eq('id', lead.id)
      if (e1) throw e1
      const { error: e2 } = await supabase.from('crm_lead_interactions').insert({
        lead_id: lead.id, kind: 'note', note: v.note, tags: v.tags,
        pickup_status: v.pickupStatus, next_follow_up_at: v.nextFollowUpAt,
      })
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_leads'] })
      qc.invalidateQueries({ queryKey: ['crm_overdue_count'] })
      toast.success('Note saved — follow-up scheduled')
      setActiveLead(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const quickLog = useMutation({
    mutationFn: async ({ lead, type }: { lead: CrmLead; type: QuickLogType }) => {
      const cfg = QUICK_LOGS[type]
      const followUpAt = cfg.hoursLater != null ? followUpISO(cfg.hoursLater) : null
      const patch: any = {
        quick_note: cfg.note, tags: cfg.tags, pickup_status: cfg.pickupStatus,
        next_follow_up_at: followUpAt, last_called_at: new Date().toISOString(),
        call_attempts: (lead.call_attempts ?? 0) + 1, status: cfg.status,
        updated_at: new Date().toISOString(),
      }
      const { error: e1 } = await supabase.from('crm_leads').update(patch).eq('id', lead.id)
      if (e1) throw e1
      const { error: e2 } = await supabase.from('crm_lead_interactions').insert({
        lead_id: lead.id, kind: 'note', note: cfg.note, tags: cfg.tags,
        pickup_status: cfg.pickupStatus, next_follow_up_at: followUpAt,
      })
      if (e2) throw e2
      return cfg.msg
    },
    onSuccess: (msg) => {
      qc.invalidateQueries({ queryKey: ['crm_leads'] })
      qc.invalidateQueries({ queryKey: ['crm_overdue_count'] })
      toast.success(msg)
    },
    onError: (e: any) => toast.error(e.message),
  })

  const createLead = useMutation({
    mutationFn: async (p: { name: string; phone: string; source?: string }) => {
      const { error } = await supabase.from('crm_leads').insert({ ...p, status: 'new' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_leads'] })
      toast.success('Lead added'); setAddOpen(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  // ── Notifications ──────────────────────────────────────────────────────────
  // 1. Follow-up timers: fires when a scheduled follow-up becomes due (+ 15 min pre-warn)
  useFollowUpNotifications(leads)

  // 2. Realtime new-lead: fires instantly when any INSERT lands on crm_leads.
  //    Also invalidates the React Query cache so the new lead appears in the list.
  useNewLeadNotifications((newLead) => {
    qc.invalidateQueries({ queryKey: ['crm_leads'] })
    // Show an in-app toast as well so telecallers get feedback even on
    // browsers that block Notification API (e.g. iOS Safari)
    toast(`🆕 New lead: ${newLead.name ?? 'Unknown'} · ${newLead.phone ?? ''}`, {
      duration: 6000,
      icon: '📋',
    })
  })

  const filtered = useMemo(() => {
    const now = Date.now()
    let list = leads
    if (tab === 'call_now') {
      list = leads.filter(l =>
        l.status === 'new' ||
        (l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() <= now && l.status !== 'lost' && l.status !== 'booked'))
    } else if (tab === 'follow_up') {
      list = leads.filter(l => l.status === 'follow_up' || l.status === 'hot')
    }
    if (q.trim()) {
      const s = q.toLowerCase()
      list = list.filter(l => l.name?.toLowerCase().includes(s) || l.phone?.includes(s))
    }
    return list
  }, [leads, tab, q])

  const counts = useMemo(() => {
    const now = Date.now()
    const overdue = leads.filter(l => l.next_follow_up_at && new Date(l.next_follow_up_at).getTime() < now && l.status !== 'lost' && l.status !== 'booked').length
    const today   = leads.filter(l => l.next_follow_up_at && sameDay(new Date(l.next_follow_up_at), new Date())).length
    const fresh   = leads.filter(l => l.status === 'new').length
    const hot     = leads.filter(l => l.status === 'hot').length
    return { overdue, today, fresh, hot }
  }, [leads])

  return (
    <div className="space-y-4 max-w-5xl mx-auto">

      {counts.overdue > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-600 text-white rounded-xl">
          <BellRing size={18} className="flex-shrink-0 animate-pulse"/>
          <p className="text-sm font-medium flex-1">
            {counts.overdue} overdue call{counts.overdue > 1 ? 's' : ''} — start from the top of the list
          </p>
          <button onClick={() => setTab('call_now')} className="text-xs underline whitespace-nowrap">View</button>
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500">{greeting()}, telecaller</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <Input value={q} onChange={(e: any) => setQ(e.target.value)} placeholder="Search leads…" className="pl-7 w-56"/>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus size={14}/>Add lead</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill color="bg-rose-50 text-rose-700 border-rose-200"       label={`${counts.overdue} Overdue`}/>
        <Pill color="bg-amber-50 text-amber-700 border-amber-200"    label={`${counts.today} Due Today`}/>
        <Pill color="bg-blue-50 text-blue-700 border-blue-200"       label={`${counts.fresh} New`}/>
        <Pill color="bg-orange-50 text-orange-700 border-orange-200" label={`${counts.hot} Hot`}/>
      </div>

      <div className="flex border-b border-gray-200">
        {([['call_now','Call Now'],['follow_up','Follow Up'],['all','All']] as [Tab,string][]).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab===k ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 py-10 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">No leads in this view.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((l, i) => (
            <LeadCard
              key={l.id}
              idx={i+1}
              lead={l}
              onOpen={() => setActiveLead(l)}
              onQuickLog={(type) => quickLog.mutate({ lead: l, type })}
              quickLogging={quickLog.isPending}
            />
          ))}
        </div>
      )}

      <Modal open={!!activeLead} onClose={() => setActiveLead(null)} title={activeLead ? `${activeLead.name} · ${activeLead.phone}` : ''}>
        {activeLead && (
          <div className="space-y-4">
            {/* Big thumb-friendly call + WA buttons at top of modal */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${activeLead.phone}`}
                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 text-white font-semibold text-base active:bg-emerald-700"
              >
                <Phone size={20}/> Call
              </a>
              <a
                href={`https://wa.me/${activeLead.phone.replace(/\D/g,'')}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-base active:opacity-90"
              >
                <MessageCircle size={20}/> WhatsApp
              </a>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(activeLead.phone); toast.success('Copied') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
            >
              <Copy size={14}/> Copy number
            </button>
            <SmartQuickNote
              initial={{
                note: activeLead.quick_note ?? '',
                tags: (activeLead.tags as any) ?? [],
                nextFollowUpAt: activeLead.next_follow_up_at,
              }}
              onCancel={() => setActiveLead(null)}
              onSave={(v) => saveNote.mutate({ lead: activeLead, v })}
              saving={saveNote.isPending}
            />
          </div>
        )}
      </Modal>

      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={p => createLead.mutate(p)} saving={createLead.isPending}/>
    </div>
  )
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

// Quick-log chips shown inline on each card (no modal needed)
const INLINE_CHIPS: { type: QuickLogType; emoji: string; label: string; color: string; activeColor: string }[] = [
  { type: 'no_answer',         emoji: '📵', label: 'No Answer',    color: 'text-rose-600',    activeColor: 'active:bg-rose-50' },
  { type: 'busy',              emoji: '🔄', label: 'Busy / CB',    color: 'text-amber-600',   activeColor: 'active:bg-amber-50' },
  { type: 'switched_off',      emoji: '🔕', label: 'Switched Off', color: 'text-orange-600',  activeColor: 'active:bg-orange-50' },
  { type: 'wrong_number',      emoji: '❌', label: 'Wrong No.',    color: 'text-gray-600',    activeColor: 'active:bg-gray-100' },
  { type: 'brochure_sent',     emoji: '📄', label: 'Brochure',     color: 'text-blue-600',    activeColor: 'active:bg-blue-50' },
  { type: 'site_visit_booked', emoji: '🏘️', label: 'Site Visit',   color: 'text-emerald-700', activeColor: 'active:bg-emerald-50' },
]

function LeadCard({ idx, lead, onOpen, onQuickLog, quickLogging }: {
  idx: number
  lead: CrmLead
  onOpen: () => void
  onQuickLog: (type: QuickLogType) => void
  quickLogging: boolean
}) {
  const overdue = lead.next_follow_up_at && new Date(lead.next_follow_up_at) < new Date()
  const waHref  = `https://wa.me/${lead.phone.replace(/\D/g,'')}`
  const telHref = `tel:${lead.phone}`
  const copyPhone = () => { navigator.clipboard.writeText(lead.phone); toast.success('Copied') }

  return (
    <div className={`rounded-xl bg-white border-l-4 ${
      overdue ? 'border-rose-500' : 'border-blue-500'
    } border border-gray-200 hover:shadow-sm transition-shadow overflow-hidden`}>

      {/* ── Info row ────────────────────────────────────── */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center flex-shrink-0">{idx}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-900 truncate">{lead.name}</span>
              <Badge label={lead.status.replace('_',' ')} className={STATUS_COLOR[lead.status] ?? 'bg-gray-100 text-gray-700'}/>
              {lead.call_attempts > 2 && <Badge label={`${lead.call_attempts}x`} className="bg-yellow-100 text-yellow-800"/>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
              <Clock size={11}/>
              {lead.next_follow_up_at ? `Follow-up ${formatWhen(lead.next_follow_up_at)}` : 'Never called'}
            </p>
            {lead.quick_note && <p className="text-xs text-gray-600 mt-1 line-clamp-1 italic">{lead.quick_note}</p>}
          </div>
        </div>

        {/* ── Desktop: labelled action buttons ─────────── */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <button onClick={copyPhone} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="Copy phone"><Copy size={14}/></button>
          <a href={waHref} target="_blank" rel="noreferrer"
             className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:opacity-90"
             title="WhatsApp">
            <MessageCircle size={15}/> WA
          </a>
          <a href={telHref}
             className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
             title="Call">
            <Phone size={15}/> Call
          </a>
          <button onClick={onOpen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <StickyNote size={15}/> Note
          </button>
        </div>
      </div>

      {/* ── Mobile: phone-first action layout ──────────── */}
      <div className="sm:hidden border-t border-gray-100">

        {/* Row 1 — Big primary: Call + WhatsApp (full thumb targets) */}
        <div className="grid grid-cols-2">
          <a href={telHref}
             className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-semibold text-base active:bg-emerald-700">
            <Phone size={20}/> Call
          </a>
          <a href={waHref} target="_blank" rel="noreferrer"
             className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white font-semibold text-base active:opacity-90">
            <MessageCircle size={20}/> WhatsApp
          </a>
        </div>

        {/* Row 2 — Quick-log outcome chips: No Answer / Busy / Switched Off */}
        <div className="grid grid-cols-3 border-t border-gray-100 bg-gray-50/50">
          {INLINE_CHIPS.slice(0, 3).map(chip => (
            <button
              key={chip.type}
              onClick={() => onQuickLog(chip.type)}
              disabled={quickLogging}
              className={`flex flex-col items-center gap-0.5 py-3 ${chip.color} ${chip.activeColor} disabled:opacity-50 ${
                chip.type !== 'no_answer' ? 'border-l border-gray-100' : ''
              }`}
            >
              <span className="text-xl">{chip.emoji}</span>
              <span className="text-[11px] font-medium">{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Row 3 — Secondary chips: Wrong No. / Brochure / Site Visit + Full Note */}
        <div className="grid grid-cols-4 border-t border-gray-100 bg-white">
          {INLINE_CHIPS.slice(3).map(chip => (
            <button
              key={chip.type}
              onClick={() => onQuickLog(chip.type)}
              disabled={quickLogging}
              className={`flex flex-col items-center gap-0.5 py-3 ${chip.color} ${chip.activeColor} disabled:opacity-50 ${
                chip.type !== 'wrong_number' ? 'border-l border-gray-100' : ''
              }`}
            >
              <span className="text-lg">{chip.emoji}</span>
              <span className="text-[11px] font-medium">{chip.label}</span>
            </button>
          ))}
          <button
            onClick={onOpen}
            className="flex flex-col items-center gap-0.5 py-3 text-blue-700 active:bg-blue-50 border-l border-gray-100">
            <StickyNote size={20}/>
            <span className="text-[11px] font-medium">Full Note</span>
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${color}`}>{label}</span>
}

function AddLeadModal({ open, onClose, onSubmit, saving }: {
  open: boolean; onClose: () => void
  onSubmit: (p: { name: string; phone: string; source?: string }) => void
  saving: boolean
}) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [source, setSource] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Add lead">
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={(e: any) => setName(e.target.value)}/>
        <Input label="Phone" value={phone} onChange={(e: any) => setPhone(e.target.value)} type="tel"/>
        <Input label="Source (optional)" value={source} onChange={(e: any) => setSource(e.target.value)} placeholder="e.g. FB Ad, Walk-in"/>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            disabled={!name.trim() || !phone.trim()}
            onClick={() => onSubmit({ name: name.trim(), phone: phone.trim(), source: source.trim() || undefined })}
          >Add</Button>
        </div>
      </div>
    </Modal>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function formatWhen(iso: string): string {
  const d = new Date(iso); const now = new Date()
  const diffMs = d.getTime() - now.getTime(); const abs = Math.abs(diffMs)
  const past = diffMs < 0
  const mins = Math.round(abs / 60000)
  if (mins < 60) return past ? `${mins}m overdue` : `in ${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return past ? `${hrs}h overdue` : `in ${hrs}h`
  const days = Math.round(hrs / 24)
  return past ? `${days}d overdue` : `in ${days}d`
}
