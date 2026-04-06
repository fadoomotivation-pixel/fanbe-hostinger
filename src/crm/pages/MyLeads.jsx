// src/crm/pages/MyLeads.jsx
// Mobile-first lead list: priority segments, urgency sort, inline quick-log
// ✅ Schedule Banner: Overdue / Today / Tomorrow tappable summary cards
// ✅ Tomorrow tab added so employees plan ahead
// ✅ Submitted Leads tab embedded inline (no separate page needed)
// Design: #0F3A5F primary, #D4AF37 gold accent, emerald success
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useMobile } from '@/lib/useMobile';
import SwipeableLeadCard from '@/crm/components/mobile/SwipeableLeadCard';
import SmartDateInput from '@/crm/components/SmartDateInput';
import { getEmployeeLeads } from '@/lib/crmSupabase';
import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays, formatDistanceToNow } from 'date-fns';

// ✅ Parse YYYY-MM-DD as LOCAL midnight (not UTC midnight like parseISO).
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

// ── Quick outcome sheet ─────────────────────────────────────────────────
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
    const d = parseLocalDate(fu);
    if (!d) return 1;
    if (isPast(d) && !isToday(d)) return 100;
    if (isToday(d)) return 90;
    return Math.max(0, 10 - differenceInDays(d, new Date()));
  } catch { return 1; }
};

// ✅ New tab is FIRST so employees see fresh leads immediately
const TABS = [
  { id: 'new',       label: 'New' },
  { id: 'all',       label: 'All' },
  { id: 'overdue',   label: '\uD83D\uDEA8 Overdue' },
  { id: 'yesterday', label: '\u23EA Yesterday' },
  { id: 'today',     label: '\uD83D\uDCC5 Today' },
  { id: 'tomorrow',  label: '\uD83C\uDF05 Tomorrow' },
  { id: 'followup',  label: 'Follow Up' },
  { id: 'booked',    label: 'Booked' },
  { id: 'submitted', label: '\uD83D\uDCCB Submitted' },
];

const TAB_STORAGE_KEY = 'myLeads_activeTab';
const SCROLL_STORAGE_KEY = 'myLeads_scrollPos';
const LEADS_BATCH_SIZE = 60;

// ── Submitted Leads constants ────────────────────────────────────────────
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
const SL_STATUS_LABELS = { pending: 'Pending', converted: 'Converted \u2713', rejected: 'Rejected' };
const SL_PROPERTY_LABELS = { plot: 'Plot', flat: 'Flat/Apartment', villa: 'Villa', commercial: 'Commercial', other: 'Other' };
const SL_PURPOSE_LABELS = { investment: 'Investment', self_use: 'Self Use', both: 'Both' };
const SL_TIMELINE_LABELS = { immediate: 'Immediate', '3_months': 'Within 3 Months', '6_months': 'Within 6 Months', '1_year': 'Within 1 Year', flexible: 'Flexible' };
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
  const { leads, leadsLoading, calls, updateLead, addCallLog, fetchLeads } = useCRMData();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();
  const isMobile  = useMobile();

  const [tab, setTab] = useState(() => {
    // If navigated from add-lead (or any page) with a tab hint, honour it
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
  const [visibleCount, setVisibleCount] = useState(LEADS_BATCH_SIZE);

  // ── Submitted Leads state ──────────────────────────────────────────────
  const [submittedLeads, setSubmittedLeads]     = useState([]);
  const [submittedLoading, setSubmittedLoading] = useState(false);
  const [submittedExpandedId, setSubmittedExpandedId] = useState(null);

  useEffect(() => {
    sessionStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedScroll) {
      requestAnimationFrame(() => { window.scrollTo(0, parseInt(savedScroll, 10)); });
    }
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

  const userId = user?.uid || user?.id;
  const today  = new Date().toISOString().split('T')[0];

  // ── Fetch submitted leads when tab is active ──────────────────────────
  useEffect(() => {
    if (tab !== 'submitted') return;
    setSubmittedLoading(true);
    getEmployeeLeads(userId)
      .then(data => setSubmittedLeads(data || []))
      .catch(err => { console.error('Failed to fetch submitted leads:', err); toast({ title: 'Error', description: 'Failed to load submitted leads.', variant: 'destructive' }); })
      .finally(() => setSubmittedLoading(false));
  }, [tab, userId]);

  const copyPhone = useCallback((phone, leadId) => {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const myLeads = useMemo(() => {
    const myCalls = calls?.filter(c => c.employeeId === userId) || [];
    const callsByLead = myCalls.reduce((acc, call) => {
      const bucket = acc.get(call.leadId) || [];
      bucket.push(call);
      acc.set(call.leadId, bucket);
      return acc;
    }, new Map());

    callsByLead.forEach((leadCalls) => {
      leadCalls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return leads
      .filter(l => l.assignedTo === userId || l.assigned_to === userId)
      .map(lead => {
        const leadCalls = callsByLead.get(lead.id) || [];
        const lastCall  = leadCalls[0];
        return { ...lead, _callCount: leadCalls.length, _lastCall: lastCall };
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
  }, [leads, calls, userId, sortBy]);

  const TERMINAL_STATUSES = ['NotInterested', 'Lost', 'Booked'];

  const scheduleCounts = useMemo(() => {
    let overdue = 0, yesterdayCount = 0, todayCount = 0, tomorrowCount = 0;
    myLeads.forEach(l => {
      if (TERMINAL_STATUSES.includes(l.status)) return;
      const fu = l.follow_up_date || l.followUpDate;
      if (!fu) return;
      try {
        const d = parseLocalDate(fu);
        if (!d) return;
        if (isYesterday(d))             yesterdayCount++;
        else if (isPast(d) && !isToday(d))  overdue++;
        else if (isToday(d))            todayCount++;
        else if (isTomorrow(d))         tomorrowCount++;
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
        const fu = l.follow_up_date || l.followUpDate;
        const created = (l.createdAt || l.created_at || '').split('T')[0];
        const assigned = (l.assignedAt || l.assigned_at || '').split('T')[0];
        return fu === dateFilter || created === dateFilter || assigned === dateFilter;
      });
    }
    return arr;
  }, [myLeads, tab, search, dateFilter]);
  
  useEffect(() => {
    setVisibleCount(LEADS_BATCH_SIZE);
  }, [tab, search, dateFilter, sortBy]);

  const visibleLeads = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const urgentCount = scheduleCounts.overdue + scheduleCounts.today;

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
      if (newStatus)  patch.status = newStatus;
      const isTerminal = ['NotInterested', 'Lost', 'Booked'].includes(newStatus);
      if (isTerminal) {
        patch.follow_up_date = null;
        patch.followUpDate = null;
      } else if (followDate) {
        patch.follow_up_date = followDate;
        patch.followUpDate = followDate;
        patch.next_followup_date = followDate;
        patch.follow_up_status = 'pending';
      }
      await updateLead(quickLead.id, patch);
      fetchLeads();
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

          {/* Search + Date Filter — hide on Submitted tab */}
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

          {/* Tab filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(t => {
              let badge = '';
              if (t.id === 'overdue'   && scheduleCounts.overdue    > 0) badge = ` (${scheduleCounts.overdue})`;
              if (t.id === 'yesterday' && scheduleCounts.yesterday  > 0) badge = ` (${scheduleCounts.yesterday})`;
              if (t.id === 'today'     && scheduleCounts.today      > 0) badge = ` (${scheduleCounts.today})`;
              if (t.id === 'tomorrow'  && scheduleCounts.tomorrow   > 0) badge = ` (${scheduleCounts.tomorrow})`;
              if (t.id === 'all') badge = ` (${myLeads.length})`;
              if (t.id === 'submitted' && submittedLeads.length > 0) badge = ` (${submittedLeads.length})`;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all touch-manipulation ${
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
      {/* ✅ SUBMITTED LEADS TAB CONTENT               */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'submitted' ? (
        <div className="px-4 pt-4 pb-20">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total', value: submittedLeads.length, color: 'border-emerald-400' },
              { label: 'This Month', value: submittedLeads.filter(l => { const d = new Date(l.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: 'border-blue-400' },
              { label: 'Pending', value: submittedLeads.filter(l => !l.admin_status || l.admin_status === 'pending').length, color: 'border-yellow-400' },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} p-3 shadow-sm`}>
                <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Add Lead button */}
          <button
            onClick={() => navigate('/crm/sales/add-lead')}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-all touch-manipulation"
          >
            <Plus size={18} /> Add New Submitted Lead
          </button>

          {submittedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-2" />
              Loading...
            </div>
          ) : submittedLeads.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-lg">No leads submitted yet</p>
              <button
                onClick={() => navigate('/crm/sales/add-lead')}
                className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
              >
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
                      {/* Main row — clickable to expand */}
                      <div
                        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 cursor-pointer"
                        onClick={() => setSubmittedExpandedId(isExpanded ? null : lead.id)}
                      >
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
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                Site Visit
                              </span>
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
                          {isExpanded
                            ? <ChevronUp size={16} className="text-gray-400" />
                            : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm text-gray-600">
                          {lead.email && <span><strong>Email:</strong> {lead.email}</span>}
                          {lead.alternate_phone && <span><strong>Alt Phone:</strong> {lead.alternate_phone}</span>}
                          {lead.occupation && <span><strong>Occupation:</strong> {lead.occupation}</span>}
                          {lead.city && <span><strong>City:</strong> {lead.city}{lead.locality ? `, ${lead.locality}` : ''}</span>}
                          {lead.property_type && <span><strong>Type:</strong> {SL_PROPERTY_LABELS[lead.property_type] || lead.property_type}</span>}
                          {lead.purpose && <span><strong>Purpose:</strong> {SL_PURPOSE_LABELS[lead.purpose] || lead.purpose}</span>}
                          {lead.possession_timeline && <span><strong>Timeline:</strong> {SL_TIMELINE_LABELS[lead.possession_timeline] || lead.possession_timeline}</span>}
                          {lead.financing && <span><strong>Financing:</strong> {SL_FINANCING_LABELS[lead.financing] || lead.financing}</span>}
                          {lead.follow_up_date && <span><strong>Follow-up:</strong> {new Date(lead.follow_up_date).toLocaleDateString('en-IN')}</span>}
                          {lead.preferred_visit_date && <span><strong>Visit Date:</strong> {new Date(lead.preferred_visit_date).toLocaleDateString('en-IN')}</span>}
                          {lead.how_they_know && <span className="col-span-2"><strong>How they know us:</strong> {lead.how_they_know}</span>}
                          {lead.customer_remarks && (
                            <div className="col-span-2 p-2 bg-gray-50 rounded border text-xs">
                              <strong>Customer:</strong> {lead.customer_remarks}
                            </div>
                          )}
                          {lead.employee_remarks && (
                            <div className="col-span-2 p-2 bg-blue-50 rounded border text-xs">
                              <strong>My Notes:</strong> {lead.employee_remarks}
                            </div>
                          )}
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
        /* NORMAL LEADS TAB CONTENT                      */
        /* ══════════════════════════════════════════════ */
        <div className="px-4 pt-3 pb-20">

          {/* Schedule banner */}
          {(scheduleCounts.overdue > 0 || scheduleCounts.yesterday > 0 || scheduleCounts.today > 0 || scheduleCounts.tomorrow > 0) && tab === 'new' && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {scheduleCounts.overdue > 0 && (
                <button onClick={() => setTab('overdue')}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-left active:bg-red-100 touch-manipulation">
                  <AlertCircle size={18} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-700">{scheduleCounts.overdue} Overdue</p>
                    <p className="text-xs text-red-500">Needs attention</p>
                  </div>
                </button>
              )}
              {scheduleCounts.yesterday > 0 && (
                <button onClick={() => setTab('yesterday')}
                  className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-left active:bg-orange-100 touch-manipulation">
                  <AlarmClock size={18} className="text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-orange-700">{scheduleCounts.yesterday} Yesterday</p>
                    <p className="text-xs text-orange-500">Follow up now</p>
                  </div>
                </button>
              )}
              {scheduleCounts.today > 0 && (
                <button onClick={() => setTab('today')}
                  className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left active:bg-amber-100 touch-manipulation">
                  <CalendarDays size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-700">{scheduleCounts.today} Today</p>
                    <p className="text-xs text-amber-500">Due today</p>
                  </div>
                </button>
              )}
              {scheduleCounts.tomorrow > 0 && (
                <button onClick={() => setTab('tomorrow')}
                  className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-left active:bg-blue-100 touch-manipulation">
                  <Sunrise size={18} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-700">{scheduleCounts.tomorrow} Tomorrow</p>
                    <p className="text-xs text-blue-500">Plan ahead</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-lg">No leads in this view</p>
              <p className="text-gray-400 text-sm mt-1">
                {tab === 'new' ? 'No new leads assigned yet' : `No leads match the "${tab}" filter`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLeads.map(lead => (
                <SwipeableLeadCard
                  key={lead.id}
                  lead={lead}
                  onTap={() => navigate(`/crm/sales/lead/${lead.id}`)}
                  onQuickLog={() => { setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote(''); }}
                  statusColors={statusColors}
                  formatPhone={formatPhone}
                  formatAssignedTime={formatAssignedTime}
                  getLatestNote={getLatestNote}
                  copiedId={copiedId}
                  onCopyPhone={copyPhone}
                />
              ))}

              {visibleCount < filtered.length && (
                <button
                  onClick={() => setVisibleCount(prev => prev + LEADS_BATCH_SIZE)}
                  className="w-full py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#0F3A5F] hover:bg-gray-50 transition-colors"
                >
                  Load more leads ({filtered.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quick Log Sheet ── */}
      {quickLead && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setQuickLead(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-white rounded-t-3xl p-5 pb-10 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{quickLead.name}</h3>
                <p className="text-sm text-gray-500">{formatPhone(quickLead.phone)}</p>
              </div>
              <button onClick={() => setQuickLead(null)} className="p-2 rounded-full bg-gray-100">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Call Outcome</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {QUICK_OUTCOMES.map(o => (
                <button key={o.id} onClick={() => setOutcome(o.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-xs font-semibold transition-all touch-manipulation ${
                    outcome === o.id ? 'border-[#0F3A5F] bg-[#0F3A5F]/5 text-[#0F3A5F]' : 'border-gray-100 bg-gray-50 text-gray-600'
                  }`}>
                  <span className="text-xl">{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Update Status <span className="font-normal text-gray-400">(optional)</span></p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {QUICK_STATUSES.map(s => (
                <button key={s.id} onClick={() => setNewStatus(prev => prev === s.id ? '' : s.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-xs font-semibold transition-all touch-manipulation ${
                    newStatus === s.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50 text-gray-600'
                  }`}>
                  <span className="text-xl">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {newStatus === 'FollowUp' && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Follow-up Date</p>
                <SmartDateInput
                  value={followDate}
                  onChange={setFollowDate}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0F3A5F] focus:outline-none"
                />
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quick Note <span className="font-normal text-gray-400">(optional)</span></p>
              <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)}
                placeholder="e.g., Called, will call back tomorrow..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0F3A5F] focus:outline-none resize-none" />
            </div>

            <button onClick={handleQuickSave} disabled={saving}
              className="w-full py-4 bg-[#0F3A5F] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:bg-[#0c2e4a] touch-manipulation disabled:opacity-60">
              {saving ? <Loader2 size={20} className="animate-spin" /> : <PhoneCall size={20} />}
              {saving ? 'Saving...' : 'Log Call'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
