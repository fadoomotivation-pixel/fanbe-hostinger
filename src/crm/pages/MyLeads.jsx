// src/crm/pages/MyLeads.jsx
// Premium mobile-first lead list — real estate CRM
// ✅ Full-width layout, zero horizontal overflow
// ✅ Frosted sticky header, scrollable tab pills with count badges
// ✅ Schedule summary banners (2-col grid)
// ✅ Polished Quick Log bottom sheet with drag handle + sticky footer
// ✅ Submitted leads tab with stat cards
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import SwipeableLeadCard from '@/crm/components/mobile/SwipeableLeadCard';
import SmartDateInput from '@/crm/components/SmartDateInput';
import { getEmployeeLeads } from '@/lib/crmSupabase';
import { format, isToday, isTomorrow, isYesterday, isPast, differenceInDays } from 'date-fns';

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

import {
  Search, Phone, AlertCircle, Clock, Calendar, Loader2, PhoneCall, X,
  Copy, CheckCircle, Filter, ArrowUpDown, StickyNote,
  CalendarDays, Sunrise, AlarmClock, UserCheck,
  Plus, MapPin, Briefcase, ChevronDown, ChevronUp
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
const LEADS_BATCH_SIZE   = 60;
const TERMINAL_STATUSES  = ['NotInterested', 'Lost', 'Booked'];

const SL_STATUS_STYLES = {
  pending:   { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  converted: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  rejected:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};
const SL_STATUS_LABELS    = { pending: 'Pending', converted: 'Converted ✓', rejected: 'Rejected' };
const SL_PROPERTY_LABELS  = { plot: 'Plot', flat: 'Flat/Apartment', villa: 'Villa', commercial: 'Commercial', other: 'Other' };
const SL_PURPOSE_LABELS   = { investment: 'Investment', self_use: 'Self Use', both: 'Both' };
const SL_TIMELINE_LABELS  = { immediate: 'Immediate', '3_months': 'Within 3 Months', '6_months': 'Within 6 Months', '1_year': 'Within 1 Year', flexible: 'Flexible' };
const SL_FINANCING_LABELS = { cash: 'Cash / Self-Funded', loan: 'Bank Loan', both: 'Both' };
const INTEREST_BG    = { hot: '#fef2f2', warm: '#fffbeb', cold: '#eff6ff' };
const INTEREST_COLOR = { hot: '#991b1b', warm: '#92400e', cold: '#1e40af' };

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

const formatPhone = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0,5)}-${d.slice(5)}`;
  if (d.length > 10)   return `+${d.slice(0, d.length-10)}-${d.slice(-10,-5)}-${d.slice(-5)}`;
  return p;
};

const getLatestNote = (notes) => {
  if (!notes || typeof notes !== 'string') return null;
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const clean = lines[lines.length - 1].replace(/^\[.*?\]:\s*/, '').trim();
  return clean.length > 0 ? clean : null;
};

const MyLeads = () => {
  const { user } = useAuth();
  const { leads, leadsLoading, calls, updateLead, addCallLog } = useCRMData();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState(() => {
    if (location.state?.tab) {
      if (TABS.map(t => t.id).includes(location.state.tab)) return location.state.tab;
    }
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    return saved && TABS.map(t => t.id).includes(saved) ? saved : 'new';
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
  const [visibleCount, setVisibleCount]           = useState(LEADS_BATCH_SIZE);
  const [submittedLeads, setSubmittedLeads]       = useState([]);
  const [submittedLoading, setSubmittedLoading]   = useState(false);
  const [submittedExpandedId, setSubmittedExpandedId] = useState(null);

  useEffect(() => { sessionStorage.setItem(TAB_STORAGE_KEY, tab); }, [tab]);

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (saved) requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY)), 200); };
    window.addEventListener('scroll', h, { passive: true });
    return () => { window.removeEventListener('scroll', h); clearTimeout(t); };
  }, []);

  const userId = user?.uid || user?.id;

  useEffect(() => {
    if (tab !== 'submitted') return;
    setSubmittedLoading(true);
    getEmployeeLeads(userId)
      .then(data => setSubmittedLeads(data || []))
      .catch(err => { console.error(err); toast({ title: 'Error', description: 'Failed to load submitted leads.', variant: 'destructive' }); })
      .finally(() => setSubmittedLoading(false));
  }, [tab, userId]);

  const copyPhone = useCallback((phone, leadId) => {
    navigator.clipboard?.writeText(phone).then(() => { setCopiedId(leadId); setTimeout(() => setCopiedId(null), 1500); });
  }, []);

  const myCallsMap = useMemo(() => {
    if (!userId || !calls?.length) return new Map();
    const map = new Map();
    for (const call of calls) {
      if (call.employeeId !== userId) continue;
      const b = map.get(call.leadId);
      if (!b) map.set(call.leadId, [call]); else b.push(call);
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
        if (sortBy === 'recent') return new Date(b.updatedAt || b.updated_at || b.createdAt || 0) - new Date(a.updatedAt || a.updated_at || a.createdAt || 0);
        return urgencyScore(b) - urgencyScore(a);
      });
  }, [leads, myCallsMap, userId, sortBy]);

  const scheduleCounts = useMemo(() => {
    let overdue = 0, yesterdayCount = 0, todayCount = 0, tomorrowCount = 0;
    myLeads.forEach(l => {
      if (TERMINAL_STATUSES.includes(l.status)) return;
      const fu = l.follow_up_date || l.followUpDate;
      if (!fu) return;
      try {
        const d = parseLocalDate(fu);
        if (!d) return;
        if (isYesterday(d))                yesterdayCount++;
        else if (isPast(d) && !isToday(d)) overdue++;
        else if (isToday(d))               todayCount++;
        else if (isTomorrow(d))            tomorrowCount++;
      } catch { /**/ }
    });
    return { overdue, yesterday: yesterdayCount, today: todayCount, tomorrow: tomorrowCount };
  }, [myLeads]);

  const filtered = useMemo(() => {
    let arr = myLeads;
    if (tab === 'overdue') {
      arr = arr.filter(l => { if (TERMINAL_STATUSES.includes(l.status)) return false; const fu = l.follow_up_date || l.followUpDate; try { const d = parseLocalDate(fu); return d && isPast(d) && !isToday(d) && !isYesterday(d); } catch { return false; } });
    } else if (tab === 'yesterday') {
      arr = arr.filter(l => { if (TERMINAL_STATUSES.includes(l.status)) return false; const fu = l.follow_up_date || l.followUpDate; try { const d = parseLocalDate(fu); return d && isYesterday(d); } catch { return false; } });
    } else if (tab === 'today') {
      arr = arr.filter(l => { if (TERMINAL_STATUSES.includes(l.status)) return false; const fu = l.follow_up_date || l.followUpDate; try { const d = parseLocalDate(fu); return d && isToday(d); } catch { return false; } });
    } else if (tab === 'tomorrow') {
      arr = arr.filter(l => { if (TERMINAL_STATUSES.includes(l.status)) return false; const fu = l.follow_up_date || l.followUpDate; try { const d = parseLocalDate(fu); return d && isTomorrow(d); } catch { return false; } });
    } else if (tab === 'followup') {
      arr = arr.filter(l => l.status === 'FollowUp' || l.status === 'CallBackLater');
    } else if (tab === 'new') {
      arr = arr.filter(l => l.status === 'New' || l.status === 'Open' || !l.status);
      arr = [...arr].sort((a, b) => new Date(b.assignedAt || b.assigned_at || b.createdAt || b.created_at || 0) - new Date(a.assignedAt || a.assigned_at || a.createdAt || a.created_at || 0));
    } else if (tab === 'booked') {
      arr = arr.filter(l => l.status === 'Booked');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(l => l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.project?.toLowerCase().includes(q));
    }
    if (dateFilter) {
      arr = arr.filter(l => {
        const fu       = l.follow_up_date || l.followUpDate;
        const created  = (l.createdAt || l.created_at || '').split('T')[0];
        const assigned = (l.assignedAt || l.assigned_at || '').split('T')[0];
        return fu === dateFilter || created === dateFilter || assigned === dateFilter;
      });
    }
    return arr;
  }, [myLeads, tab, search, dateFilter]);

  useEffect(() => { setVisibleCount(LEADS_BATCH_SIZE); }, [tab, search, dateFilter, sortBy]);

  const visibleLeads = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const urgentCount  = scheduleCounts.overdue + scheduleCounts.today;

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
      const isTerminal = ['NotInterested', 'Lost', 'Booked'].includes(newStatus);
      if (isTerminal) {
        patch.follow_up_date = null; patch.followUpDate = null;
      } else if (followDate) {
        patch.follow_up_date = followDate; patch.followUpDate = followDate;
        patch.next_followup_date = followDate; patch.follow_up_status = 'pending';
      }
      await updateLead(quickLead.id, patch);
      toast({ title: 'Call logged ✓', description: newStatus ? `Status → ${newStatus}` : 'Call saved' });
      setQuickLead(null); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (leadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#0F3A5F' }} />
        <p className="text-sm text-gray-400">Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f7f8fa' }}>

      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(15,58,95,0.08)',
        }}
      >
        <div className="px-4 pt-4 pb-0">

          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[17px] font-black" style={{ color: '#0F3A5F' }}>My Leads</h1>
              <p className="text-[11px] text-gray-400">{myLeads.length} leads assigned to you</p>
            </div>
            <div className="flex items-center gap-2">
              {urgentCount > 0 && (
                <span
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#fef2f2', color: '#991b1b' }}
                >
                  <AlertCircle size={11} /> {urgentCount} urgent
                </span>
              )}
              <button
                onClick={() => setSortBy(s => s === 'urgency' ? 'name' : s === 'name' ? 'recent' : 'urgency')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold touch-manipulation active:opacity-70"
                style={{ background: '#f0f4f8', color: '#0F3A5F' }}
              >
                <ArrowUpDown size={11} />
                {sortBy === 'urgency' ? 'Priority' : sortBy === 'name' ? 'A–Z' : 'Recent'}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {tab !== 'submitted' && (
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, phone, project…"
                  className="w-full pl-9 pr-8 py-2.5 text-[13px] rounded-xl focus:outline-none"
                  style={{
                    background: '#f0f4f8',
                    border: search ? '1.5px solid rgba(15,58,95,0.3)' : '1.5px solid transparent',
                    color: '#1a1a2e',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 touch-manipulation">
                    <X size={13} className="text-gray-400" />
                  </button>
                )}
              </div>
              {/* Date filter */}
              <div className="relative shrink-0 w-10 h-10">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center pointer-events-none"
                  style={{
                    background: dateFilter ? 'rgba(15,58,95,0.1)' : '#f0f4f8',
                    border: dateFilter ? '1.5px solid rgba(15,58,95,0.3)' : '1.5px solid transparent',
                  }}
                >
                  <Filter size={14} style={{ color: dateFilter ? '#0F3A5F' : '#9ca3af' }} />
                </div>
              </div>
            </div>
          )}

          {/* Date filter active chip */}
          {dateFilter && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(15,58,95,0.08)', color: '#0F3A5F' }}
              >
                <CalendarDays size={10} />
                {format(parseLocalDate(dateFilter), 'dd MMM yyyy')}
              </span>
              <button onClick={() => setDateFilter('')} className="text-[11px] text-gray-400 underline">Clear</button>
            </div>
          )}

          {/* Tab pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {TABS.map(t => {
              let count = null;
              if (t.id === 'overdue'   && scheduleCounts.overdue   > 0) count = scheduleCounts.overdue;
              if (t.id === 'yesterday' && scheduleCounts.yesterday  > 0) count = scheduleCounts.yesterday;
              if (t.id === 'today'     && scheduleCounts.today      > 0) count = scheduleCounts.today;
              if (t.id === 'tomorrow'  && scheduleCounts.tomorrow   > 0) count = scheduleCounts.tomorrow;
              if (t.id === 'all')       count = myLeads.length;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all touch-manipulation active:opacity-70"
                  style={{
                    background: active ? '#0F3A5F' : '#f0f4f8',
                    color: active ? '#fff' : '#4b5563',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                  {count !== null && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? 'rgba(255,255,255,0.22)' : 'rgba(15,58,95,0.1)',
                        color: active ? '#fff' : '#0F3A5F',
                      }}
                    >
                      {count}
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
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Total',      value: submittedLeads.length, accent: '#0F3A5F' },
              { label: 'This Month', value: submittedLeads.filter(l => { const d = new Date(l.created_at), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length, accent: '#3b82f6' },
              { label: 'Pending',    value: submittedLeads.filter(l => !l.admin_status || l.admin_status === 'pending').length, accent: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3" style={{ boxShadow: '0 1px 4px rgba(15,58,95,0.08)', borderTop: `3px solid ${s.accent}` }}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/crm/sales/add-lead')}
            className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold touch-manipulation active:opacity-80"
            style={{ background: '#0F3A5F', color: '#fff' }}
          >
            <Plus size={16} /> Add Submitted Lead
          </button>

          {submittedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Loader2 size={28} className="animate-spin" style={{ color: '#0F3A5F' }} />
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          ) : submittedLeads.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0f4f8' }}>
                <AlertCircle size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold mb-1">No leads submitted yet</p>
              <button onClick={() => navigate('/crm/sales/add-lead')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold mt-3" style={{ background: '#0F3A5F', color: '#fff' }}>
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
                  <div key={lead.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(15,58,95,0.08)' }}>
                    <div className="p-4 cursor-pointer" onClick={() => setSubmittedExpandedId(isExpanded ? null : lead.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900 text-[15px] truncate">{lead.customer_name}</h3>
                            {lead.interest_level && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: INTEREST_BG[lead.interest_level] || '#f9fafb', color: INTEREST_COLOR[lead.interest_level] || '#6b7280' }}>
                                {lead.interest_level.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: stStyle.bg, color: stStyle.color, border: `1px solid ${stStyle.border}` }}>
                              {SL_STATUS_LABELS[st] || st}
                            </span>
                          </div>
                          <div className="text-[12px] text-gray-500 space-y-0.5">
                            {lead.phone && <div className="flex items-center gap-1"><Phone size={11} className="text-gray-300" /><span>{formatPhone(lead.phone)}</span></div>}
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
                      <div className="px-4 pb-4 border-t" style={{ borderColor: '#f0f4f8' }}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[12px] text-gray-600">
                          {lead.email                && <span><strong>Email:</strong> {lead.email}</span>}
                          {lead.alternate_phone       && <span><strong>Alt:</strong> {lead.alternate_phone}</span>}
                          {lead.occupation            && <span><strong>Occupation:</strong> {lead.occupation}</span>}
                          {lead.city                  && <span><strong>City:</strong> {lead.city}{lead.locality ? `, ${lead.locality}` : ''}</span>}
                          {lead.property_type         && <span><strong>Type:</strong> {SL_PROPERTY_LABELS[lead.property_type] || lead.property_type}</span>}
                          {lead.purpose               && <span><strong>Purpose:</strong> {SL_PURPOSE_LABELS[lead.purpose] || lead.purpose}</span>}
                          {lead.possession_timeline   && <span><strong>Timeline:</strong> {SL_TIMELINE_LABELS[lead.possession_timeline] || lead.possession_timeline}</span>}
                          {lead.financing             && <span><strong>Finance:</strong> {SL_FINANCING_LABELS[lead.financing] || lead.financing}</span>}
                          {lead.follow_up_date        && <span><strong>Follow-up:</strong> {new Date(lead.follow_up_date).toLocaleDateString('en-IN')}</span>}
                          {lead.preferred_visit_date  && <span><strong>Visit:</strong> {new Date(lead.preferred_visit_date).toLocaleDateString('en-IN')}</span>}
                        </div>
                        {lead.customer_remarks && <div className="mt-3 p-2.5 rounded-xl text-[12px]" style={{ background: '#f7f8fa', color: '#374151' }}><strong>Customer:</strong> {lead.customer_remarks}</div>}
                        {lead.employee_remarks && <div className="mt-2 p-2.5 rounded-xl text-[12px]" style={{ background: '#eff6ff', color: '#1e40af' }}><strong>My Notes:</strong> {lead.employee_remarks}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ══ NORMAL LEADS TABS ══ */
        <div className="px-4 pt-3 pb-20">

          {/* Schedule banners */}
          {(scheduleCounts.overdue > 0 || scheduleCounts.yesterday > 0 || scheduleCounts.today > 0 || scheduleCounts.tomorrow > 0) && tab === 'new' && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {scheduleCounts.overdue > 0 && (
                <button onClick={() => setTab('overdue')} className="flex items-center gap-2.5 p-3 rounded-2xl text-left touch-manipulation active:opacity-80" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <div><p className="text-[12px] font-bold" style={{ color: '#991b1b' }}>{scheduleCounts.overdue} Overdue</p><p className="text-[11px]" style={{ color: '#ef4444' }}>Needs attention</p></div>
                </button>
              )}
              {scheduleCounts.yesterday > 0 && (
                <button onClick={() => setTab('yesterday')} className="flex items-center gap-2.5 p-3 rounded-2xl text-left touch-manipulation active:opacity-80" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <AlarmClock size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                  <div><p className="text-[12px] font-bold" style={{ color: '#9a3412' }}>{scheduleCounts.yesterday} Yesterday</p><p className="text-[11px]" style={{ color: '#f97316' }}>Follow up now</p></div>
                </button>
              )}
              {scheduleCounts.today > 0 && (
                <button onClick={() => setTab('today')} className="flex items-center gap-2.5 p-3 rounded-2xl text-left touch-manipulation active:opacity-80" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <CalendarDays size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div><p className="text-[12px] font-bold" style={{ color: '#92400e' }}>{scheduleCounts.today} Today</p><p className="text-[11px]" style={{ color: '#f59e0b' }}>Due today</p></div>
                </button>
              )}
              {scheduleCounts.tomorrow > 0 && (
                <button onClick={() => setTab('tomorrow')} className="flex items-center gap-2.5 p-3 rounded-2xl text-left touch-manipulation active:opacity-80" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <Sunrise size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <div><p className="text-[12px] font-bold" style={{ color: '#1e40af' }}>{scheduleCounts.tomorrow} Tomorrow</p><p className="text-[11px]" style={{ color: '#3b82f6' }}>Plan ahead</p></div>
                </button>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0f4f8' }}>
                <UserCheck size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold mb-1">No leads here</p>
              <p className="text-[13px] text-gray-400">{tab === 'new' ? 'No new leads assigned yet' : `No leads match "${tab}" filter`}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLeads.map(lead => (
                <SwipeableLeadCard
                  key={lead.id}
                  lead={lead}
                  onTap={() => navigate(`/crm/sales/lead/${lead.id}`)}
                  onQuickLog={() => { setQuickLead(lead); setOutcome(''); setNewStatus(''); setFollowDate(''); setQuickNote(''); }}
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
                  className="w-full py-3 rounded-2xl text-[13px] font-semibold touch-manipulation active:opacity-70"
                  style={{ background: '#fff', border: '1.5px solid #e5e7eb', color: '#0F3A5F' }}
                >
                  Load {filtered.length - visibleCount} more
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ Quick Log Bottom Sheet ══ */}
      {quickLead && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setQuickLead(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
          <div
            className="relative w-full bg-white flex flex-col"
            style={{ borderRadius: '24px 24px 0 0', maxHeight: '88vh', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#e5e7eb' }} />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-3">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black text-gray-900 text-[17px]">{quickLead.name}</h3>
                  <p className="text-[13px] text-gray-400 mt-0.5">{formatPhone(quickLead.phone)}</p>
                </div>
                <button onClick={() => setQuickLead(null)} className="w-8 h-8 rounded-full flex items-center justify-center touch-manipulation" style={{ background: '#f0f4f8' }}>
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Call Outcome</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {QUICK_OUTCOMES.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setOutcome(o.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-semibold touch-manipulation active:opacity-70 transition-all"
                    style={{
                      background: outcome === o.id ? 'rgba(15,58,95,0.08)' : '#f7f8fa',
                      border: outcome === o.id ? '1.5px solid #0F3A5F' : '1.5px solid transparent',
                      color: outcome === o.id ? '#0F3A5F' : '#6b7280',
                    }}
                  >
                    <span className="text-xl leading-none">{o.emoji}</span>
                    {o.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Update Status <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {QUICK_STATUSES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setNewStatus(prev => prev === s.id ? '' : s.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-semibold touch-manipulation active:opacity-70 transition-all"
                    style={{
                      background: newStatus === s.id ? '#f0fdf4' : '#f7f8fa',
                      border: newStatus === s.id ? '1.5px solid #22c55e' : '1.5px solid transparent',
                      color: newStatus === s.id ? '#166534' : '#6b7280',
                    }}
                  >
                    <span className="text-xl leading-none">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              {newStatus === 'FollowUp' && (
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Follow-up Date</p>
                  <SmartDateInput
                    value={followDate}
                    onChange={setFollowDate}
                    className="w-full px-4 py-3 rounded-xl text-[13px] focus:outline-none"
                    style={{ border: '1.5px solid #e5e7eb', background: '#f7f8fa' }}
                  />
                </div>
              )}

              <div className="mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
                <textarea
                  value={quickNote}
                  onChange={e => setQuickNote(e.target.value)}
                  placeholder="e.g. Called, will follow up tomorrow…"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-[13px] focus:outline-none resize-none"
                  style={{ border: '1.5px solid #e5e7eb', background: '#f7f8fa' }}
                />
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderTop: '1px solid #f0f4f8', background: '#fff' }}>
              <button
                onClick={handleQuickSave}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 touch-manipulation active:opacity-80 disabled:opacity-50"
                style={{ background: '#0F3A5F', color: '#fff' }}
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
