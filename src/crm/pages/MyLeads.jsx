// MyLeads.jsx — Premium Real Estate CRM
// Matches mockup: forest-green sticky header, tab pills, white cards, Quick Log sheet
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import SwipeableLeadCard, { formatPhone, getLatestNote } from '@/crm/components/mobile/SwipeableLeadCard';
import SmartDateInput from '@/crm/components/SmartDateInput';
import { getEmployeeLeads } from '@/lib/crmSupabase';
import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays } from 'date-fns';
import {
  Search, SlidersHorizontal, Phone, AlertCircle, Loader2,
  PhoneCall, X, Filter, Calendar, Clock, Plus, UserCheck,
  ChevronDown, ChevronUp, Briefcase, ArrowLeft
} from 'lucide-react';

const FOREST = '#1C3A2F';
const FOREST_LIGHT = '#EAF2EE';

const parseLocalDate = (s) => {
  if (!s) return null;
  const p = s.split('T')[0].split('-').map(Number);
  return p[0] ? new Date(p[0], p[1] - 1, p[2]) : null;
};

const QUICK_OUTCOMES = [
  { id: 'Not Answered',  label: 'No Answer', emoji: '📵' },
  { id: 'Connected',     label: 'Connected', emoji: '✅' },
  { id: 'Busy',          label: 'Busy',      emoji: '🔴' },
  { id: 'Switched Off',  label: 'S/Off',     emoji: '📴' },
];
const QUICK_STATUSES = [
  { id: 'FollowUp',      emoji: '📅', label: 'Follow Up' },
  { id: 'SiteVisit',     emoji: '📍', label: 'Site Visit' },
  { id: 'Booked',        emoji: '💰', label: 'Booked' },
  { id: 'NotInterested', emoji: '❌', label: 'Not Int.' },
];

const urgencyScore = (lead) => {
  const fu = lead.follow_up_date || lead.followUpDate;
  if (!fu) return lead.status === 'New' ? 2 : 1;
  try {
    const d = parseLocalDate(fu);
    if (!d) return 1;
    if (isPast(d) && !isToday(d)) return 100;
    if (isToday(d)) return 90;
    return Math.max(0, 10 - differenceInDays(d, new Date()));
  } catch { return 1; }
};

// Tabs matching mockup design
const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'today',     label: 'Today' },
  { id: 'followup',  label: 'Follow Up' },
  { id: 'hot',       label: '🔥 Hot' },
  { id: 'overdue',   label: 'Overdue' },
  { id: 'new',       label: 'New' },
  { id: 'tomorrow',  label: 'Tomorrow' },
  { id: 'booked',    label: 'Booked' },
  { id: 'submitted', label: 'Submitted' },
];

const TERMINAL = ['NotInterested', 'Lost', 'Booked'];
const BATCH     = 50;

const SL_STATUS_STYLES = {
  pending:   { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  converted: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  rejected:  { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
};
const SL_STATUS_LABELS = { pending: 'Pending', converted: 'Converted ✓', rejected: 'Rejected' };

const formatAssignedTime = (ts) => {
  if (!ts) return null;
  try {
    const d    = new Date(ts);
    const now  = new Date();
    const mins = Math.floor((now - d) / 60000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hrs  < 24)  return `${hrs}h ago`;
    if (days === 1) return `Yesterday ${format(d, 'h:mm a')}`;
    if (days < 7)   return `${days}d ago`;
    return format(d, 'dd MMM');
  } catch { return null; }
};

const MyLeads = () => {
  const { user } = useAuth();
  const { leads, leadsLoading, calls, updateLead, addCallLog } = useCRMData();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState(() => {
    if (location.state?.tab && TABS.map(t => t.id).includes(location.state.tab)) return location.state.tab;
    const saved = sessionStorage.getItem('myLeads_tab');
    return saved && TABS.map(t => t.id).includes(saved) ? saved : 'all';
  });
  const [search, setSearch]         = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy]         = useState('urgency');
  const [dateFilter, setDateFilter] = useState('');
  const [quickLead, setQuickLead]   = useState(null);
  const [outcome, setOutcome]       = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [followDate, setFollowDate] = useState('');
  const [quickNote, setQuickNote]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [visibleCount, setVisibleCount]           = useState(BATCH);
  const [submittedLeads, setSubmittedLeads]       = useState([]);
  const [submittedLoading, setSubmittedLoading]   = useState(false);
  const [submittedExpandedId, setSubmittedExpandedId] = useState(null);

  useEffect(() => { sessionStorage.setItem('myLeads_tab', tab); }, [tab]);

  useEffect(() => {
    const saved = sessionStorage.getItem('myLeads_scroll');
    if (saved) requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => sessionStorage.setItem('myLeads_scroll', String(window.scrollY)), 200); };
    window.addEventListener('scroll', h, { passive: true });
    return () => { window.removeEventListener('scroll', h); clearTimeout(t); };
  }, []);

  const userId = user?.uid || user?.id;

  useEffect(() => {
    if (tab !== 'submitted') return;
    setSubmittedLoading(true);
    getEmployeeLeads(userId)
      .then(d => setSubmittedLeads(d || []))
      .catch(() => toast({ title: 'Error loading submitted leads', variant: 'destructive' }))
      .finally(() => setSubmittedLoading(false));
  }, [tab, userId]);

  const myCallsMap = useMemo(() => {
    if (!userId || !calls?.length) return new Map();
    const map = new Map();
    for (const c of calls) {
      if (c.employeeId !== userId) continue;
      const b = map.get(c.leadId);
      if (!b) map.set(c.leadId, [c]); else b.push(c);
    }
    map.forEach(b => b.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    return map;
  }, [calls, userId]);

  const myLeads = useMemo(() => {
    return leads
      .filter(l => l.assignedTo === userId || l.assigned_to === userId)
      .map(lead => { const lc = myCallsMap.get(lead.id) || []; return { ...lead, _callCount: lc.length, _lastCall: lc[0] }; })
      .sort((a, b) => {
        if (sortBy === 'name')   return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'recent') return new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0);
        return urgencyScore(b) - urgencyScore(a);
      });
  }, [leads, myCallsMap, userId, sortBy]);

  const counts = useMemo(() => {
    let today = 0, overdue = 0, hot = 0, followup = 0;
    myLeads.forEach(l => {
      const il = (l.interest_level || '').toLowerCase();
      if (il === 'hot') hot++;
      if (l.status === 'FollowUp' || l.status === 'CallBackLater') followup++;
      if (TERMINAL.includes(l.status)) return;
      const fu = l.follow_up_date || l.followUpDate;
      if (!fu) return;
      try {
        const d = parseLocalDate(fu);
        if (!d) return;
        if (isToday(d)) today++;
        else if (isPast(d)) overdue++;
      } catch { /**/ }
    });
    return { today, overdue, hot, followup, all: myLeads.length };
  }, [myLeads]);

  const filtered = useMemo(() => {
    let arr = myLeads;
    if (tab === 'today') {
      arr = arr.filter(l => { if (TERMINAL.includes(l.status)) return false; const d = parseLocalDate(l.follow_up_date || l.followUpDate); return d && isToday(d); });
    } else if (tab === 'overdue') {
      arr = arr.filter(l => { if (TERMINAL.includes(l.status)) return false; const d = parseLocalDate(l.follow_up_date || l.followUpDate); return d && isPast(d) && !isToday(d); });
    } else if (tab === 'tomorrow') {
      arr = arr.filter(l => { if (TERMINAL.includes(l.status)) return false; const d = parseLocalDate(l.follow_up_date || l.followUpDate); return d && isTomorrow(d); });
    } else if (tab === 'hot') {
      arr = arr.filter(l => (l.interest_level || '').toLowerCase() === 'hot');
    } else if (tab === 'followup') {
      arr = arr.filter(l => l.status === 'FollowUp' || l.status === 'CallBackLater');
    } else if (tab === 'new') {
      arr = arr.filter(l => l.status === 'New' || l.status === 'Open' || !l.status);
    } else if (tab === 'booked') {
      arr = arr.filter(l => l.status === 'Booked');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(l => l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.project?.toLowerCase().includes(q));
    }
    if (dateFilter) {
      arr = arr.filter(l => {
        const fu = l.follow_up_date || l.followUpDate;
        return fu === dateFilter || (l.createdAt || l.created_at || '').startsWith(dateFilter) || (l.assignedAt || l.assigned_at || '').startsWith(dateFilter);
      });
    }
    return arr;
  }, [myLeads, tab, search, dateFilter]);

  useEffect(() => setVisibleCount(BATCH), [tab, search, dateFilter, sortBy]);

  const visibleLeads = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const handleQuickSave = async () => {
    if (!outcome) { toast({ title: 'Select call outcome first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await addCallLog({
        leadId: quickLead.id, leadName: quickLead.name, projectName: quickLead.project || '',
        employeeId: userId, employeeName: user?.name || '',
        type: 'Outgoing', status: outcome, duration: 0,
        notes: quickNote || `Quick log: ${outcome}`,
      });
      const patch = { last_activity: new Date().toISOString() };
      if (newStatus) patch.status = newStatus;
      if (!['NotInterested', 'Lost', 'Booked'].includes(newStatus) && followDate) {
        patch.follow_up_date = followDate; patch.followUpDate = followDate;
        patch.next_followup_date = followDate; patch.follow_up_status = 'pending';
      } else if (['NotInterested', 'Lost', 'Booked'].includes(newStatus)) {
        patch.follow_up_date = null; patch.followUpDate = null;
      }
      await updateLead(quickLead.id, patch);
      toast({ title: 'Call logged ✓', description: newStatus ? `Status → ${newStatus}` : 'Saved' });
      setQuickLead(null); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setSaving(false);
  };

  if (leadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: FOREST }} />
        <p className="text-sm text-gray-400">Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F5F6F8' }}>

      {/* ══ STICKY HEADER ══ */}
      <div className="sticky top-0 z-20" style={{ background: FOREST }}>
        <div className="px-4 pt-5 pb-0">

          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[20px] font-black text-white tracking-tight">My Leads</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(s => !s)}
                className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-70 touch-manipulation"
                style={{ background: 'rgba(255,255,255,0.12)' }}
                aria-label="Search"
              >
                <Search size={17} color="#fff" />
              </button>
              <div className="relative w-9 h-9">
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center pointer-events-none"
                  style={{ background: dateFilter ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)' }}
                >
                  <Filter size={17} color="#fff" />
                </div>
              </div>
            </div>
          </div>

          {/* Expandable search bar */}
          {showSearch && (
            <div className="mb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, phone, project…"
                  className="w-full pl-9 pr-9 py-2.5 text-[13px] rounded-xl focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={13} color="rgba(255,255,255,0.7)" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab pills */}
          <div
            className="flex gap-2 overflow-x-auto pb-3 pt-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TABS.map(t => {
              let cnt = null;
              if (t.id === 'all')      cnt = counts.all;
              if (t.id === 'today')    cnt = counts.today;
              if (t.id === 'overdue')  cnt = counts.overdue;
              if (t.id === 'hot')      cnt = counts.hot;
              if (t.id === 'followup') cnt = counts.followup;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all touch-manipulation active:opacity-80"
                  style={{
                    background: active ? '#fff'                          : 'rgba(255,255,255,0.13)',
                    color:      active ? FOREST                          : 'rgba(255,255,255,0.85)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                  {cnt !== null && cnt > 0 && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? FOREST                       : 'rgba(255,255,255,0.2)',
                        color:      active ? '#fff'                       : '#fff',
                      }}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ SUBMITTED TAB ══ */}
      {tab === 'submitted' ? (
        <div className="px-4 pt-4 pb-20">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total',     value: submittedLeads.length,                                                                                                                                                               accent: FOREST },
              { label: 'This Month', value: submittedLeads.filter(l => { const d = new Date(l.created_at), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length, accent: '#3B82F6' },
              { label: 'Pending',   value: submittedLeads.filter(l => !l.admin_status || l.admin_status === 'pending').length,                                                                                                   accent: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderTop: `3px solid ${s.accent}` }}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/crm/sales/add-lead')} className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-black touch-manipulation active:opacity-80" style={{ background: FOREST, color: '#fff' }}>
            <Plus size={16} /> Add Submitted Lead
          </button>
          {submittedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 size={28} className="animate-spin" style={{ color: FOREST }} />
              <p className="text-sm text-gray-400">Loading…</p>
            </div>
          ) : submittedLeads.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: FOREST_LIGHT }}>
                <UserCheck size={28} style={{ color: FOREST }} />
              </div>
              <p className="font-bold text-gray-700 mb-1">No leads submitted yet</p>
              <button onClick={() => navigate('/crm/sales/add-lead')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold mt-3" style={{ background: FOREST, color: '#fff' }}>
                <Plus size={15} /> Submit Lead
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedLeads.map(lead => {
                const isExpanded = submittedExpandedId === lead.id;
                const st         = lead.admin_status || 'pending';
                const stStyle    = SL_STATUS_STYLES[st] || SL_STATUS_STYLES.pending;
                return (
                  <div key={lead.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                    <div className="p-4 cursor-pointer" onClick={() => setSubmittedExpandedId(isExpanded ? null : lead.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900 text-[15px] truncate">{lead.customer_name}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: stStyle.bg, color: stStyle.color, border: `1px solid ${stStyle.border}` }}>
                              {SL_STATUS_LABELS[st] || st}
                            </span>
                          </div>
                          <div className="text-[12px] text-gray-500 space-y-0.5">
                            {lead.phone && <div className="flex items-center gap-1"><Phone size={11} className="text-gray-300" />{lead.phone}</div>}
                            {lead.project_interested && <div className="flex items-center gap-1"><Briefcase size={11} className="text-gray-300" /><span className="truncate">{lead.project_interested}</span></div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-gray-400">{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-50">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[12px] text-gray-600">
                          {lead.email               && <span><strong>Email:</strong> {lead.email}</span>}
                          {lead.city                && <span><strong>City:</strong> {lead.city}{lead.locality ? `, ${lead.locality}` : ''}</span>}
                          {lead.property_type       && <span><strong>Type:</strong> {lead.property_type}</span>}
                          {lead.purpose             && <span><strong>Purpose:</strong> {lead.purpose}</span>}
                          {lead.possession_timeline && <span><strong>Timeline:</strong> {lead.possession_timeline}</span>}
                          {lead.financing           && <span><strong>Finance:</strong> {lead.financing}</span>}
                        </div>
                        {lead.employee_remarks && <div className="mt-3 p-2.5 rounded-xl text-[12px]" style={{ background: '#EFF6FF', color: '#1E40AF' }}><strong>My Notes:</strong> {lead.employee_remarks}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ══ LEADS LIST ══ */
        <div className="px-4 pt-4 pb-20">

          {/* Active date filter chip */}
          {dateFilter && (
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: FOREST_LIGHT, color: FOREST }}>
                <Calendar size={10} /> {format(parseLocalDate(dateFilter), 'dd MMM yyyy')}
              </span>
              <button onClick={() => setDateFilter('')} className="text-[11px] text-gray-400 underline">Clear</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: FOREST_LIGHT }}>
                <UserCheck size={28} style={{ color: FOREST }} />
              </div>
              <p className="font-bold text-gray-700 mb-1">No leads here</p>
              <p className="text-[13px] text-gray-400">{search ? `No results for "${search}"` : 'No leads match this filter'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLeads.map(lead => (
                <SwipeableLeadCard
                  key={lead.id}
                  lead={lead}
                  onTap={() => navigate(`/crm/sales/lead/${lead.id}`)}
                  onQuickLog={() => { setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote(''); }}
                />
              ))}
              {visibleCount < filtered.length && (
                <button
                  onClick={() => setVisibleCount(p => p + BATCH)}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-bold touch-manipulation active:opacity-70"
                  style={{ background: '#fff', border: `1.5px solid #E5E7EB`, color: FOREST }}
                >
                  Load {filtered.length - visibleCount} more leads
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ QUICK LOG BOTTOM SHEET ══ */}
      {quickLead && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setQuickLead(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
          <div
            className="relative w-full bg-white flex flex-col"
            style={{ borderRadius: '24px 24px 0 0', maxHeight: '90vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[18px] font-black text-gray-900">{quickLead.name}</h3>
                  <p className="text-[13px] text-gray-400 mt-0.5">{quickLead.phone}</p>
                </div>
                <button
                  onClick={() => setQuickLead(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                  style={{ background: '#F3F4F6' }}
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Call Outcome */}
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Call Outcome</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {QUICK_OUTCOMES.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setOutcome(o.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-bold touch-manipulation active:opacity-70 transition-all"
                    style={{
                      background: outcome === o.id ? FOREST_LIGHT : '#F7F8FA',
                      border:     outcome === o.id ? `1.5px solid ${FOREST}` : '1.5px solid transparent',
                      color:      outcome === o.id ? FOREST : '#6B7280',
                    }}
                  >
                    <span className="text-xl leading-none">{o.emoji}</span>
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Update Status */}
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                Update Status <span className="normal-case font-normal tracking-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {QUICK_STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setNewStatus(p => p === s.id ? '' : s.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-bold touch-manipulation active:opacity-70 transition-all"
                    style={{
                      background: newStatus === s.id ? '#F0FDF4' : '#F7F8FA',
                      border:     newStatus === s.id ? '1.5px solid #22C55E' : '1.5px solid transparent',
                      color:      newStatus === s.id ? '#166534' : '#6B7280',
                    }}
                  >
                    <span className="text-xl leading-none">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Follow-up date */}
              {newStatus === 'FollowUp' && (
                <div className="mb-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Follow-up Date</p>
                  <SmartDateInput
                    value={followDate}
                    onChange={setFollowDate}
                    className="w-full px-4 py-3 rounded-xl text-[13px] focus:outline-none"
                    style={{ border: '1.5px solid #E5E7EB', background: '#F7F8FA' }}
                  />
                </div>
              )}

              {/* Note */}
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                Note <span className="normal-case font-normal tracking-normal">(optional)</span>
              </p>
              <textarea
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                placeholder="e.g. Interested in 2 BHK, call back tomorrow…"
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-[13px] focus:outline-none resize-none mb-2"
                style={{ border: '1.5px solid #E5E7EB', background: '#F7F8FA' }}
              />
            </div>

            {/* Sticky Save Footer */}
            <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid #F3F4F6', background: '#fff' }}>
              <button
                onClick={handleQuickSave}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 touch-manipulation active:opacity-80 disabled:opacity-50"
                style={{ background: FOREST, color: '#fff' }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <PhoneCall size={18} />}
                {saving ? 'Saving…' : 'Log Call'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
