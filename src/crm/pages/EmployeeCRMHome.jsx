// src/crm/pages/EmployeeCRMHome.jsx
// Mobile-first Employee CRM — Call leads, update status, track follow-ups
// Designed for fast 1-thumb operation on phone
import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Phone, PhoneOff, PhoneMissed, PhoneIncoming, Clock, Calendar,
  AlertCircle, Search, ChevronRight, MessageCircle, X, Check,
  MapPin, Flame, Wind, Snowflake, Loader2, RefreshCw, Filter
} from 'lucide-react';
import { normalizeLeadStatus, normalizeInterestLevel, LEAD_STATUS } from '@/crm/utils/statusUtils';
import { differenceInHours, differenceInDays, parseISO, format } from 'date-fns';

// ─── TAB IDs ───────────────────────────────────────────
const TABS = {
  CALL_NOW: 'call_now',
  FOLLOW_UP: 'follow_up',
  ALL_LEADS: 'all_leads',
};

// ─── QUICK CALL STATUSES (1-tap) ──────────────────────
const QUICK_STATUSES = [
  { id: 'not_answered', label: 'No Answer', icon: PhoneMissed, color: 'bg-red-100 text-red-700 border-red-200', dbValue: 'Not Answered' },
  { id: 'busy', label: 'Busy', icon: PhoneOff, color: 'bg-orange-100 text-orange-700 border-orange-200', dbValue: 'Busy' },
  { id: 'connected', label: 'Connected', icon: PhoneIncoming, color: 'bg-green-100 text-green-700 border-green-200', dbValue: 'Connected' },
  { id: 'switched_off', label: 'Off', icon: PhoneOff, color: 'bg-gray-100 text-gray-600 border-gray-200', dbValue: 'Switched Off' },
];

// ─── LEAD OUTCOME ACTIONS (after connected call) ──────
const LEAD_OUTCOMES = [
  { id: 'follow_up', label: 'Follow Up', color: 'bg-yellow-500 text-white' },
  { id: 'site_visit', label: 'Site Visit', color: 'bg-purple-500 text-white' },
  { id: 'booked', label: 'Booked!', color: 'bg-green-500 text-white' },
  { id: 'not_interested', label: 'Not Interested', color: 'bg-gray-500 text-white' },
];

const EmployeeCRMHome = () => {
  const { user } = useAuth();
  const {
    leads, leadsLoading, calls, addCallLog, updateLead, fetchLeads,
    siteVisits, bookings, workLogs
  } = useCRMData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(TABS.CALL_NOW);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Action modal state
  const [actionLead, setActionLead] = useState(null);
  const [actionStep, setActionStep] = useState(null); // 'call_status' | 'outcome' | 'follow_up' | 'notes'
  const [callNote, setCallNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [saving, setSaving] = useState(false);

  const userId = user?.uid || user?.id;

  // ── My leads ────────────────────────────────────────
  const myLeads = useMemo(() =>
    leads.filter(l => l.assignedTo === userId || l.assigned_to === userId),
    [leads, userId]
  );

  // ── My calls ────────────────────────────────────────
  const myCalls = useMemo(() =>
    calls?.filter(c => c.employeeId === userId || c.employee_id === userId) || [],
    [calls, userId]
  );

  // ── Today's stats ──────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayStats = useMemo(() => {
    const todayCalls = myCalls.filter(c => c.timestamp?.startsWith(today));
    return {
      calls: todayCalls.length,
      connected: todayCalls.filter(c => c.status === 'Connected').length,
      visits: siteVisits?.filter(v => (v.employeeId === userId) && v.timestamp?.startsWith(today)).length || 0,
      bookings: bookings?.filter(b => (b.employeeId === userId) && b.timestamp?.startsWith(today)).length || 0,
    };
  }, [myCalls, siteVisits, bookings, today, userId]);

  // ── Analyze leads with call history ─────────────────
  const analyzedLeads = useMemo(() => {
    const now = new Date();

    return myLeads.map(lead => {
      const leadCalls = myCalls.filter(c => c.leadId === lead.id || c.lead_id === lead.id);
      const lastCall = leadCalls.sort((a, b) =>
        new Date(b.timestamp || b.call_time) - new Date(a.timestamp || a.call_time)
      )[0];

      let callStatus = 'never_called';
      let hoursSinceCall = Infinity;

      if (leadCalls.length === 0) {
        callStatus = 'never_called';
      } else if (lastCall) {
        try {
          hoursSinceCall = differenceInHours(now, new Date(lastCall.timestamp || lastCall.call_time));
        } catch { hoursSinceCall = 999; }
        const isConnected = lastCall.status === 'Connected' || lastCall.status === 'connected';
        if (!isConnected && hoursSinceCall >= 2) callStatus = 'needs_retry';
        else if (!isConnected) callStatus = 'recently_unanswered';
        else callStatus = 'connected';
      }

      // Follow-up analysis
      const fuDate = lead.followUpDate || lead.follow_up_date || lead.next_followup_date;
      let followUpPriority = 5; // no follow-up set
      let daysUntilFollowUp = null;
      if (fuDate) {
        try {
          daysUntilFollowUp = differenceInDays(parseISO(fuDate), now);
          if (daysUntilFollowUp < 0) followUpPriority = 1; // overdue
          else if (daysUntilFollowUp === 0) followUpPriority = 2; // today
          else if (daysUntilFollowUp === 1) followUpPriority = 3; // tomorrow
          else if (daysUntilFollowUp <= 7) followUpPriority = 4; // this week
        } catch { /* ignore */ }
      }

      const status = normalizeLeadStatus(lead.status);
      const interest = normalizeInterestLevel(lead.interestLevel || lead.interest_level);
      const tempScore = interest === 'Hot' ? 30 : interest === 'Warm' ? 20 : 10;
      const callScore = callStatus === 'never_called' ? 100 : callStatus === 'needs_retry' ? 80 : callStatus === 'recently_unanswered' ? 40 : 10;
      const fuScore = followUpPriority <= 2 ? 50 : followUpPriority === 3 ? 30 : 0;

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
      };
    });
  }, [myLeads, myCalls]);

  // ── TAB: "Call Now" — prioritized calling list ───────
  const callNowLeads = useMemo(() =>
    analyzedLeads
      .filter(l => l._normalizedStatus !== LEAD_STATUS.BOOKED && l._normalizedStatus !== LEAD_STATUS.LOST)
      .sort((a, b) => b._score - a._score),
    [analyzedLeads]
  );

  // ── TAB: "Follow Up" — grouped by overdue/today/tomorrow ─
  const followUpLeads = useMemo(() => {
    const grouped = { overdue: [], today: [], tomorrow: [], thisWeek: [], noDate: [] };
    analyzedLeads.forEach(l => {
      if (l._normalizedStatus === LEAD_STATUS.LOST) return;
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

  // ── TAB: "All Leads" — filtered search ──────────────
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

  // ── Status counts for chips ────────────────────────
  const statusCounts = useMemo(() => {
    const c = { Open: 0, FollowUp: 0, Booked: 0, Lost: 0, total: myLeads.length };
    analyzedLeads.forEach(l => { if (c[l._normalizedStatus] !== undefined) c[l._normalizedStatus]++; });
    return c;
  }, [analyzedLeads, myLeads.length]);

  // ── Refresh ─────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Lead data updated from cloud' });
  }, [fetchLeads, toast]);

  // ── ACTION: Open quick action for a lead ────────────
  const openAction = useCallback((lead) => {
    setActionLead(lead);
    setActionStep('call_status');
    setCallNote('');
    setFollowUpDate('');
    setFollowUpTime('10:00');
  }, []);

  const closeAction = useCallback(() => {
    setActionLead(null);
    setActionStep(null);
    setCallNote('');
    setFollowUpDate('');
  }, []);

  // ── ACTION: Log call with 1 tap ────────────────────
  const handleQuickCallStatus = useCallback(async (statusObj) => {
    if (!actionLead || saving) return;
    setSaving(true);

    try {
      await addCallLog({
        leadId: actionLead.id,
        leadName: actionLead.name,
        projectName: actionLead.project || '',
        employeeId: userId,
        type: 'Outgoing',
        status: statusObj.dbValue,
        duration: 0,
        notes: callNote || `Quick log: ${statusObj.label}`,
      });

      if (statusObj.id === 'connected') {
        setActionStep('outcome');
      } else {
        // For not-answered/busy/off — offer to set follow-up
        setActionStep('follow_up_quick');
      }

      toast({ title: `${statusObj.label}`, description: `Call logged for ${actionLead.name}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [actionLead, saving, addCallLog, userId, callNote, toast]);

  // ── ACTION: Handle outcome after connected call ─────
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
        updates.status = 'FollowUp';
        updates.siteVisitStatus = 'planned';
        await updateLead(actionLead.id, updates);
        toast({ title: 'Site Visit Planned', description: `Marked for ${actionLead.name}` });
        closeAction();
      } else if (outcome.id === 'booked') {
        updates.status = 'Booked';
        await updateLead(actionLead.id, updates);
        toast({ title: 'Booked!', description: `${actionLead.name} marked as Booked` });
        closeAction();
      } else if (outcome.id === 'not_interested') {
        updates.status = 'Lost';
        await updateLead(actionLead.id, updates);
        toast({ title: 'Marked Lost', description: `${actionLead.name} marked as Not Interested` });
        closeAction();
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [actionLead, saving, updateLead, toast, closeAction]);

  // ── ACTION: Save follow-up date ─────────────────────
  const handleSaveFollowUp = useCallback(async () => {
    if (!actionLead || saving) return;
    setSaving(true);

    try {
      const updates = { status: 'FollowUp' };
      if (followUpDate) updates.followUpDate = followUpDate;
      if (callNote) updates.notes = `${actionLead.notes || ''}\n[${new Date().toLocaleString('en-IN')}] ${callNote}`.trim();
      await updateLead(actionLead.id, updates);
      toast({ title: 'Follow-up Set', description: followUpDate ? `Reminder for ${format(parseISO(followUpDate), 'MMM dd')}` : 'Status updated' });
      closeAction();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [actionLead, saving, followUpDate, callNote, updateLead, toast, closeAction]);

  const setQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  // ── LOADING ─────────────────────────────────────────
  if (leadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Loading your leads...</p>
      </div>
    );
  }

  // ── RENDER ──────────────────────────────────────────
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">

      {/* ─── STICKY HEADER ─────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Hi {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-[10px] text-gray-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>

          {/* Today's mini stats */}
          <div className="flex gap-3 items-center">
            <div className="text-center">
              <p className="text-sm font-bold text-blue-600">{todayStats.calls}</p>
              <p className="text-[9px] text-gray-400">Calls</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-green-600">{todayStats.connected}</p>
              <p className="text-[9px] text-gray-400">Hit</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-purple-600">{todayStats.visits}</p>
              <p className="text-[9px] text-gray-400">Visit</p>
            </div>
            <button onClick={handleRefresh} className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200">
              <RefreshCw size={16} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t">
          {[
            { id: TABS.CALL_NOW, label: 'Call Now', count: callNowLeads.length },
            { id: TABS.FOLLOW_UP, label: 'Follow Up', count: followUpCounts.overdue + followUpCounts.today, urgent: followUpCounts.overdue > 0 },
            { id: TABS.ALL_LEADS, label: 'All', count: myLeads.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-semibold relative transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  tab.urgent ? 'bg-red-500 text-white animate-pulse' :
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
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

        {/* ═══ TAB: CALL NOW ═══════════════════════════ */}
        {activeTab === TABS.CALL_NOW && (
          <div className="space-y-2">
            {/* Priority alert */}
            {callNowLeads.filter(l => l._callStatus === 'never_called').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-bold text-red-700">
                  {callNowLeads.filter(l => l._callStatus === 'never_called').length} leads never called — start with these!
                </p>
              </div>
            )}

            {callNowLeads.map((lead, idx) => (
              <LeadCallCard
                key={lead.id}
                lead={lead}
                rank={idx + 1}
                onAction={() => openAction(lead)}
                onNavigate={() => navigate(`/crm/sales/lead/${lead.id}`)}
              />
            ))}

            {callNowLeads.length === 0 && (
              <EmptyState message="All leads are contacted! Great job!" />
            )}
          </div>
        )}

        {/* ═══ TAB: FOLLOW UP ═════════════════════════ */}
        {activeTab === TABS.FOLLOW_UP && (
          <div className="space-y-4">
            {followUpCounts.overdue > 0 && (
              <FollowUpSection
                title="Overdue"
                icon={<AlertCircle size={14} className="text-red-600" />}
                leads={followUpLeads.overdue}
                color="border-red-200 bg-red-50"
                onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)}
              />
            )}
            {followUpCounts.today > 0 && (
              <FollowUpSection
                title="Today"
                icon={<Clock size={14} className="text-yellow-600" />}
                leads={followUpLeads.today}
                color="border-yellow-200 bg-yellow-50"
                onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)}
              />
            )}
            {followUpCounts.tomorrow > 0 && (
              <FollowUpSection
                title="Tomorrow"
                icon={<Calendar size={14} className="text-blue-600" />}
                leads={followUpLeads.tomorrow}
                color="border-blue-200 bg-blue-50"
                onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)}
              />
            )}
            {followUpCounts.thisWeek > 0 && (
              <FollowUpSection
                title="This Week"
                icon={<Calendar size={14} className="text-indigo-600" />}
                leads={followUpLeads.thisWeek}
                color="border-indigo-200 bg-indigo-50"
                onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)}
              />
            )}
            {followUpLeads.noDate.length > 0 && (
              <FollowUpSection
                title="No Date Set"
                icon={<Calendar size={14} className="text-gray-400" />}
                leads={followUpLeads.noDate}
                color="border-gray-200 bg-gray-50"
                onAction={openAction}
                onNavigate={(id) => navigate(`/crm/sales/lead/${id}`)}
              />
            )}

            {followUpCounts.total === 0 && followUpLeads.noDate.length === 0 && (
              <EmptyState message="No follow-ups scheduled. You're all caught up!" />
            )}
          </div>
        )}

        {/* ═══ TAB: ALL LEADS ═════════════════════════ */}
        {activeTab === TABS.ALL_LEADS && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <Input
                placeholder="Search name, phone, project..."
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Status filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {[
                { id: 'all', label: 'All', count: statusCounts.total, color: 'bg-gray-100 text-gray-700' },
                { id: 'Open', label: 'Open', count: statusCounts.Open, color: 'bg-blue-100 text-blue-700' },
                { id: 'FollowUp', label: 'Follow Up', count: statusCounts.FollowUp, color: 'bg-yellow-100 text-yellow-700' },
                { id: 'Booked', label: 'Booked', count: statusCounts.Booked, color: 'bg-green-100 text-green-700' },
                { id: 'Lost', label: 'Lost', count: statusCounts.Lost, color: 'bg-gray-100 text-gray-500' },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                    statusFilter === chip.id
                      ? `${chip.color} border-current shadow-sm scale-105`
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  {chip.label} ({chip.count})
                </button>
              ))}
            </div>

            {/* Lead list */}
            <div className="space-y-2">
              {allLeadsFiltered.map(lead => (
                <LeadCallCard
                  key={lead.id}
                  lead={lead}
                  onAction={() => openAction(lead)}
                  onNavigate={() => navigate(`/crm/sales/lead/${lead.id}`)}
                  compact
                />
              ))}
              {allLeadsFiltered.length === 0 && (
                <EmptyState message="No leads match your search." />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── ACTION MODAL (Bottom Sheet Style) ─────── */}
      <Dialog open={!!actionLead} onOpenChange={() => closeAction()}>
        <DialogContent className="max-w-md mx-auto sm:max-w-sm !rounded-t-2xl !rounded-b-none sm:!rounded-xl fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 p-0 border-0 shadow-2xl max-h-[85vh] overflow-hidden">

          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {actionLead && (
            <div className="px-4 pb-6 pt-2 overflow-y-auto">
              {/* Lead info header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 truncate">{actionLead.name}</h3>
                  <p className="text-xs text-gray-500">{actionLead.project} &middot; {actionLead.phone}</p>
                </div>
                <div className="flex gap-2 ml-2">
                  <a
                    href={`tel:${actionLead.phone}`}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white shadow-lg active:scale-95 transition"
                  >
                    <Phone size={18} />
                  </a>
                  <a
                    href={`https://wa.me/91${(actionLead.phone || '').replace(/[^0-9]/g, '').slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] text-white shadow-lg active:scale-95 transition"
                  >
                    <MessageCircle size={18} />
                  </a>
                </div>
              </div>

              {/* ── STEP: Call Status (1-tap) ──────── */}
              {actionStep === 'call_status' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">What happened on the call?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_STATUSES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleQuickCallStatus(s)}
                        disabled={saving}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 ${s.color} font-semibold text-sm active:scale-95 transition disabled:opacity-50`}
                      >
                        <s.icon size={18} />
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Optional note */}
                  <div>
                    <Textarea
                      placeholder="Quick note (optional)..."
                      value={callNote}
                      onChange={e => setCallNote(e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP: Outcome (after connected) ── */}
              {actionStep === 'outcome' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">What's the outcome?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LEAD_OUTCOMES.map(o => (
                      <button
                        key={o.id}
                        onClick={() => handleOutcome(o)}
                        disabled={saving}
                        className={`p-3 rounded-xl ${o.color} font-semibold text-sm active:scale-95 transition shadow-sm disabled:opacity-50`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP: Quick follow-up (after no answer) ── */}
              {actionStep === 'follow_up_quick' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Set follow-up reminder?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '2 Hours', hours: 2 },
                      { label: 'Tomorrow', days: 1 },
                      { label: 'In 3 Days', days: 3 },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          if (opt.hours) {
                            // Just set to today with a note
                            setFollowUpDate(today);
                            setCallNote(`Retry in ${opt.hours}h`);
                          } else {
                            setQuickDate(opt.days);
                          }
                          setActionStep('follow_up_confirm');
                        }}
                        className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs active:scale-95 transition"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={closeAction}
                    className="w-full p-2 text-xs text-gray-400 font-medium"
                  >
                    Skip for now
                  </button>
                </div>
              )}

              {/* ── STEP: Follow-up schedule (after connected + follow up) ── */}
              {actionStep === 'follow_up_schedule' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">When to follow up?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Tomorrow', days: 1 },
                      { label: 'In 3 Days', days: 3 },
                      { label: 'Next Week', days: 7 },
                      { label: 'In 2 Weeks', days: 14 },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setQuickDate(opt.days);
                          setActionStep('follow_up_confirm');
                        }}
                        className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs active:scale-95 transition"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400">Or pick a date:</label>
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={e => { setFollowUpDate(e.target.value); setActionStep('follow_up_confirm'); }}
                      min={today}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP: Confirm follow-up ──────── */}
              {actionStep === 'follow_up_confirm' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium">Follow-up set for</p>
                    <p className="text-lg font-bold text-blue-800">
                      {followUpDate ? format(parseISO(followUpDate), 'EEE, MMM dd') : 'Today'}
                    </p>
                  </div>
                  <Textarea
                    placeholder="Notes for next call..."
                    value={callNote}
                    onChange={e => setCallNote(e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                  />
                  <Button
                    onClick={handleSaveFollowUp}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11"
                  >
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
const LeadCallCard = React.memo(({ lead, rank, onAction, onNavigate, compact }) => {
  const getCallBadge = () => {
    switch (lead._callStatus) {
      case 'never_called':
        return <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">NEW</span>;
      case 'needs_retry':
        return <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">RETRY</span>;
      case 'recently_unanswered':
        return <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">WAIT</span>;
      default:
        return <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">OK</span>;
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
      case 'Booked': return <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Booked</span>;
      case 'Lost': return <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded font-medium">Lost</span>;
      default: return null;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-3 active:bg-gray-50 transition ${
        lead._callStatus === 'never_called' ? 'border-l-4 border-l-red-400' :
        lead._callStatus === 'needs_retry' ? 'border-l-4 border-l-orange-400' :
        lead._followUpPriority <= 2 ? 'border-l-4 border-l-yellow-400' :
        'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Rank */}
        {rank && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{rank}</span>
          </div>
        )}

        {/* Lead info — tap to open details */}
        <div className="flex-1 min-w-0" onClick={onNavigate}>
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
            {getInterestDot()}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {lead.project && <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{lead.project}</span>}
            {getCallBadge()}
            {getStatusBadge()}
            {lead._callCount > 0 && (
              <span className="text-[9px] text-gray-400">{lead._callCount} calls</span>
            )}
            {lead._daysUntilFollowUp !== null && lead._daysUntilFollowUp <= 1 && (
              <span className="text-[9px] text-red-500 font-semibold">
                {lead._daysUntilFollowUp < 0 ? 'OVERDUE' : lead._daysUntilFollowUp === 0 ? 'TODAY' : 'TMRW'}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 shrink-0">
          <a
            href={`tel:${lead.phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 border border-green-200 active:bg-green-100 active:scale-95 transition"
          >
            <Phone size={15} className="text-green-600" />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 border border-blue-200 active:bg-blue-100 active:scale-95 transition"
            title="Log call & update"
          >
            <ChevronRight size={15} className="text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
});

LeadCallCard.displayName = 'LeadCallCard';

// ─── FOLLOW UP SECTION ───────────────────────────────
const FollowUpSection = React.memo(({ title, icon, leads, color, onAction, onNavigate }) => (
  <div className={`rounded-xl border ${color} overflow-hidden`}>
    <div className="flex items-center gap-2 px-3 py-2">
      {icon}
      <span className="text-xs font-bold text-gray-700">{title}</span>
      <span className="text-[10px] bg-white/80 px-1.5 py-0.5 rounded-full font-bold text-gray-600">{leads.length}</span>
    </div>
    <div className="bg-white/60 divide-y divide-gray-100">
      {leads.map(lead => (
        <div key={lead.id} className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex-1 min-w-0" onClick={() => onNavigate(lead.id)}>
            <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {lead.project && <span className="text-[10px] text-gray-400">{lead.project}</span>}
              {lead._daysUntilFollowUp !== null && (
                <span className={`text-[9px] font-bold ${
                  lead._daysUntilFollowUp < 0 ? 'text-red-600' : lead._daysUntilFollowUp === 0 ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {lead._daysUntilFollowUp < 0
                    ? `${Math.abs(lead._daysUntilFollowUp)}d overdue`
                    : lead._daysUntilFollowUp === 0
                    ? 'Today'
                    : lead._daysUntilFollowUp === 1
                    ? 'Tomorrow'
                    : `In ${lead._daysUntilFollowUp}d`}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <a
              href={`tel:${lead.phone}`}
              onClick={e => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center active:scale-95"
            >
              <Phone size={14} className="text-green-600" />
            </a>
            <button
              onClick={() => onAction(lead)}
              className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center active:scale-95"
            >
              <ChevronRight size={14} className="text-blue-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
));

FollowUpSection.displayName = 'FollowUpSection';

// ─── EMPTY STATE ─────────────────────────────────────
const EmptyState = ({ message }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <Check size={24} className="text-gray-400" />
    </div>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

export default EmployeeCRMHome;
