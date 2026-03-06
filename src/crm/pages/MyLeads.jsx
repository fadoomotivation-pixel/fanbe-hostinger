// src/crm/pages/MyLeads.jsx
// ✅ Mobile-first card list: status filter tabs, urgency sort, inline quick-log
import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isToday, isPast, differenceInDays } from 'date-fns';
import {
  Search, Phone, MessageCircle, ChevronRight,
  AlertCircle, Clock, Calendar, Loader2, PhoneCall, CheckCircle, X
} from 'lucide-react';

// ── Quick outcome sheet (mini version) ────────────────────────────────────────
const QUICK_OUTCOMES = [
  { id: 'no_answer',    label: 'No Answer', emoji: '📵' },
  { id: 'connected',   label: 'Connected',  emoji: '✅' },
  { id: 'busy',        label: 'Busy',       emoji: '🔴' },
  { id: 'switched_off',label: 'S/Off',      emoji: '📴' },
];
const QUICK_STATUSES = [
  { id: 'FollowUp',      emoji: '📅', label: 'Follow Up' },
  { id: 'SiteVisit',     emoji: '📍', label: 'Site Visit' },
  { id: 'Booked',        emoji: '💰', label: 'Booked' },
  { id: 'NotInterested', emoji: '❌', label: 'Not Int.' },
];

const statusColors = {
  New:           'bg-blue-100 text-blue-800',
  FollowUp:      'bg-yellow-100 text-yellow-800',
  SiteVisit:     'bg-purple-100 text-purple-800',
  Booked:        'bg-green-100 text-green-800',
  NotInterested: 'bg-gray-100 text-gray-600',
  Lost:          'bg-red-100 text-red-700',
  CallBackLater: 'bg-indigo-100 text-indigo-800',
  Open:          'bg-sky-100 text-sky-800',
};

const urgencyScore = (lead) => {
  const fu = lead.follow_up_date || lead.followUpDate;
  if (!fu) return lead.status === 'New' ? 2 : 1;
  if (isPast(parseISO(fu)) && !isToday(parseISO(fu))) return 100;
  if (isToday(parseISO(fu))) return 90;
  return Math.max(0, 10 - differenceInDays(parseISO(fu), new Date()));
};

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'urgent',   label: '🔴 Urgent' },
  { id: 'followup', label: '📅 Follow Up' },
  { id: 'new',      label: '🆕 New' },
  { id: 'booked',   label: '💰 Booked' },
];

const MyLeads = () => {
  const { user }  = useAuth();
  const { leads, leadsLoading, updateLead, addCallLog } = useCRMData();
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [tab, setTab]         = useState('all');
  const [search, setSearch]   = useState('');
  const [quickLead, setQuickLead] = useState(null); // lead for quick-log sheet
  const [outcome, setOutcome]     = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [followDate, setFollowDate] = useState('');
  const [saving, setSaving]   = useState(false);

  const userId = user?.uid || user?.id;
  const today  = new Date().toISOString().split('T')[0];

  // My leads sorted by urgency
  const myLeads = useMemo(() => {
    return leads
      .filter(l => l.assignedTo === userId || l.assigned_to === userId)
      .sort((a, b) => urgencyScore(b) - urgencyScore(a));
  }, [leads, userId]);

  const filtered = useMemo(() => {
    let arr = myLeads;

    // Tab filter
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

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q)
      );
    }
    return arr;
  }, [myLeads, tab, search]);

  const urgentCount = useMemo(() =>
    myLeads.filter(l => {
      const fu = l.follow_up_date || l.followUpDate;
      return fu && (isPast(parseISO(fu)) || isToday(parseISO(fu)));
    }).length, [myLeads]
  );

  // Quick log save — uses addCallLog (goes through crmSupabase.addCall with admin client)
  const handleQuickSave = async () => {
    if (!outcome) { toast({ title: 'Select outcome first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await addCallLog({
        leadId: quickLead.id,
        leadName: quickLead.name,
        projectName: quickLead.project || '',
        employeeId: userId,
        employeeName: user?.name || '',
        type: 'Outgoing',
        status: outcome,
        duration: 0,
        notes: `Quick log: ${outcome}`,
      });
      const patch = { last_activity: new Date().toISOString() };
      if (newStatus)   patch.status = newStatus;
      if (followDate)  patch.follow_up_date = followDate;
      await updateLead(quickLead.id, patch);
      toast({ title: 'Logged!', description: newStatus ? `Status → ${newStatus}` : 'Call saved' });
      setQuickLead(null); setOutcome(''); setNewStatus(''); setFollowDate('');
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

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-black text-[#0F3A5F]">My Leads</h1>
            <p className="text-[11px] text-gray-400">{myLeads.length} leads assigned to you</p>
          </div>
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-full">
              <AlertCircle size={12} /> {urgentCount} urgent
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/20"
          />
        </div>

        {/* Tab filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all touch-manipulation
                ${ tab === t.id ? 'bg-[#0F3A5F] text-white shadow-sm' : 'bg-gray-100 text-gray-600' }`}>
              {t.label}
              {t.id === 'urgent' && urgentCount > 0 ? ` (${urgentCount})` : ''}
              {t.id === 'all' ? ` (${myLeads.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lead Cards ── */}
      <div className="px-3 pt-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No leads found</p>
          </div>
        )}

        {filtered.map(lead => {
          const fu = lead.follow_up_date || lead.followUpDate;
          const overdueFlag = fu && isPast(parseISO(fu)) && !isToday(parseISO(fu));
          const todayFlag   = fu && isToday(parseISO(fu));
          const sc = statusColors[lead.status] || statusColors.New;

          return (
            <div key={lead.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all
                ${ overdueFlag ? 'border-red-200' : todayFlag ? 'border-green-200' : 'border-gray-100' }`}>

              {/* Card top — tap to open detail */}
              <button onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
                className="w-full text-left px-4 pt-3.5 pb-2 touch-manipulation">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base truncate">{lead.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{lead.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sc}`}>{lead.status || 'New'}</span>
                    {overdueFlag && <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-bold"><AlertCircle size={9} /> Overdue</span>}
                    {todayFlag   && <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-bold"><Clock size={9} /> Today</span>}
                  </div>
                </div>

                {/* Follow-up / project row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {lead.project && <span>🏗️ {lead.project}</span>}
                  {lead.budget  && <span>💰 {lead.budget}</span>}
                  {fu && <span className={`flex items-center gap-1 ${overdueFlag ? 'text-red-500' : todayFlag ? 'text-green-600' : 'text-yellow-600'}`}>
                    <Calendar size={11} /> {format(parseISO(fu), 'dd MMM')}
                  </span>}
                </div>
              </button>

              {/* Card actions */}
              <div className="flex border-t border-gray-50">
                <a href={`tel:${lead.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-blue-600 active:bg-blue-50 touch-manipulation">
                  <Phone size={14} /> Call
                </a>
                <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-green-600 border-x border-gray-50 active:bg-green-50 touch-manipulation">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button onClick={() => { setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#D4AF37] active:bg-yellow-50 touch-manipulation">
                  <PhoneCall size={14} /> Log
                </button>
                <button onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
                  className="px-4 flex items-center justify-center text-gray-400 active:bg-gray-50 touch-manipulation">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── QUICK LOG SHEET (from lead card "Log" button) ── */}
      {quickLead && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setQuickLead(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
               style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <div className="px-4 pb-8">
              <div className="flex items-center justify-between my-4">
                <div>
                  <p className="font-black text-[#0F3A5F] text-lg">{quickLead.name}</p>
                  <p className="text-xs text-gray-400">{quickLead.phone}</p>
                </div>
                <button onClick={() => setQuickLead(null)} className="p-2 rounded-full bg-gray-100">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Call Outcome</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {QUICK_OUTCOMES.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-semibold touch-manipulation
                      ${ outcome === o.id ? 'border-[#0F3A5F] bg-[#0F3A5F] text-white' : 'border-gray-100 bg-gray-50 text-gray-700' }`}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {QUICK_STATUSES.map(s => (
                  <button key={s.id} onClick={() => setNewStatus(newStatus === s.id ? '' : s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 text-sm font-semibold touch-manipulation
                      ${ newStatus === s.id ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0F3A5F]' : 'border-gray-100 bg-gray-50 text-gray-700' }`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Follow-up / Visit Date</p>
              <input type="date" min={today} value={followDate} onChange={e => setFollowDate(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#0F3A5F] mb-5" />

              <button onClick={handleQuickSave} disabled={!outcome || saving}
                className="w-full py-4 bg-[#0F3A5F] text-white rounded-2xl text-base font-black disabled:opacity-40 touch-manipulation">
                {saving ? '⏳ Saving...' : '✅ Save & Update'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyLeads;
