// src/crm/hooks/useMyLeads.js
// ✅ PERF: Fetches ONLY leads assigned to the current employee (server-side filter).
// Previously, MyLeads used useCRMData which downloads ALL ~2000 leads globally,
// then client-side filtered. An employee with 793 leads was downloading 2000+ leads
// (132 kB × 2 duplicate requests = 264 kB) causing 12+ second page loads.
// This hook adds `.eq('assigned_to', userId)` so Supabase returns only this
// employee's rows — typically 90%+ fewer bytes over the wire.
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { addCall, getCalls } from '@/lib/crmSupabase';

const normalize = (row) => ({
  id:                 row.id,
  name:               row.full_name          || '',
  phone:              row.phone              || '',
  email:              row.email              || '',
  source:             row.source             || 'Manual Import',
  status:             row.final_status       || row.status || 'FollowUp',
  budget:             row.budget             || '',
  interestLevel:      row.interest_level     || 'Cold',
  notes:              row.notes              || '',
  callAttempt:        row.call_attempt       || '',
  callStatus:         row.call_status        || '',
  siteVisitStatus:    row.site_visit_status  || '',
  finalStatus:        row.final_status       || 'FollowUp',
  assignedTo:         row.assigned_to        || null,
  assignedToName:     row.assigned_to_name   || null,
  createdBy:          row.created_by         || null,
  createdAt:          row.created_at,
  updatedAt:          row.updated_at,
  lastActivity:       row.updated_at,
  project:            row.project            || '',
  followUpDate:       row.next_followup_date || null,
  follow_up_date:     row.next_followup_date || null,
  tokenAmount:        row.token_amount       || 0,
  bookingAmount:      row.booking_amount     || 0,
  partialPayment:     row.partial_payment    || 0,
  paymentMode:        row.payment_mode       || 'Cash',
  unitNumber:         row.unit_number        || '',
  isVIP:              row.is_vip             || false,
  assignedAt:         row.assigned_at        || null,
  assigned_to:        row.assigned_to        || null,
  prevAssignedTo:     row.prev_assigned_to       || null,
  prevAssignedToName: row.prev_assigned_to_name  || null,
  prevAssignedAt:     row.prev_assigned_at       || null,
});

export const useMyLeads = (userId) => {
  const [leads, setLeads]         = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [calls, setCalls]         = useState([]);
  const reqId = useRef(0);
  const tabWasHidden = useRef(false);

  // ── Fetch only THIS employee's leads ──────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!userId) return;
    const thisReq = ++reqId.current;
    try {
      setLeadsLoading(true);
      const PAGE_SIZE = 500;
      let allData = [], from = 0, keepGoing = true;
      while (keepGoing) {
        const { data, error } = await supabaseAdmin
          .from('leads')
          .select('*')
          .eq('assigned_to', userId)           // ← SERVER-SIDE filter: only my leads
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) {
          console.error('[MyLeads] Fetch error:', error.message);
          if (thisReq === reqId.current) setLeads([]);
          return;
        }
        if (thisReq !== reqId.current) return;
        allData = allData.concat(data || []);
        if (!data || data.length < PAGE_SIZE) keepGoing = false;
        else from += PAGE_SIZE;
      }
      if (thisReq !== reqId.current) return;
      setLeads(allData.map(normalize));
      console.log(`[MyLeads] req#${thisReq} — ${allData.length} leads for user ${userId}`);
    } catch (err) {
      console.error('[MyLeads] Unexpected error:', err);
      if (thisReq === reqId.current) setLeads([]);
    } finally {
      if (thisReq === reqId.current) setLeadsLoading(false);
    }
  }, [userId]);

  // ── Fetch calls for this employee only ────────────────────────────────
  const fetchCalls = useCallback(async () => {
    if (!userId) return;
    try {
      // getCalls() returns all; we filter client-side for calls.
      // Calls table is much smaller (<500 rows typically) so this is fine.
      const data = await getCalls();
      const myCalls = (data || []).filter(r => r.employee_id === userId).map(row => ({
        id: row.id, employeeId: row.employee_id, leadId: row.lead_id,
        leadName: row.lead_name, projectName: row.project_name, type: row.call_type,
        status: row.status, duration: row.duration, notes: row.notes,
        employee_name: row.employee_name, created_at: row.created_at,
        timestamp: row.created_at,
        majorObjection: row.major_objection || null,
      }));
      setCalls(myCalls);
    } catch (err) {
      console.error('[MyLeads] fetchCalls error:', err);
    }
  }, [userId]);

  // ── optimistic updateLead ─────────────────────────────────────────────
  const updateLead = useCallback(async (id, updates) => {
    try {
      const mapped = {};
      if (updates.name            !== undefined) mapped.full_name          = updates.name;
      if (updates.phone           !== undefined) mapped.phone              = updates.phone;
      if (updates.email           !== undefined) mapped.email              = updates.email;
      if (updates.source          !== undefined) mapped.source             = updates.source;
      if (updates.budget          !== undefined) mapped.budget = updates.budget && typeof updates.budget !== 'string' ? String(updates.budget) : updates.budget;
      if (updates.status          !== undefined) mapped.final_status       = updates.status;
      if (updates.interestLevel   !== undefined) mapped.interest_level     = updates.interestLevel;
      if (updates.notes           !== undefined) mapped.notes              = updates.notes;
      if (updates.callAttempt     !== undefined) mapped.call_attempt       = updates.callAttempt;
      if (updates.callStatus      !== undefined) mapped.call_status        = updates.callStatus;
      if (updates.siteVisitStatus !== undefined) mapped.site_visit_status  = updates.siteVisitStatus;
      if (updates.project         !== undefined) mapped.project            = updates.project;
      if (updates.last_activity   !== undefined) mapped.updated_at         = updates.last_activity;
      if (updates.followUpDate !== undefined) {
        mapped.next_followup_date = updates.followUpDate;
        mapped.follow_up_date     = updates.followUpDate;
      }
      if (updates.follow_up_date !== undefined) {
        mapped.next_followup_date = updates.follow_up_date;
        mapped.follow_up_date     = updates.follow_up_date;
      }
      if (updates.follow_up_status !== undefined) mapped.follow_up_status = updates.follow_up_status;
      mapped.updated_at = new Date().toISOString();

      const { error } = await supabaseAdmin.from('leads').update(mapped).eq('id', id);
      if (error) { console.error('[MyLeads] updateLead error:', error.message); return; }

      // Optimistic local update
      const hasFollowUpUpdate = updates.follow_up_date !== undefined || updates.followUpDate !== undefined;
      const newFollowUp = hasFollowUpUpdate
        ? (updates.follow_up_date ?? updates.followUpDate ?? null)
        : undefined;
      setLeads(prev => prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates, lastActivity: new Date().toISOString() };
        if (hasFollowUpUpdate) {
          updated.follow_up_date = newFollowUp;
          updated.followUpDate   = newFollowUp;
          updated.next_followup_date = newFollowUp;
        }
        return updated;
      }));
    } catch (err) { console.error('[MyLeads] updateLead unexpected error:', err); }
  }, []);

  // ── addCallLog ────────────────────────────────────────────────────────
  const addCallLog = useCallback(async (log) => {
    try {
      const result = await addCall(log);
      if (result.success) {
        await fetchCalls();
        return result.data;
      }
      return null;
    } catch (err) { console.error('[MyLeads] addCallLog error:', err); return null; }
  }, [fetchCalls]);

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    fetchLeads();
    fetchCalls();
  }, [userId, fetchLeads, fetchCalls]);

  // ── Realtime: only listen to changes for this employee's leads ────────
  useEffect(() => {
    if (!userId) return;

    const leadsChannel = supabaseAdmin
      .channel(`realtime:leads:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'leads',
        filter: `assigned_to=eq.${userId}`,
      }, () => fetchLeads())
      .subscribe();

    const callsChannel = supabaseAdmin
      .channel(`realtime:calls:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' },
        () => fetchCalls())
      .subscribe();

    // Tab visibility refetch
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tabWasHidden.current = true;
      } else if (document.visibilityState === 'visible' && tabWasHidden.current) {
        tabWasHidden.current = false;
        fetchLeads();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabaseAdmin.removeChannel(leadsChannel);
      supabaseAdmin.removeChannel(callsChannel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId, fetchLeads, fetchCalls]);

  return { leads, leadsLoading, fetchLeads, updateLead, addCallLog, calls };
};
