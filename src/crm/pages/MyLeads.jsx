// src/crm/pages/MyLeads.jsx
// Mobile-first lead list: priority segments, urgency sort, inline quick-log
// Design: #0F3A5F primary, #D4AF37 gold accent, emerald success
import React, { useState, useMemo, useCallback } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isToday, isPast, differenceInDays, formatDistanceToNow } from 'date-fns';
import {
  Search, Phone, MessageCircle, ChevronRight,
  AlertCircle, Clock, Calendar, Loader2, PhoneCall, X,
  Copy, CheckCircle, Filter, ArrowUpDown, Flame, StickyNote
} from 'lucide-react';

// ── Quick outcome sheet ──────────────────────────────────
const QUICK_OUTCOMES = [
  { id: 'Not Answered', label: 'No Answer', emoji: '\uD83D\uDCF5' },
  { id: 'Connected',    label: 'Connected', emoji: '\u2705' },
  { id: 'Busy',         label: 'Busy',      emoji: '\uD83D\uDD34' },
  { id: 'Switched Off', label: 'S/Off',     emoji: '\uD83D\uDCF4' },
];
const QUICK_STATUSES = [
  { id: 'FollowUp',      emoji: '\uD83D\uDCC5', label: 'Follow Up' },
  { id: 'SiteVisit',     emoji: '\uD83D\uDCCD', label: 'Site Visit' },
  { id: 'Booked',        emoji: '\uD83D\uDCB0', label: 'Booked' },
  { id: 'NotInterested', emoji: '\u274C',        label: 'Not Int.' },
];

const statusColors = {
  New:           'bg-blue-100 text-blue-800',
  Open:          'bg-sky-100 text-sky-800',
  FollowUp:      'bg-amber-100 text-amber-800',
  SiteVisit:     'bg-purple-100 text-purple-800',
  Booked:        'bg-emerald-100 text-emerald-800',
  NotInterested: 'bg-gray-100 text-gray-600',
  Lost:          'bg-red-100 text-red-700',
  CallBackLater: 'bg-indigo-100 text-indigo-800',
};

const urgencyScore = (lead) => {
  const fu = lead.follow_up_date || lead.followUpDate;
  if (!fu) return lead.status === 'New' ? 2 : 1;
  try {
    if (isPast(parseISO(fu)) && !isToday(parseISO(fu))) return 100;
    if (isToday(parseISO(fu))) return 90;
    return Math.max(0, 10 - differenceInDays(parseISO(fu), new Date()));
  } catch { return 1; }
};

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'urgent',   label: 'Urgent' },
  { id: 'followup', label: 'Follow Up' },
  { id: 'new',      label: 'New' },
  { id: 'booked',   label: 'Booked' },
];

const timeAgo = (ts) => {
  if (!ts) return 'Never';
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return ''; }
};

const formatPhone = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0,5)}-${d.slice(5)}`;
  if (d.length > 10) return `+${d.slice(0, d.length-10)}-${d.slice(-10,-5)}-${d.slice(-5)}`;
  return p;
};

// Extract the latest/last line of notes (notes are appended with newlines)
const getLatestNote = (notes) => {
  if (!notes || typeof notes !== 'string') return null;
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  // Last line is always the most recent (notes are appended)
  const last = lines[lines.length - 1];
  // Strip timestamp prefix like "[DD MMM, H:mm AM - Name]:" if present
  const clean = last.replace(/^\[.*?\]:\s*/, '').trim();
  return clean.length > 0 ? clean : null;
};

const MyLeads = () => {
  const { user }  = useAuth();
  const { leads, leadsLoading, calls, updateLead, addCallLog } = useCRMData();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('urgency');
  const [quickLead, setQuickLead]   = useState(null);
  const [outcome, setOutcome]       = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [followDate, setFollowDate] = useState('');
  const [quickNote, setQuickNote]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const userId = user?.uid || user?.id;
  const today  = new Date().toISOString().split('T')[0];

  const copyPhone = useCallback((phone, leadId) => {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  // My leads with call analysis
  const myLeads = useMemo(() => {
    const myCalls = calls?.filter(c => c.employeeId === userId) || [];
    return leads
      .filter(l => l.assignedTo === userId || l.assigned_to === userId)
      .map(lead => {
        const leadCalls = myCalls.filter(c => c.leadId === lead.id);
        const lastCall = leadCalls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        return { ...lead, _callCount: leadCalls.length, _lastCall: lastCall };
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'recent') {
          const da = new Date(a.updatedAt || a.updated_at || a.createdAt || 0);
          const db = new Date(b.updatedAt || b.updated_at || b.createdAt || 0);
          return db - da;
        }
        return urgencyScore(b) - urgencyScore(a);
      });
  }, [leads, calls, userId, sortBy]);

  const filtered = useMemo(() => {
    let arr = myLeads;
    if (tab === 'urgent') {
      arr = arr.filter(l => {
        const fu = l.follow_up_date || l.followUpDate;
        return fu && (isPast(parseISO(fu)) || isToday(parseISO(fu)));
      });
    } else if (tab === 'followup') {
      arr = arr.filter(l => l.status === 'FollowUp' || l.status === 'CallBackLater');
    } else if (tab === 'new') {
      arr = arr.filter(l => l.status === 'New' || l.status === 'Open' || !l.status);
    } else if (tab === 'booked') {
      arr = arr.filter(l => l.status === 'Booked');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.project?.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [myLeads, tab, search]);

  const urgentCount = useMemo(() =>
    myLeads.filter(l => {
      const fu = l.follow_up_date || l.followUpDate;
      try { return fu && (isPast(parseISO(fu)) || isToday(parseISO(fu))); } catch { return false; }
    }).length, [myLeads]
  );

  // Quick log save — uses addCallLog hook
  const handleQuickSave = async () => {
    if (!outcome) { toast({ title: 'Select outcome first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const outcomeLabel = QUICK_OUTCOMES.find(o => o.id === outcome)?.label || outcome;
      await addCallLog({
        leadId: quickLead.id,
        leadName: quickLead.name,
        projectName: quickLead.project || '',
        employeeId: userId,
        employeeName: user?.name || '',
        type: 'Outgoing',
        status: outcome,
        duration: 0,
        notes: quickNote || `Quick log: ${outcomeLabel}`,
      });
      const patch = { last_activity: new Date().toISOString() };
      if (newStatus)  patch.status = newStatus;
      if (followDate) patch.follow_up_date = followDate;
      await updateLead(quickLead.id, patch);
      toast({ title: 'Logged!', description: newStatus ? `Status \u2192 ${newStatus}` : 'Call saved' });
      setQuickLead(null); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (leadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#0F3A5F]" />
        <p className="text-sm text-gray-500">Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-[#0F3A5F]">My Leads</h1>
              <p className="text-[11px] text-gray-400">{myLeads.length} leads assigned to you</p>
            </div>
            <div className="flex items-center gap-2">
              {urgentCount > 0 && (
                <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-full">
                  <AlertCircle size={12} /> {urgentCount}
                </span>
              )}
              <button
                onClick={() => setSortBy(s => s === 'urgency' ? 'name' : s === 'name' ? 'recent' : 'urgency')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-full text-[10px] font-semibold text-gray-600 active:bg-gray-200">
                <ArrowUpDown size={11} />
                {sortBy === 'urgency' ? 'Priority' : sortBy === 'name' ? 'A-Z' : 'Recent'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, project..."
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/20" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Tab filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all touch-manipulation ${
                  tab === t.id ? 'bg-[#0F3A5F] text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                }`}>
                {t.id === 'urgent' && '\uD83D\uDD34 '}{t.label}
                {t.id === 'urgent' && urgentCount > 0 ? ` (${urgentCount})` : ''}
                {t.id === 'all' ? ` (${myLeads.length})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lead Cards ── */}
      <div className="px-3 pt-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No leads found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {filtered.map(lead => {
          const fu = lead.follow_up_date || lead.followUpDate;
          let overdueFlag = false, todayFlag = false;
          try {
            overdueFlag = fu && isPast(parseISO(fu)) && !isToday(parseISO(fu));
            todayFlag   = fu && isToday(parseISO(fu));
          } catch { /* ignore */ }
          const sc = statusColors[lead.status] || statusColors.New;
          const interest   = lead.interestLevel || lead.interest_level;
          const latestNote = getLatestNote(lead.notes);

          return (
            <div key={lead.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 ${
                overdueFlag ? 'border-red-200 border-l-4 border-l-red-400' :
                todayFlag   ? 'border-amber-200 border-l-4 border-l-amber-400' : 'border-gray-100'
              }`}>

              {/* Card body — tap to open detail */}
              <button onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
                className="w-full text-left px-4 pt-3.5 pb-2 touch-manipulation">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-base truncate">{lead.name}</p>
                      {interest === 'Hot' && <Flame size={13} className="text-red-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{formatPhone(lead.phone)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sc}`}>{lead.status || 'New'}</span>
                    {overdueFlag && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-bold">
                        <AlertCircle size={9} /> Overdue
                      </span>
                    )}
                    {todayFlag && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                        <Clock size={9} /> Today
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {lead.project && <span className="truncate max-w-[120px]">\uD83C\uDFD7\uFE0F {lead.project}</span>}
                  {lead.budget  && <span>\uD83D\uDCB0 {lead.budget}</span>}
                  {fu && (
                    <span className={`flex items-center gap-1 ${
                      overdueFlag ? 'text-red-500' : todayFlag ? 'text-amber-600' : 'text-blue-600'
                    }`}>
                      <Calendar size={11} /> {format(parseISO(fu), 'dd MMM')}
                    </span>
                  )}
                </div>

                {/* Last activity */}
                <p className="text-[10px] text-gray-300 mt-1.5">
                  {lead._callCount > 0
                    ? `${lead._callCount} calls \u00B7 Last: ${timeAgo(lead._lastCall?.timestamp)}`
                    : 'Never contacted'}
                </p>

                {/* Latest note snippet */}
                {latestNote && (
                  <div className="flex items-start gap-1.5 mt-2 bg-amber-50 rounded-xl px-2.5 py-1.5">
                    <StickyNote size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-snug line-clamp-2">{latestNote}</p>
                  </div>
                )}
              </button>

              {/* Card action row */}
              <div className="flex border-t border-gray-50">
                <a href={`tel:${lead.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-emerald-600 active:bg-emerald-50 touch-manipulation">
                  <Phone size={14} /> Call
                </a>
                <button onClick={() => copyPhone(lead.phone, lead.id)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-gray-400 border-x border-gray-50 active:bg-gray-50 touch-manipulation">
                  {copiedId === lead.id
                    ? <CheckCircle size={14} className="text-emerald-500" />
                    : <Copy size={14} />}
                </button>
                <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#25D366] active:bg-green-50 touch-manipulation">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button onClick={() => {
                  setQuickLead(lead);
                  setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
                }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black text-[#D4AF37] active:bg-amber-50 touch-manipulation">
                  <PhoneCall size={14} /> Log
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUICK LOG BOTTOM SHEET ── */}
      {quickLead && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setQuickLead(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
               style={{ maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <div className="px-4 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between my-4">
                <div>
                  <p className="font-black text-[#0F3A5F] text-lg">{quickLead.name}</p>
                  <p className="text-xs text-gray-400">{formatPhone(quickLead.phone)}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${quickLead.phone}`}
                    className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition">
                    <Phone size={18} />
                  </a>
                  <button onClick={() => setQuickLead(null)} className="p-2 rounded-full bg-gray-100 active:bg-gray-200">
                    <X size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Step 1 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">How did the call go?</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {QUICK_OUTCOMES.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-semibold touch-manipulation transition-all ${
                      outcome === o.id
                        ? 'border-[#0F3A5F] bg-[#0F3A5F] text-white shadow-lg scale-[1.02]'
                        : 'border-gray-100 bg-gray-50 text-gray-700'
                    }`}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>

              {/* Step 2 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {QUICK_STATUSES.map(s => (
                  <button key={s.id} onClick={() => setNewStatus(newStatus === s.id ? '' : s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 text-sm font-semibold touch-manipulation transition-all ${
                      newStatus === s.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0F3A5F] shadow-sm scale-[1.02]'
                        : 'border-gray-100 bg-gray-50 text-gray-700'
                    }`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>

              {/* Step 3 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                {newStatus === 'SiteVisit' ? 'Schedule Visit Date' : 'Follow-up Date (optional)'}
              </p>
              <div className="flex gap-2 mb-2">
                {[{ label: 'Tomorrow', days: 1 }, { label: '3 Days', days: 3 }, { label: 'Next Week', days: 7 }].map(opt => (
                  <button key={opt.label} onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + opt.days);
                    setFollowDate(d.toISOString().split('T')[0]);
                  }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      followDate === (() => { const d = new Date(); d.setDate(d.getDate() + opt.days); return d.toISOString().split('T')[0]; })()
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <input type="date" min={today} value={followDate} onChange={e => setFollowDate(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#0F3A5F] mb-5" />

              {/* Step 4 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick Note (optional)</p>
              <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)}
                placeholder="What did the lead say?" rows={2}
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0F3A5F] mb-5" />

              {/* Save */}
              <button onClick={handleQuickSave} disabled={!outcome || saving}
                className="w-full py-4 bg-[#0F3A5F] text-white rounded-2xl text-base font-black disabled:opacity-40 active:bg-[#0a2d4f] shadow-xl touch-manipulation transition-all">
                {saving
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Saving...</span>
                  : 'Save & Update'
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyLeads;
