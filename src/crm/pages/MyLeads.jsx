// src/crm/pages/MyLeads.jsx
// Mobile-first lead list: priority segments, urgency sort, inline quick-log
// ✅ Schedule Banner: Overdue / Today / Tomorrow tappable summary cards
// ✅ Tomorrow tab added so employees plan ahead
// ✅ Submitted Leads tab embedded inline (no separate page needed)
// ✅ MOBILE: Call button added beside Quick Log, full-width touch targets
// ✅ MOBILE: Quick Log sheet fully redesigned — bigger tap areas, no overflow
// Design: #0F3A5F primary, #D4AF37 gold accent, emerald success
// ✅ PERF v3: Infinite scroll — renders 20 at a time via IntersectionObserver
//             DOM stays small regardless of how many leads exist
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMyLeads } from '@/crm/hooks/useMyLeads';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useMobile } from '@/lib/useMobile';
import SmartDateInput from '@/crm/components/SmartDateInput';
import { getEmployeeLeads } from '@/lib/crmSupabase';
import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays, formatDistanceToNow } from 'date-fns';

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

import {
  Search, Phone, MessageCircle, ChevronRight,
  AlertCircle, Clock, Calendar, Loader2, PhoneCall, X,
  Copy, CheckCircle, Filter, ArrowUpDown, Flame, StickyNote,
  CalendarDays, Sunrise, AlarmClock, UserCheck,
  Plus, RefreshCw, MapPin, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';

const QUICK_OUTCOMES = [
  { id: 'Not Answered', label: 'No Answer', emoji: '📵' },
  { id: 'Connected',    label: 'Connected', emoji: '✅' },
  { id: 'Busy',         label: 'Busy',      emoji: '🔴' },
  { id: 'Switched Off', label: 'S/Off',     emoji: '📴' },
];
const QUICK_STATUSES = [
  { id: 'FollowUp',      emoji: '📅', label: 'Follow Up' },
  { id: 'SiteVisit',     emoji: '📍', label: 'Site Visit' },
  { id: 'Booked',        emoji: '💰', label: 'Booked' },
  { id: 'NotInterested', emoji: '❌', label: 'Not Int.' },
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
    const d = parseLocalDate(fu);
    if (!d) return 1;
    if (isPast(d) && !isToday(d)) return 100;
    if (isToday(d)) return 90;
    return Math.max(0, 10 - differenceInDays(d, new Date()));
  } catch { return 1; }
};

const TABS = [
  { id: 'new',       label: 'New' },
  { id: 'all',       label: 'All' },
  { id: 'overdue',   label: '🚨 Overdue' },
  { id: 'yesterday', label: '⏪ Yesterday' },
  { id: 'today',     label: '📅 Today' },
  { id: 'tomorrow',  label: '🌅 Tomorrow' },
  { id: 'followup',  label: 'Follow Up' },
  { id: 'booked',    label: 'Booked' },
  { id: 'submitted', label: '📋 Submitted' },
];

const TAB_STORAGE_KEY    = 'myLeads_activeTab';
const SCROLL_STORAGE_KEY = 'myLeads_scrollPos';
const PAGE_SIZE          = 20;   // ← render 20 at a time
const TERMINAL_STATUSES  = ['NotInterested', 'Lost', 'Booked'];

const INTEREST_COLORS_SL = {
  hot:  'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
};
const SL_STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  converted: 'bg-blue-100 text-blue-700 border border-blue-200',
  rejected:  'bg-red-100 text-red-700 border border-red-200',
};
const SL_STATUS_LABELS    = { pending: 'Pending', converted: 'Converted ✓', rejected: 'Rejected' };
const SL_PROPERTY_LABELS  = { plot: 'Plot', flat: 'Flat/Apartment', villa: 'Villa', commercial: 'Commercial', other: 'Other' };
const SL_PURPOSE_LABELS   = { investment: 'Investment', self_use: 'Self Use', both: 'Both' };
const SL_TIMELINE_LABELS  = { immediate: 'Immediate', '3_months': 'Within 3 Months', '6_months': 'Within 6 Months', '1_year': 'Within 1 Year', flexible: 'Flexible' };
const SL_FINANCING_LABELS = { cash: 'Cash / Self-Funded', loan: 'Bank Loan', both: 'Both' };

const timeAgo = (ts) => {
  if (!ts) return 'Never';
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return ''; }
};

const formatAssignedTime = (ts) => {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    const now = new Date();
    const mins = Math.floor((now - d) / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days === 1) return `Yesterday ${format(d, 'h:mm a')}`;
    if (days < 7) return `${days}d ago`;
    return format(d, 'dd MMM');
  } catch { return null; }
};

const formatPhone = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0,5)}-${d.slice(5)}`;
  if (d.length > 10) return `+${d.slice(0, d.length-10)}-${d.slice(-10,-5)}-${d.slice(-5)}`;
  return p;
};

const getLatestNote = (notes) => {
  if (!notes || typeof notes !== 'string') return null;
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const clean = lines[lines.length - 1].replace(/^\[.*?\]:\s*/, '').trim();
  return clean.length > 0 ? clean : null;
};

const MyLeads = () => {
  const { user }  = useAuth();
  const userId    = user?.uid || user?.id;
  const { leads, leadsLoading, updateLead, addCallLog, calls } = useMyLeads(userId);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();
  const isMobile  = useMobile();

  const [tab, setTab] = useState(() => {
    if (location.state?.tab) {
      const valid = TABS.map(t => t.id);
      if (valid.includes(location.state.tab)) return location.state.tab;
    }
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    const valid = TABS.map(t => t.id);
    return saved && valid.includes(saved) ? saved : 'new';
  });
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('urgency');
  const [dateFilter, setDateFilter] = useState('');
  const [quickLead, setQuickLead]   = useState(null);
  const [outcome, setOutcome]       = useState('');
  const [newStatus, setNewStatus]   = useState('');
  const [followDate, setFollowDate] = useState('');
  const [quickNote, setQuickNote]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [copiedId, setCopiedId]     = useState(null);

  // ── Infinite scroll state ───────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);   // bottom sentinel for IntersectionObserver

  // ── Submitted Leads state ─────────────────────────────────────────
  const [submittedLeads, setSubmittedLeads]         = useState([]);
  const [submittedLoading, setSubmittedLoading]     = useState(false);
  const [submittedExpandedId, setSubmittedExpandedId] = useState(null);

  useEffect(() => { sessionStorage.setItem(TAB_STORAGE_KEY, tab); }, [tab]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedScroll) requestAnimationFrame(() => { window.scrollTo(0, parseInt(savedScroll, 10)); });
    let scrollTimer;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      }, 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimer); };
  }, []);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (tab !== 'submitted') return;
    setSubmittedLoading(true);
    getEmployeeLeads(userId)
      .then(data => setSubmittedLeads(data || []))
      .catch(err => {
        console.error('Failed to fetch submitted leads:', err);
        toast({ title: 'Error', description: 'Failed to load submitted leads.', variant: 'destructive' });
      })
      .finally(() => setSubmittedLoading(false));
  }, [tab, userId]);

  const copyPhone = useCallback((phone, leadId) => {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const callPhone = useCallback((phone, lead) => {
    if (!phone) return;
    const raw = phone.replace(/\D/g, '');
    const dialNumber = raw.length === 10 ? `+91${raw}` : `+${raw}`;
    window.location.href = `tel:${dialNumber}`;
    setTimeout(() => {
      setQuickLead(lead);
      setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
    }, 600);
  }, []);

  const myCallsMap = useMemo(() => {
    if (!calls?.length) return new Map();
    const map = new Map();
    for (const call of calls) {
      const bucket = map.get(call.leadId);
      if (!bucket) map.set(call.leadId, [call]);
      else bucket.push(call);
    }
    map.forEach(bucket => bucket.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    return map;
  }, [calls]);

  const myLeads = useMemo(() => {
    return leads
      .map(lead => {
        const leadCalls = myCallsMap.get(lead.id) || [];
        return { ...lead, _callCount: leadCalls.length, _lastCall: leadCalls[0] };
      })
      .sort((a, b) => {
        if (sortBy === 'name')   return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'recent') {
          const da = new Date(a.updatedAt || a.updated_at || a.createdAt || 0);
          const db = new Date(b.updatedAt || b.updated_at || b.createdAt || 0);
          return db - da;
        }
        return urgencyScore(b) - urgencyScore(a);
      });
  }, [leads, myCallsMap, sortBy]);

  const scheduleCounts = useMemo(() => {
    let overdue = 0, yesterdayCount = 0, todayCount = 0, tomorrowCount = 0;
    myLeads.forEach(l => {
      if (TERMINAL_STATUSES.includes(l.status)) return;
      const fu = l.follow_up_date || l.followUpDate;
      if (!fu) return;
      try {
        const d = parseLocalDate(fu);
        if (!d) return;
        if (isYesterday(d))               yesterdayCount++;
        else if (isPast(d) && !isToday(d)) overdue++;
        else if (isToday(d))              todayCount++;
        else if (isTomorrow(d))           tomorrowCount++;
      } catch { /* skip */ }
    });
    return { overdue, yesterday: yesterdayCount, today: todayCount, tomorrow: tomorrowCount };
  }, [myLeads]);

  const filtered = useMemo(() => {
    let arr = myLeads;
    if (tab === 'overdue') {
      arr = arr.filter(l => {
        if (TERMINAL_STATUSES.includes(l.status)) return false;
        const fu = l.follow_up_date || l.followUpDate;
        try { const d = parseLocalDate(fu); return d && isPast(d) && !isToday(d) && !isYesterday(d); } catch { return false; }
      });
    } else if (tab === 'yesterday') {
      arr = arr.filter(l => {
        if (TERMINAL_STATUSES.includes(l.status)) return false;
        const fu = l.follow_up_date || l.followUpDate;
        try { const d = parseLocalDate(fu); return d && isYesterday(d); } catch { return false; }
      });
    } else if (tab === 'today') {
      arr = arr.filter(l => {
        if (TERMINAL_STATUSES.includes(l.status)) return false;
        const fu = l.follow_up_date || l.followUpDate;
        try { const d = parseLocalDate(fu); return d && isToday(d); } catch { return false; }
      });
    } else if (tab === 'tomorrow') {
      arr = arr.filter(l => {
        if (TERMINAL_STATUSES.includes(l.status)) return false;
        const fu = l.follow_up_date || l.followUpDate;
        try { const d = parseLocalDate(fu); return d && isTomorrow(d); } catch { return false; }
      });
    } else if (tab === 'followup') {
      arr = arr.filter(l => l.status === 'FollowUp' || l.status === 'CallBackLater');
    } else if (tab === 'new') {
      arr = arr.filter(l => l.status === 'New' || l.status === 'Open' || !l.status);
      arr = [...arr].sort((a, b) => {
        const aTime = new Date(a.assignedAt || a.assigned_at || a.createdAt || a.created_at || 0);
        const bTime = new Date(b.assignedAt || b.assigned_at || b.createdAt || b.created_at || 0);
        return bTime - aTime;
      });
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
    if (dateFilter) {
      arr = arr.filter(l => {
        const fu      = l.follow_up_date || l.followUpDate;
        const created  = (l.createdAt  || l.created_at  || '').split('T')[0];
        const assigned = (l.assignedAt || l.assigned_at || '').split('T')[0];
        return fu === dateFilter || created === dateFilter || assigned === dateFilter;
      });
    }
    return arr;
  }, [myLeads, tab, search, dateFilter]);

  // ── Reset visible count when filter changes ─────────────────────────
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [tab, search, dateFilter, sortBy]);

  // ── IntersectionObserver: load next 20 when sentinel enters viewport ───
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: '200px' }   // start loading 200px before bottom
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const visibleLeads = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore      = visibleCount < filtered.length;
  const urgentCount  = scheduleCounts.overdue + scheduleCounts.today;

  const handleQuickSave = async () => {
    if (!outcome) { toast({ title: 'Select outcome first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await addCallLog({
        leadId:       quickLead.id,
        leadName:     quickLead.name,
        projectName:  quickLead.project || '',
        employeeId:   userId,
        employeeName: user?.name || '',
        type:     'Outgoing',
        status:   outcome,
        duration: 0,
        notes:    quickNote || `Quick log: ${outcome}`,
      });
      const patch = { last_activity: new Date().toISOString() };
      if (newStatus) patch.status = newStatus;
      const isTerminal = ['NotInterested', 'Lost', 'Booked'].includes(newStatus);
      if (isTerminal) {
        patch.follow_up_date = null;
        patch.followUpDate   = null;
      } else if (followDate) {
        patch.follow_up_date     = followDate;
        patch.followUpDate       = followDate;
        patch.next_followup_date = followDate;
        patch.follow_up_status   = 'pending';
      }
      await updateLead(quickLead.id, patch);
      toast({ title: 'Logged! ✓', description: newStatus ? `Status → ${newStatus}` : 'Call saved' });
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
    <div className="min-h-screen bg-gray-50 pb-[calc(7rem+env(safe-area-inset-bottom))]">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-[#0F3A5F]">My Leads</h1>
              <p className="text-xs text-gray-500">{myLeads.length} leads assigned to you</p>
            </div>
            <div className="flex items-center gap-2">
              {urgentCount > 0 && (
                <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1.5 rounded-full">
                  <AlertCircle size={12} /> {urgentCount}
                </span>
              )}
              <button
                onClick={() => setSortBy(s => s === 'urgency' ? 'name' : s === 'name' ? 'recent' : 'urgency')}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-full text-xs font-semibold text-gray-600 active:bg-gray-200 touch-manipulation">
                <ArrowUpDown size={13} />
                {sortBy === 'urgency' ? 'Priority' : sortBy === 'name' ? 'A-Z' : 'Recent'}
              </button>
            </div>
          </div>

          {tab !== 'submitted' && (
            <>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
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
                <div className="relative shrink-0">
                  <input type="date" value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className={`w-10 h-10 rounded-xl border-2 text-transparent cursor-pointer focus:outline-none ${
                      dateFilter ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-100'
                    }`} />
                  <Filter size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                    dateFilter ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              {dateFilter && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CalendarDays size={11} /> {format(parseLocalDate(dateFilter), 'dd MMM yyyy')}
                  </span>
                  <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 underline">Clear</button>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {TABS.map(t => {
              let badge = '';
              if (t.id === 'overdue'   && scheduleCounts.overdue   > 0) badge = ` (${scheduleCounts.overdue})`;
              if (t.id === 'yesterday' && scheduleCounts.yesterday  > 0) badge = ` (${scheduleCounts.yesterday})`;
              if (t.id === 'today'     && scheduleCounts.today      > 0) badge = ` (${scheduleCounts.today})`;
              if (t.id === 'tomorrow'  && scheduleCounts.tomorrow   > 0) badge = ` (${scheduleCounts.tomorrow})`;
              if (t.id === 'all') badge = ` (${myLeads.length})`;
              if (t.id === 'submitted' && submittedLeads.length > 0) badge = ` (${submittedLeads.length})`;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-semibold transition-all touch-manipulation ${
                    tab === t.id ? 'bg-[#0F3A5F] text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {t.label}{badge}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* SUBMITTED TAB                                     */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'submitted' ? (
        <div className="px-4 pt-4 pb-20">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total', value: submittedLeads.length, color: 'border-emerald-400' },
              { label: 'This Month', value: submittedLeads.filter(l => {
                  const d = new Date(l.created_at); const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length, color: 'border-blue-400' },
              { label: 'Pending', value: submittedLeads.filter(l => !l.admin_status || l.admin_status === 'pending').length, color: 'border-yellow-400' },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} p-3 shadow-sm`}>
                <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/crm/sales/add-lead')}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-all touch-manipulation"
          >
            <Plus size={18} /> Add New Submitted Lead
          </button>
          {submittedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-2" /> Loading...
            </div>
          ) : submittedLeads.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-lg">No leads submitted yet</p>
              <button onClick={() => navigate('/crm/sales/add-lead')}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold">
                <Plus size={18} /> Submit Your First Lead
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedLeads.map(lead => {
                const isExpanded = submittedExpandedId === lead.id;
                const status = lead.admin_status || 'pending';
                return (
                  <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => setSubmittedExpandedId(isExpanded ? null : lead.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-base">{lead.customer_name}</h3>
                            {lead.interest_level && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTEREST_COLORS_SL[lead.interest_level] || ''}`}>
                                {lead.interest_level.toUpperCase()}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SL_STATUS_STYLES[status] || SL_STATUS_STYLES.pending}`}>
                              {SL_STATUS_LABELS[status] || status}
                            </span>
                            {lead.site_visit_interest && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Site Visit</span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            {lead.phone && (
                              <div className="flex items-center gap-1">
                                <Phone size={13} className="text-gray-400" />
                                <span>{formatPhone(lead.phone)}</span>
                              </div>
                            )}
                            {lead.project_interested && (
                              <div className="flex items-center gap-1">
                                <Briefcase size={13} className="text-gray-400" />
                                <span>{lead.project_interested}</span>
                              </div>
                            )}
                            {lead.budget_range && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400 text-xs">Budget:</span>
                                <span>{lead.budget_range}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">
                            {new Date(lead.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {lead.email             && <span><strong>Email:</strong> {lead.email}</span>}
                          {lead.alternate_phone   && <span><strong>Alt Phone:</strong> {lead.alternate_phone}</span>}
                          {lead.occupation        && <span><strong>Occupation:</strong> {lead.occupation}</span>}
                          {lead.city              && <span><strong>City:</strong> {lead.city}{lead.locality ? `, ${lead.locality}` : ''}</span>}
                          {lead.property_type     && <span><strong>Type:</strong> {SL_PROPERTY_LABELS[lead.property_type] || lead.property_type}</span>}
                          {lead.purpose           && <span><strong>Purpose:</strong> {SL_PURPOSE_LABELS[lead.purpose] || lead.purpose}</span>}
                          {lead.possession_timeline && <span><strong>Timeline:</strong> {SL_TIMELINE_LABELS[lead.possession_timeline] || lead.possession_timeline}</span>}
                          {lead.financing         && <span><strong>Financing:</strong> {SL_FINANCING_LABELS[lead.financing] || lead.financing}</span>}
                          {lead.follow_up_date    && <span><strong>Follow-up:</strong> {new Date(lead.follow_up_date).toLocaleDateString('en-IN')}</span>}
                          {lead.preferred_visit_date && <span><strong>Visit Date:</strong> {new Date(lead.preferred_visit_date).toLocaleDateString('en-IN')}</span>}
                          {lead.how_they_know     && <span className="col-span-2"><strong>How they know us:</strong> {lead.how_they_know}</span>}
                          {lead.customer_remarks  && <div className="col-span-2 p-2 bg-gray-50 rounded border text-xs"><strong>Customer:</strong> {lead.customer_remarks}</div>}
                          {lead.employee_remarks  && <div className="col-span-2 p-2 bg-blue-50 rounded border text-xs"><strong>Your notes:</strong> {lead.employee_remarks}</div>}
                          {lead.admin_remarks     && <div className="col-span-2 p-2 bg-emerald-50 rounded border text-xs"><strong>Admin:</strong> {lead.admin_remarks}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (
        /* ══════════════════════════════════════════════ */
        /* MAIN LEADS LIST + INFINITE SCROLL                */
        /* ══════════════════════════════════════════════ */
        <div className="px-3 pt-3 pb-20">

          {/* Schedule banner */}
          {(scheduleCounts.overdue > 0 || scheduleCounts.yesterday > 0 || scheduleCounts.today > 0 || scheduleCounts.tomorrow > 0) && tab === 'all' && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {scheduleCounts.overdue > 0 && (
                <button onClick={() => setTab('overdue')}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-left touch-manipulation active:scale-95 transition-transform">
                  <span className="text-xl">🚨</span>
                  <div>
                    <div className="text-xs font-black text-red-700">{scheduleCounts.overdue} Overdue</div>
                    <div className="text-xs text-red-500">Call now</div>
                  </div>
                </button>
              )}
              {scheduleCounts.today > 0 && (
                <button onClick={() => setTab('today')}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left touch-manipulation active:scale-95 transition-transform">
                  <span className="text-xl">⏰</span>
                  <div>
                    <div className="text-xs font-black text-amber-700">{scheduleCounts.today} Today</div>
                    <div className="text-xs text-amber-500">Follow up now</div>
                  </div>
                </button>
              )}
              {scheduleCounts.yesterday > 0 && (
                <button onClick={() => setTab('yesterday')}
                  className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 text-left touch-manipulation active:scale-95 transition-transform">
                  <span className="text-xl">⏪</span>
                  <div>
                    <div className="text-xs font-black text-orange-700">{scheduleCounts.yesterday} Yesterday</div>
                    <div className="text-xs text-orange-500">Missed follow-up</div>
                  </div>
                </button>
              )}
              {scheduleCounts.tomorrow > 0 && (
                <button onClick={() => setTab('tomorrow')}
                  className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl p-3 text-left touch-manipulation active:scale-95 transition-transform">
                  <span className="text-xl">🌅</span>
                  <div>
                    <div className="text-xs font-black text-sky-700">{scheduleCounts.tomorrow} Tomorrow</div>
                    <div className="text-xs text-sky-500">Plan ahead</div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Result count */}
          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mb-2 px-1">
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} leads
            </p>
          )}

          {/* Lead cards */}
          {visibleLeads.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No leads found</p>
              <p className="text-xs mt-1">{search ? 'Try a different search' : 'Switch to another tab'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleLeads.map((lead) => {
                const fu = lead.follow_up_date || lead.followUpDate;
                const fuDate = fu ? parseLocalDate(fu) : null;
                const isOverdue   = fuDate && isPast(fuDate) && !isToday(fuDate);
                const isFollowToday = fuDate && isToday(fuDate);
                const assignedAgo = formatAssignedTime(lead.assignedAt || lead.assigned_at);
                const latestNote  = getLatestNote(lead.notes);
                const callCount   = lead._callCount || 0;
                const lastCall    = lead._lastCall;

                let borderColor = 'border-gray-100';
                if (isOverdue) borderColor = 'border-red-300';
                else if (isFollowToday) borderColor = 'border-amber-300';
                else if (lead.status === 'Booked') borderColor = 'border-emerald-300';

                return (
                  <div key={lead.id}
                    className={`bg-white rounded-2xl border-2 ${borderColor} shadow-sm overflow-hidden`}>

                    {/* ─ Lead header: tap to open detail ─ */}
                    <div className="p-3 pb-0"
                      onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{lead.name || 'Unknown'}</h3>
                            {lead.status && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                                {lead.status}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">🚨 Overdue</span>
                            )}
                            {isFollowToday && !isOverdue && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">⏰ Today</span>
                            )}
                          </div>

                          {lead.project && (
                            <p className="text-xs text-gray-500 mt-0.5">🏢 {lead.project}</p>
                          )}

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {lead.phone && (
                              <span className="text-xs text-gray-600 font-mono">{formatPhone(lead.phone)}</span>
                            )}
                            {fuDate && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isOverdue ? 'bg-red-50 text-red-600' :
                                isFollowToday ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-50 text-gray-500'
                              }`}>
                                📅 {format(fuDate, 'dd MMM')}
                              </span>
                            )}
                            {assignedAgo && (
                              <span className="text-[10px] text-gray-400">⏱ {assignedAgo}</span>
                            )}
                          </div>

                          {latestNote && (
                            <p className="text-[11px] text-gray-400 mt-1 leading-tight line-clamp-1">📝 {latestNote}</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {callCount > 0 && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                              📞 {callCount}
                            </span>
                          )}
                          <ChevronRight size={16} className="text-gray-300 mt-1" />
                        </div>
                      </div>
                    </div>

                    {/* ─ Action row ─ */}
                    <div className="px-3 pt-2 pb-3 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); callPhone(lead.phone, lead); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#0F3A5F] text-white rounded-xl text-xs font-bold active:scale-95 transition-transform touch-manipulation">
                        <Phone size={13} /> Call
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote(''); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition-transform touch-manipulation">
                        <StickyNote size={13} /> Quick Log
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyPhone(lead.phone, lead.id); }}
                        className="flex items-center justify-center w-10 py-2.5 bg-gray-100 text-gray-600 rounded-xl active:scale-95 transition-transform touch-manipulation">
                        {copiedId === lead.id ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Infinite scroll sentinel + Load More fallback ── */}
          <div ref={sentinelRef} className="h-4" />
          {hasMore && (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-xs text-gray-400">
                {Math.min(visibleCount, filtered.length)} of {filtered.length} shown
              </p>
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length))}
                className="px-6 py-2.5 bg-[#0F3A5F] text-white text-sm font-semibold rounded-full active:scale-95 transition-transform touch-manipulation shadow-sm">
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              </button>
            </div>
          )}

          {/* All loaded indicator */}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs text-gray-300 py-4">✓ All {filtered.length} leads shown</p>
          )}
        </div>
      )}

      {/* ── Quick Log Sheet ── */}
      {quickLead && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQuickLead(null)} />
          <div className="relative w-full bg-white rounded-t-3xl pt-4 pb-[env(safe-area-inset-bottom)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="px-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-[#0F3A5F] text-base">{quickLead.name}</h2>
                  <p className="text-xs text-gray-400">{quickLead.project || 'No project'}</p>
                </div>
                <button onClick={() => setQuickLead(null)} className="p-2 rounded-full bg-gray-100">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Outcome */}
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Call Outcome *</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {QUICK_OUTCOMES.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all touch-manipulation ${
                      outcome === o.id ? 'bg-[#0F3A5F] text-white shadow-md scale-[1.02]' : 'bg-gray-100 text-gray-700 active:scale-95'
                    }`}>
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>

              {/* Status update */}
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {QUICK_STATUSES.map(s => (
                  <button key={s.id} onClick={() => setNewStatus(prev => prev === s.id ? '' : s.id)}
                    className={`py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all touch-manipulation ${
                      newStatus === s.id ? 'bg-emerald-600 text-white shadow-md scale-[1.02]' : 'bg-gray-100 text-gray-700 active:scale-95'
                    }`}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>

              {/* Follow-up date */}
              {newStatus && !['NotInterested', 'Lost', 'Booked'].includes(newStatus) && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Next Follow-up Date</p>
                  <SmartDateInput
                    value={followDate}
                    onChange={setFollowDate}
                    placeholder="Pick date"
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/20"
                  />
                </div>
              )}

              {/* Note */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quick Note</p>
                <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)}
                  placeholder="Optional note..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 resize-none" />
              </div>

              <button onClick={handleQuickSave} disabled={saving}
                className="w-full py-4 bg-[#0F3A5F] text-white rounded-2xl font-black text-base mb-4 active:scale-95 transition-transform touch-manipulation disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : '✓ Save Call Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
