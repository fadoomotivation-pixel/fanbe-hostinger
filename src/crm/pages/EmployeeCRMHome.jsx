// src/crm/pages/EmployeeCRMHome.jsx
// Employee daily command center — mobile-first, 1-thumb operation
// Design: Deep navy #0F3A5F, Gold #D4AF37 accent, emerald success
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SmartDateInput from '@/crm/components/SmartDateInput';
import {
  Phone, PhoneOff, PhoneMissed, PhoneIncoming, Clock, Calendar,
  AlertCircle, Search, ChevronRight, MessageCircle, X, Check,
  MapPin, Flame, Wind, Snowflake, Loader2, RefreshCw, TrendingUp,
  Target, Zap, Copy, CheckCircle, UserCheck
} from 'lucide-react';
import { normalizeLeadStatus, normalizeInterestLevel, LEAD_STATUS } from '@/crm/utils/statusUtils';
import { differenceInHours, differenceInDays, differenceInMinutes, format, formatDistanceToNow } from 'date-fns';

// Parse YYYY-MM-DD as LOCAL midnight to avoid UTC timezone drift
const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

// ─── Format assignment time ─────────────────────────
// Returns a compact, human-readable assignment time string
const formatAssignedTime = (ts) => {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    const now = new Date();
    const mins = differenceInMinutes(now, d);
    const hrs = differenceInHours(now, d);
    const days = differenceInDays(now, d);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days === 1) return `Yesterday ${format(d, 'h:mm a')}`;
    if (days < 7) return `${days}d ago · ${format(d, 'h:mm a')}`;
    return format(d, 'dd MMM · h:mm a');
  } catch { return null; }
};

// Returns full date-time string for tooltip
const fullAssignedTime = (ts) => {
  if (!ts) return '';
  try { return format(new Date(ts), "dd MMM yyyy 'at' h:mm a"); } catch { return ''; }
};

// ─── TAB IDs ───────────────────────────────────────────
const TABS = {
  CALL_NOW: 'call_now',
  FOLLOW_UP: 'follow_up',
  ALL_LEADS: 'all_leads',
};

// ─── QUICK CALL STATUSES (1-tap) ──────────────────────
const QUICK_STATUSES = [
  { id: 'not_answered', label: 'No Answer', icon: PhoneMissed, color: 'bg-red-50 text-red-700 border-red-200', dbValue: 'Not Answered' },
  { id: 'busy', label: 'Busy', icon: PhoneOff, color: 'bg-orange-50 text-orange-700 border-orange-200', dbValue: 'Busy' },
  { id: 'connected', label: 'Connected', icon: PhoneIncoming, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dbValue: 'Connected' },
  { id: 'switched_off', label: 'Off', icon: PhoneOff, color: 'bg-gray-100 text-gray-600 border-gray-200', dbValue: 'Switched Off' },
];

// ─── LEAD OUTCOME ACTIONS (after connected call) ──────
const LEAD_OUTCOMES = [
  { id: 'follow_up', label: 'Follow Up', color: 'bg-yellow-500 text-white' },
  { id: 'site_visit', label: 'Site Visit', color: 'bg-purple-500 text-white' },
  { id: 'booked', label: 'Booked!', color: 'bg-emerald-500 text-white' },
  { id: 'not_interested', label: 'Not Interested', color: 'bg-gray-500 text-white' },
];

// ─── Relative time formatter ───────────────────────────
const timeAgo = (ts) => {
  if (!ts) return '';
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return ''; }
};

const formatPhone = (p) => {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0,5)}-${digits.slice(5)}`;
  if (digits.length > 10) return `+${digits.slice(0, digits.length-10)}-${digits.slice(-10,-5)}-${digits.slice(-5)}`;
  return p;
};

const EmployeeCRMHome = () => {
  const { user } = useAuth();
  const {
    leads, leadsLoading, calls, addCallLog, updateLead, fetchLeads,
    siteVisits, bookings
  } = useCRMData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('crmHome_activeTab') || TABS.CALL_NOW);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Action modal state
  const [actionLead, setActionLead] = useState(null);
  const [actionStep, setActionStep] = useState(null);
  const [callNote, setCallNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { sessionStorage.setItem('crmHome_activeTab', activeTab); }, [activeTab]);

  const userId = user?.uid || user?.id;

  const myLeads = useMemo(() =>
    leads.filter(l => l.assignedTo === userId || l.assigned_to === userId),
    [leads, userId]
  );

  const myCalls = useMemo(() =>
    calls?.filter(c => c.employeeId === userId || c.employee_id === userId) || [],
    [calls, userId]
  );

  const today = new Date().toISOString().split('T')[0];
  const todayStats = useMemo(() => {
    const todayCalls = myCalls.filter(c => c.timestamp?.startsWith(today));
    return {
      totalLeads: myLeads.length,
      calls: todayCalls.length,
      connected: todayCalls.filter(c => ['Connected','connected','interested'].includes(c.status)).length,
      visits: siteVisits?.filter(v => (v.employeeId === userId) && v.timestamp?.startsWith(today)).length || 0,
      bookings: bookings?.filter(b => (b.employeeId === userId)).length || 0,
    };
  }, [myCalls, siteVisits, bookings, today, userId, myLeads.length]);

  const analyzedLeads = useMemo(() => {
    const now = new Date();
    return myLeads.map(lead => {
      const leadCalls = myCalls.filter(c => c.leadId === lead.id || c.lead_id === lead.id);
      const lastCall = leadCalls.sort((a, b) =>
        new Date(b.timestamp || b.call_time) - new Date(a.timestamp || a.call_time)
      )[0];

      let callStatus = 'never_called';
      let hoursSinceCall = Infinity;
      if (leadCalls.length > 0 && lastCall) {
        try { hoursSinceCall = differenceInHours(now, new Date(lastCall.timestamp || lastCall.call_time)); } catch { hoursSinceCall = 999; }
        const isConnected = ['Connected','connected','interested'].includes(lastCall.status);
        if (!isConnected && hoursSinceCall >= 2) callStatus = 'needs_retry';
        else if (!isConnected) callStatus = 'recently_unanswered';
        else callStatus = 'connected';
      }

      const fuDate = lead.followUpDate || lead.follow_up_date || lead.next_followup_date;
      let followUpPriority = 5;
      let daysUntilFollowUp = null;
      if (fuDate) {
        try {
          daysUntilFollowUp = differenceInDays(parseLocalDate(fuDate), now);
          if (daysUntilFollowUp < 0) followUpPriority = 1;
          else if (daysUntilFollowUp === 0) followUpPriority = 2;
          else if (daysUntilFollowUp === 1) followUpPriority = 3;
          else if (daysUntilFollowUp <= 7) followUpPriority = 4;
        } catch { /* ignore */ }
      }

      const status = normalizeLeadStatus(lead.status);
      const interest = normalizeInterestLevel(lead.interestLevel || lead.interest_level);
      const tempScore = interest === 'Hot' ? 30 : interest === 'Warm' ? 20 : 10;
      const callScore = callStatus === 'never_called' ? 100 : callStatus === 'needs_retry' ? 80 : callStatus === 'recently_unanswered' ? 40 : 10;
      const fuScore = followUpPriority <= 2 ? 50 : followUpPriority === 3 ? 30 : 0;

      // ✅ FIX: Resolve assignment timestamp — falls back to createdAt so ALL leads show a time
      const assignedAt =
        lead.assignmentDate ||
        lead.assignment_date ||
        lead.assignedAt ||
        lead.assigned_at ||
        lead.createdAt ||
        lead.created_at ||
        null;

      return {
        ...lead,
        _callStatus: callStatus,
        _hoursSinceCall: hoursSinceCall,
        _callCount: leadCalls.length,
        _lastCall: lastCall,
        _followUpPriority: followUpPriority,
        _daysUntilFollowUp: daysUntilFollowUp,
        _interest: interest,
        _normalizedStatus: status,
        _score: callScore + fuScore + tempScore,
        _assignedAt: assignedAt,
      };
    });
  }, [myLeads, myCalls]);

  const callNowLeads = useMemo(() =>
    analyzedLeads
      .filter(l => l._normalizedStatus !== LEAD_STATUS.BOOKED && l._normalizedStatus !== LEAD_STATUS.LOST)
      .sort((a, b) => b._score - a._score),
    [analyzedLeads]
  );

  const followUpLeads = useMemo(() => {
    const grouped = { overdue: [], today: [], tomorrow: [], thisWeek: [], noDate: [] };
    analyzedLeads.forEach(l => {
      if (l._normalizedStatus === LEAD_STATUS.LOST || l._normalizedStatus === LEAD_STATUS.BOOKED) return;
      if (l._followUpPriority === 1) grouped.overdue.push(l);
      else if (l._followUpPriority === 2) grouped.today.push(l);
      else if (l._followUpPriority === 3) grouped.tomorrow.push(l);
      else if (l._followUpPriority === 4) grouped.thisWeek.push(l);
      else if (l._normalizedStatus === LEAD_STATUS.FOLLOW_UP) grouped.noDate.push(l);
    });
    return grouped;
  }, [analyzedLeads]);

  const followUpCounts = useMemo(() => ({
    overdue: followUpLeads.overdue.length,
    today: followUpLeads.today.length,
    tomorrow: followUpLeads.tomorrow.length,
    thisWeek: followUpLeads.thisWeek.length,
    total: followUpLeads.overdue.length + followUpLeads.today.length + followUpLeads.tomorrow.length + followUpLeads.thisWeek.length,
  }), [followUpLeads]);

  const allLeadsFiltered = useMemo(() => {
    let filtered = analyzedLeads;
    if (statusFilter !== 'all') filtered = filtered.filter(l => l._normalizedStatus === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(q) || l.phone?.includes(q) || l.project?.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => b._score - a._score);
  }, [analyzedLeads, statusFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const c = { Open: 0, FollowUp: 0, Booked: 0, Lost: 0, total: myLeads.length };
    analyzedLeads.forEach(l => { if (c[l._normalizedStatus] !== undefined) c[l._normalizedStatus]++; });
    return c;
  }, [analyzedLeads, myLeads.length]);

  const recentActivity = useMemo(() =>
    myCalls.slice(0, 5).map(c => ({
      type: 'call',
      leadName: c.leadName || c.lead_name || 'Unknown',
      status: c.status,
      time: c.timestamp,
    })),
    [myCalls]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Lead data updated' });
  }, [fetchLeads, toast]);

  const copyPhone = useCallback((phone, leadId) => {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopiedId(leadId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const openAction = useCallback((lead) => {
    setActionLead(lead);
    setActionStep('call_status');
    setCallNote('');
    setFollowUpDate('');
  }, []);

  const closeAction = useCallback(() => {
    setActionLead(null);
    setActionStep(null);
    setCallNote('');
    setFollowUpDate('');
  }, []);

  const handleQuickCallStatus = useCallback(async (statusObj) => {
    if (!actionLead || saving) return;
    setSaving(true);
    try {
      await addCallLog({
        leadId: actionLead.id,
        leadName: actionLead.name,
        projectName: actionLead.project || '',
        employeeId: userId,
        employeeName: user?.name || '',
        type: 'Outgoing',
        status: statusObj.dbValue,
        duration: 0,
        notes: callNote || `Quick log: ${statusObj.label}`,
      });
      if (statusObj.id === 'connected') setActionStep('outcome');
      else setActionStep('follow_up_quick');
      toast({ title: statusObj.label, description: `Call logged for ${actionLead.name}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  }, [actionLead, saving, addCallLog, userId, user?.name, callNote, toast]);

  const handleOutcome = useCallback(async (outcome) => {
    if (!actionLead || saving) return;
    setSaving(true);
    try {
      const updates = {};
      if (outcome.id === 'follow_up') {
        updates.status = 'FollowUp';
        setActionStep('follow_up_schedule');
        setSaving(false);
        return;
      } else if (outcome.id === 'site_visit') {
        updates.status = 'FollowUp'; updates.siteVisitStatus = 'planned';
        await updateLead(actionLead.id, updates);
        toast({ title: 'Site Visit Planned', description: `Marked for ${actionLead.name}` });
        closeAction();
      } else if (outcome.id === 'booked') {
        updates.status = 'Booked';
        updates.follow_up_date = null;
        updates.followUpDate = null;
        await updateLead(actionLead.id, updates);
        toast({ title: 'Booked!', description: `${actionLead.name} marked as Booked` });
        closeAction();
      } else if (outcome.id === 'not_interested') {
        updates.status = 'Lost';
        updates.follow_up_date = null;
        updates.followUpDate = null;
        await updateLead(actionLead.id, updates);
        toast({ title: 'Marked Lost', description: `${actionLead.name} not interested` });
        closeAction();
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  }, [actionLead, saving, updateLead, toast, closeAction]);

  const handleSaveFollowUp = useCallback(async () => {
    if (!actionLead || saving) return;
    setSaving(true);
    try {
      const updates = { status: 'FollowUp' };
      if (followUpDate) { updates.followUpDate = followUpDate; updates.follow_up_date = followUpDate; }
      if (callNote) updates.notes = `${actionLead.notes || ''}\n[${new Date().toLocaleString('en-IN')}] ${callNote}`.trim();
      await updateLead(actionLead.id, updates);
      toast({ title: 'Follow-up Set', description: followUpDate && parseLocalDate(followUpDate) ? `Reminder for ${format(parseLocalDate(followUpDate), 'MMM dd')}` : 'Status updated' });
      closeAction();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  }, [actionLead, saving, followUpDate, callNote, updateLead, toast, closeAction]);

  const setQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (leadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#0F3A5F]" />
        <p className="text-sm text-gray-500">Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">

      {/* ─── HEADER ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-[#0F3A5F]">{greeting}, {user?.name?.split(' ')[0]}</h1>
              <p className="text-[11px] text-gray-400">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
              <RefreshCw size={16} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {(followUpCounts.overdue + followUpCounts.today > 0) && (
            <div className="mt-2 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl px-3 py-2">
              <p className="text-xs font-semibold text-[#0F3A5F]">
                <Zap size={12} className="inline text-[#D4AF37] mr-1" />
                You have <span className="text-[#D4AF37] font-bold">{followUpCounts.overdue + followUpCounts.today}</span> leads to follow up today
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { label: 'Overdue', count: followUpCounts.overdue, color: 'bg-red-50 border-red-200 text-red-700', icon: AlertCircle, dot: 'bg-red-500' },
            { label: 'Due Today', count: followUpCounts.today, color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Clock, dot: 'bg-amber-500' },
            { label: 'New Leads', count: callNowLeads.filter(l => l._callStatus === 'never_called').length, color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Zap, dot: 'bg-blue-500' },
            { label: 'Hot Leads', count: analyzedLeads.filter(l => l._interest === 'Hot' && l._normalizedStatus !== 'Booked' && l._normalizedStatus !== 'Lost').length, color: 'bg-orange-50 border-orange-200 text-orange-700', icon: Flame, dot: 'bg-orange-500' },
          ].map(item => (
            <div key={item.label} className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border ${item.color} transition-all`}>
              <div className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span className="text-xs font-bold">{item.count}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 border-t border-gray-100">
          {[
            { label: 'Leads', value: todayStats.totalLeads, color: 'text-[#0F3A5F]' },
            { label: 'Calls', value: todayStats.calls, color: 'text-blue-600' },
            { label: 'Connected', value: todayStats.connected, color: 'text-emerald-600' },
            { label: 'Bookings', value: todayStats.bookings, color: 'text-[#D4AF37]' },
          ].map(s => (
            <div key={s.label} className="text-center py-2">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex border-t border-gray-100">
          {[
            { id: TABS.CALL_NOW, label: 'Call Now', count: callNowLeads.length },
            { id: TABS.FOLLOW_UP, label: 'Follow Up', count: followUpCounts.overdue + followUpCounts.today, urgent: followUpCounts.overdue > 0 },
            { id: TABS.ALL_LEADS, label: 'All', count: myLeads.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-semibold relative transition-all ${
                activeTab === tab.id
                  ? 'text-[#0F3A5F] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5'
                  : 'text-gray-400'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  tab.urgent ? 'bg-red-500 text-white animate-pulse' :
                  activeTab === tab.id ? 'bg-[#0F3A5F] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB CONTENT ───────────────────────────── */}
      <div className="px-3 pt-3">

        {activeTab === TABS.CALL_NOW && (
          <div className="space-y-2">
            {callNowLeads.filter(l => l._callStatus === 'never_called').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3">
                <p className="text-xs font-bold text-red-700">
                  <AlertCircle size={12} className="inline mr-1" />
                  {callNowLeads.filter(l => l._callStatus === 'never_called').length} leads never called — start with these!
                </p>
              </div>
            )}
            {callNowLeads.map((lead, idx) => (
              <LeadCallCard key={lead.id} lead={lead} rank={idx + 1} onAction={() => openAction(lead)}
                onNavigate={() => navigate(`/crm/sales/lead/${lead.id}`)} onCopy={copyPhone} copiedId={copiedId} />
            ))}
            {callNowLeads.length === 0 && <EmptyState message="All leads are contacted! Great job!" icon={CheckCircle} />}
          </div>
        )}

        {activeTab === TABS.FOLLOW_UP && (
          <div className="space-y-4">
            {followUpCounts.overdue > 0 && (
              <FollowUpSection title="Overdue" icon={<AlertCircle size={14} className="text-red-600" />}
                leads={followUpLeads.overdue} color="border-red-200 bg-red-50" onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)} />
            )}
            {followUpCounts.today > 0 && (
              <FollowUpSection title="Today" icon={<Clock size={14} className="text-amber-600" />}
                leads={followUpLeads.today} color="border-amber-200 bg-amber-50" onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)} />
            )}
            {followUpCounts.tomorrow > 0 && (
              <FollowUpSection title="Tomorrow" icon={<Calendar size={14} className="text-blue-600" />}
                leads={followUpLeads.tomorrow} color="border-blue-200 bg-blue-50" onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)} />
            )}
            {followUpCounts.thisWeek > 0 && (
              <FollowUpSection title="This Week" icon={<Calendar size={14} className="text-indigo-600" />}
                leads={followUpLeads.thisWeek} color="border-indigo-200 bg-indigo-50" onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)} />
            )}
            {followUpLeads.noDate.length > 0 && (
              <FollowUpSection title="No Date Set" icon={<Calendar size={14} className="text-gray-400" />}
                leads={followUpLeads.noDate} color="border-gray-200 bg-gray-50" onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)} />
            )}
            {followUpCounts.total === 0 && followUpLeads.noDate.length === 0 && (
              <EmptyState message="No follow-ups scheduled. You're all caught up!" icon={Check} />
            )}
          </div>
        )}

        {activeTab === TABS.ALL_LEADS && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <Input placeholder="Search name, phone, project..." className="pl-9 h-9 text-sm rounded-xl"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {[
                { id: 'all', label: 'All', count: statusCounts.total, color: 'bg-gray-100 text-gray-700' },
                { id: 'Open', label: 'Open', count: statusCounts.Open, color: 'bg-blue-100 text-blue-700' },
                { id: 'FollowUp', label: 'Follow Up', count: statusCounts.FollowUp, color: 'bg-yellow-100 text-yellow-700' },
                { id: 'Booked', label: 'Booked', count: statusCounts.Booked, color: 'bg-emerald-100 text-emerald-700' },
                { id: 'Lost', label: 'Lost', count: statusCounts.Lost, color: 'bg-gray-100 text-gray-500' },
              ].map(chip => (
                <button key={chip.id} onClick={() => setStatusFilter(chip.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    statusFilter === chip.id ? `${chip.color} border-current shadow-sm scale-105` : 'bg-white text-gray-400 border-gray-200'
                  }`}>
                  {chip.label} ({chip.count})
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {allLeadsFiltered.map(lead => (
                <LeadCallCard key={lead.id} lead={lead} onAction={() => openAction(lead)}
                  onNavigate={() => navigate(`/crm/sales/lead/${lead.id}`)} compact onCopy={copyPhone} copiedId={copiedId} />
              ))}
              {allLeadsFiltered.length === 0 && <EmptyState message="No leads match your search." icon={Search} />}
            </div>
          </div>
        )}

        {activeTab === TABS.CALL_NOW && recentActivity.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Activity</p>
            <div className="space-y-2">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    ['Connected','connected'].includes(a.status) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Phone size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{a.leadName}</p>
                    <p className="text-[10px] text-gray-400">{a.status?.replace(/_/g, ' ')} {timeAgo(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── ACTION MODAL ─────────────────────────── */}
      <Dialog open={!!actionLead} onOpenChange={() => closeAction()}>
        <DialogContent className="max-w-md mx-auto sm:max-w-sm !rounded-t-2xl !rounded-b-none sm:!rounded-2xl fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 p-0 border-0 shadow-2xl max-h-[85vh] overflow-hidden">
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
          {actionLead && (
            <div className="px-4 pb-6 pt-2 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-[#0F3A5F] truncate">{actionLead.name}</h3>
                  <p className="text-xs text-gray-500">{actionLead.project} &middot; {formatPhone(actionLead.phone)}</p>
                  {/* Assignment time in modal */}
                  {actionLead._assignedAt && (
                    <p className="text-[11px] text-[#D4AF37] font-medium mt-0.5 flex items-center gap-1">
                      <UserCheck size={11} />
                      Assigned {formatAssignedTime(actionLead._assignedAt)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <a href={`tel:${actionLead.phone}`}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white shadow-lg active:scale-95 transition">
                    <Phone size={18} />
                  </a>
                  <a href={`https://wa.me/91${(actionLead.phone || '').replace(/[^0-9]/g, '').slice(-10)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] text-white shadow-lg active:scale-95 transition">
                    <MessageCircle size={18} />
                  </a>
                </div>
              </div>

              {actionStep === 'call_status' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">What happened on the call?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_STATUSES.map(s => (
                      <button key={s.id} onClick={() => handleQuickCallStatus(s)} disabled={saving}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 ${s.color} font-semibold text-sm active:scale-95 transition disabled:opacity-50`}>
                        <s.icon size={18} /> {s.label}
                      </button>
                    ))}
                  </div>
                  <Textarea placeholder="Quick note (optional)..." value={callNote}
                    onChange={e => setCallNote(e.target.value)} rows={2} className="text-sm resize-none rounded-xl" />
                </div>
              )}

              {actionStep === 'outcome' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">What's the outcome?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LEAD_OUTCOMES.map(o => (
                      <button key={o.id} onClick={() => handleOutcome(o)} disabled={saving}
                        className={`p-3 rounded-2xl ${o.color} font-semibold text-sm active:scale-95 transition shadow-sm disabled:opacity-50`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionStep === 'follow_up_quick' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Set follow-up reminder?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '2 Hours', hours: 2 },
                      { label: 'Tomorrow', days: 1 },
                      { label: 'In 3 Days', days: 3 },
                    ].map(opt => (
                      <button key={opt.label} onClick={() => {
                        if (opt.hours) { setFollowUpDate(today); setCallNote(`Retry in ${opt.hours}h`); }
                        else setQuickDate(opt.days);
                        setActionStep('follow_up_confirm');
                      }}
                        className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs active:scale-95 transition">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={closeAction} className="w-full p-2 text-xs text-gray-400 font-medium">Skip for now</button>
                </div>
              )}

              {actionStep === 'follow_up_schedule' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">When to follow up?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Tomorrow', days: 1 }, { label: 'In 3 Days', days: 3 }, { label: 'Next Week', days: 7 }, { label: 'In 2 Weeks', days: 14 }].map(opt => (
                      <button key={opt.label} onClick={() => { setQuickDate(opt.days); setActionStep('follow_up_confirm'); }}
                        className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs active:scale-95 transition">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Or pick / type a date:</label>
                    <SmartDateInput value={followUpDate} min={today}
                      className="h-9 text-sm rounded-xl border border-gray-200 px-3 focus:outline-none focus:border-[#0F3A5F]"
                      onChange={(v) => { setFollowUpDate(v); if (v) setActionStep('follow_up_confirm'); }} />
                  </div>
                </div>
              )}

              {actionStep === 'follow_up_confirm' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium">Follow-up set for</p>
                    <p className="text-lg font-bold text-blue-800">
                      {followUpDate && parseLocalDate(followUpDate) ? format(parseLocalDate(followUpDate), 'EEE, MMM dd') : 'Today'}
                    </p>
                  </div>
                  <Textarea placeholder="Notes for next call..." value={callNote}
                    onChange={e => setCallNote(e.target.value)} rows={2} className="text-sm resize-none rounded-xl" />
                  <Button onClick={handleSaveFollowUp} disabled={saving}
                    className="w-full bg-[#0F3A5F] hover:bg-[#0a2d4f] h-11 rounded-xl">
                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check size={16} className="mr-2" />}
                    Save & Next Lead
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── LEAD CARD COMPONENT ─────────────────────────────
const LeadCallCard = React.memo(({ lead, rank, onAction, onNavigate, compact, onCopy, copiedId }) => {
  const assignedTime = formatAssignedTime(lead._assignedAt);
  const assignedFull = fullAssignedTime(lead._assignedAt);

  const getCallBadge = () => {
    switch (lead._callStatus) {
      case 'never_called': return <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">NEW</span>;
      case 'needs_retry': return <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">RETRY</span>;
      case 'recently_unanswered': return <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">WAIT</span>;
      default: return <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">OK</span>;
    }
  };
  const getInterestDot = () => {
    if (lead._interest === 'Hot') return <Flame size={12} className="text-red-500" />;
    if (lead._interest === 'Warm') return <Wind size={12} className="text-amber-500" />;
    return <Snowflake size={12} className="text-blue-400" />;
  };
  const getStatusBadge = () => {
    switch (lead._normalizedStatus) {
      case 'Open': return <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Open</span>;
      case 'FollowUp': return <span className="text-[9px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded font-medium">Follow Up</span>;
      case 'Booked': return <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">Booked</span>;
      case 'Lost': return <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded font-medium">Lost</span>;
      default: return null;
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-3 active:bg-gray-50 transition-all duration-200 ${
      lead._callStatus === 'never_called' ? 'border-l-4 border-l-red-400' :
      lead._callStatus === 'needs_retry' ? 'border-l-4 border-l-orange-400' :
      lead._followUpPriority <= 2 ? 'border-l-4 border-l-amber-400' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-2">
        {rank && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{rank}</span>
          </div>
        )}
        <div className="flex-1 min-w-0" onClick={onNavigate}>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
            {getInterestDot()}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {lead.project && <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{lead.project}</span>}
            {getCallBadge()} {getStatusBadge()}
            {lead._callCount > 0 && <span className="text-[9px] text-gray-400">{lead._callCount} calls</span>}
            {lead._daysUntilFollowUp !== null && lead._daysUntilFollowUp <= 1 && (
              <span className="text-[9px] text-red-500 font-semibold">
                {lead._daysUntilFollowUp < 0 ? 'OVERDUE' : lead._daysUntilFollowUp === 0 ? 'TODAY' : 'TMRW'}
              </span>
            )}
          </div>
          {/* ── ASSIGNMENT TIME — clearly visible below badges ── */}
          {assignedTime && (
            <div className="flex items-center gap-1 mt-1" title={assignedFull}>
              <UserCheck size={10} className="text-[#D4AF37] shrink-0" />
              <span className="text-[10px] text-[#8B6914] font-medium">{assignedTime}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={e => { e.stopPropagation(); onCopy?.(lead.phone, lead.id); }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-200 active:bg-gray-100 active:scale-95 transition">
            {copiedId === lead.id ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} className="text-gray-400" />}
          </button>
          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 active:bg-emerald-100 active:scale-95 transition">
            <Phone size={15} className="text-emerald-600" />
          </a>
          <button onClick={e => { e.stopPropagation(); onAction(); }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 active:bg-[#D4AF37]/20 active:scale-95 transition"
            title="Log call & update">
            <ChevronRight size={15} className="text-[#D4AF37]" />
          </button>
        </div>
      </div>
    </div>
  );
});
LeadCallCard.displayName = 'LeadCallCard';

// ─── FOLLOW UP SECTION ───────────────────────────────
const FollowUpSection = React.memo(({ title, icon, leads, color, onAction, onNavigate }) => (
  <div className={`rounded-2xl border ${color} overflow-hidden`}>
    <div className="flex items-center gap-2 px-3 py-2">
      {icon}
      <span className="text-xs font-bold text-gray-700">{title}</span>
      <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full font-bold text-gray-600">{leads.length}</span>
    </div>
    <div className="bg-white/60 divide-y divide-gray-100">
      {leads.map(lead => {
        const assignedTime = formatAssignedTime(lead._assignedAt);
        const assignedFull = fullAssignedTime(lead._assignedAt);
        return (
          <div key={lead.id} className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex-1 min-w-0" onClick={() => onNavigate(lead.id)}>
              <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {lead.project && <span className="text-[10px] text-gray-400">{lead.project}</span>}
                {lead._daysUntilFollowUp !== null && (
                  <span className={`text-[9px] font-bold ${
                    lead._daysUntilFollowUp < 0 ? 'text-red-600' : lead._daysUntilFollowUp === 0 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {lead._daysUntilFollowUp < 0 ? `${Math.abs(lead._daysUntilFollowUp)}d overdue`
                      : lead._daysUntilFollowUp === 0 ? 'Today' : lead._daysUntilFollowUp === 1 ? 'Tomorrow' : `In ${lead._daysUntilFollowUp}d`}
                  </span>
                )}
              </div>
              {/* Assignment time in follow-up section */}
              {assignedTime && (
                <div className="flex items-center gap-1 mt-0.5" title={assignedFull}>
                  <UserCheck size={10} className="text-[#D4AF37] shrink-0" />
                  <span className="text-[10px] text-[#8B6914] font-medium">{assignedTime}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center active:scale-95">
                <Phone size={14} className="text-emerald-600" />
              </a>
              <button onClick={() => onAction(lead)}
                className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center active:scale-95">
                <ChevronRight size={14} className="text-[#D4AF37]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
));
FollowUpSection.displayName = 'FollowUpSection';

// ─── EMPTY STATE ─────────────────────────────────────
const EmptyState = ({ message, icon: Icon = Check }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
      <Icon size={24} className="text-emerald-400" />
    </div>
    <p className="text-sm text-gray-500 font-medium">{message}</p>
  </div>
);

export default EmployeeCRMHome;
