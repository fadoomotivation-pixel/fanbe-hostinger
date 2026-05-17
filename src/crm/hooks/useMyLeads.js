// src/crm/hooks/useMyLeads.js
// ⚡ WIRED v3 — slim column select (no SELECT *) for faster wire payload
//   { leads, leadsLoading, calls, addCallLog, updateLead, fetchLeads, fetchCalls, refetch }

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Cache helpers ───────────────────────────────────────────────────────────
const LEADS_TTL = 3 * 60 * 1000;
const CALLS_TTL = 2 * 60 * 1000;

const readCache = (key, ttl) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts > ttl ? null : data;
  } catch { return null; }
};
const writeCache = (key, data) => {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
};
const burstCache = (key) => {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
};

// ─── Lead row normaliser ─────────────────────────────────────────────────────
const normalizeRow = (row) => ({
  id:                  row.id,
  name:                row.full_name          || '',
  phone:               row.phone              || '',
  email:               row.email              || '',
  source:              row.source             || 'Manual Import',
  status:              row.final_status       || row.status || 'FollowUp',
  budget:              row.budget             || '',
  interestLevel:       row.interest_level     || 'Cold',
  interest_level:      row.interest_level     || 'Cold',
  notes:               row.notes              || '',
  callAttempt:         row.call_attempt       || '',
  callStatus:          row.call_status        || '',
  siteVisitStatus:     row.site_visit_status  || '',
  finalStatus:         row.final_status       || 'FollowUp',
  assignedTo:          row.assigned_to        || null,
  assigned_to:         row.assigned_to        || null,
  assignedToName:      row.assigned_to_name   || null,
  createdBy:           row.created_by         || null,
  createdAt:           row.created_at,
  created_at:          row.created_at,
  lastActivity:        row.updated_at,
  project:             row.project            || '',
  followUpDate:        row.next_followup_date || null,
  follow_up_date:      row.next_followup_date || null,
  next_followup_date:  row.next_followup_date || null,
  follow_up_time:      row.follow_up_time     || null,
  follow_up_notes:     row.follow_up_notes    || null,
  follow_up_status:    row.follow_up_status   || null,
  tokenAmount:         row.token_amount       || 0,
  bookingAmount:       row.booking_amount     || 0,
  partialPayment:      row.partial_payment    || 0,
  paymentMode:         row.payment_mode       || 'Cash',
  unitNumber:          row.unit_number        || '',
  isVIP:               row.is_vip             || false,
  assignedAt:          row.assigned_at        || null,
  assigned_at:         row.assigned_at        || null,
  assignmentDate:      row.assigned_at        || null,
  prevAssignedTo:      row.prev_assigned_to       || null,
  prevAssignedToName:  row.prev_assigned_to_name  || null,
  prevAssignedAt:      row.prev_assigned_at       || null,
});

// ─── Call row normaliser ──────────────────────────────────────────────────────
const normalizeCall = (row) => ({
  id:          row.id,
  leadId:      row.lead_id,
  lead_id:     row.lead_id,
  leadName:    row.lead_name   || '',
  lead_name:   row.lead_name   || '',
  employeeId:  row.employee_id,
  employee_id: row.employee_id,
  status:      row.status      || '',
  type:        row.call_type   || row.type || 'Outgoing',
  call_type:   row.call_type   || 'Outgoing',
  duration:    row.duration    || 0,
  notes:       row.notes       || '',
  timestamp:   row.created_at,
  call_time:   row.created_at,
  projectName: row.project_name || '',
});

// ─── Slim column list (FIX: avoids SELECT * — smaller wire payload) ──────────
const LEAD_COLUMNS = [
  'id', 'full_name', 'phone', 'email', 'source', 'status', 'final_status',
  'budget', 'interest_level', 'notes', 'call_attempt', 'call_status',
  'site_visit_status', 'assigned_to', 'assigned_to_name', 'created_by',
  'created_at', 'updated_at', 'project', 'next_followup_date',
  'follow_up_time', 'follow_up_notes', 'follow_up_status',
  'token_amount', 'booking_amount', 'partial_payment', 'payment_mode',
  'unit_number', 'is_vip', 'assigned_at', 'prev_assigned_to',
  'prev_assigned_to_name', 'prev_assigned_at',
].join(',');

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════
export const useMyLeads = (userId) => {
  const leadsKey = userId ? `my_leads_${userId}` : null;
  const callsKey = userId ? `my_calls_${userId}` : null;

  const [leads, setLeads]               = useState(() => (userId ? readCache(`my_leads_${userId}`, LEADS_TTL) || [] : []));
  const [leadsLoading, setLeadsLoading] = useState(() => !(userId && readCache(`my_leads_${userId}`, LEADS_TTL)));
  const [calls, setCalls]               = useState(() => (userId ? readCache(`my_calls_${userId}`, CALLS_TTL) || [] : []));

  const leadsReqId  = useRef(0);
  const callsReqId  = useRef(0);
  const tabWasHidden = useRef(false);

  // ─── fetchLeads — slim columns, no SELECT * ────────────────────────────────
  const fetchLeads = useCallback(async (background = false) => {
    if (!userId) return;
    const thisReq = ++leadsReqId.current;
    if (!background) setLeadsLoading(true);

    try {
      // ⚡ FIX: explicit column list instead of SELECT * — reduces wire payload
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select(LEAD_COLUMNS)
        .eq('assigned_to', userId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) { console.error('[useMyLeads] leads fetch error:', error.message); return; }
      if (thisReq !== leadsReqId.current) return;

      const normalized = (data || []).map(normalizeRow);
      setLeads(normalized);
      writeCache(leadsKey, normalized);
    } catch (err) {
      console.error('[useMyLeads] leads unexpected error:', err);
    } finally {
      if (thisReq === leadsReqId.current) setLeadsLoading(false);
    }
  }, [userId, leadsKey]);

  // ─── fetchCalls — slim columns ─────────────────────────────────────────────
  const fetchCalls = useCallback(async (background = false) => {
    if (!userId) return;
    const thisReq = ++callsReqId.current;

    try {
      const { data, error } = await supabaseAdmin
        .from('calls')
        .select('id,lead_id,lead_name,employee_id,status,call_type,duration,notes,created_at,project_name')
        .eq('employee_id', userId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) { console.error('[useMyLeads] calls fetch error:', error.message); return; }
      if (thisReq !== callsReqId.current) return;

      const normalized = (data || []).map(normalizeCall);
      setCalls(normalized);
      writeCache(callsKey, normalized);
    } catch (err) {
      console.error('[useMyLeads] calls unexpected error:', err);
    }
  }, [userId, callsKey]);

  // ─── Initial load (both in parallel) ───────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const cachedLeads = readCache(leadsKey, LEADS_TTL);
    const cachedCalls = readCache(callsKey, CALLS_TTL);

    if (cachedLeads) { setLeads(cachedLeads); setLeadsLoading(false); fetchLeads(true); }
    else { fetchLeads(false); }

    if (cachedCalls) { setCalls(cachedCalls); fetchCalls(true); }
    else { fetchCalls(false); }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabaseAdmin
      .channel(`my_leads_rt_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `assigned_to=eq.${userId}` },
        () => fetchLeads(true))
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tabWasHidden.current = true;
      } else if (document.visibilityState === 'visible' && tabWasHidden.current) {
        tabWasHidden.current = false;
        fetchLeads(true);
        fetchCalls(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabaseAdmin.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId, fetchLeads, fetchCalls]);

  // ─── updateLead — optimistic UI + Supabase write ───────────────────────────
  const updateLead = useCallback(async (leadId, updates) => {
    if (!leadId) return;

    const dbUpdates = {};
    if (updates.status           != null) dbUpdates.final_status       = updates.status;
    if (updates.followUpDate     != null) dbUpdates.next_followup_date  = updates.followUpDate;
    if (updates.follow_up_date   != null) dbUpdates.next_followup_date  = updates.follow_up_date;
    if (updates.follow_up_status != null) dbUpdates.follow_up_status    = updates.follow_up_status;
    if (updates.notes            != null) dbUpdates.notes               = updates.notes;
    if (updates.interestLevel    != null) dbUpdates.interest_level      = updates.interestLevel;
    if (updates.siteVisitStatus  != null) dbUpdates.site_visit_status   = updates.siteVisitStatus;
    if ('follow_up_date' in updates && updates.follow_up_date === null) dbUpdates.next_followup_date = null;
    if ('followUpDate'   in updates && updates.followUpDate   === null) dbUpdates.next_followup_date = null;

    setLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      return {
        ...l,
        ...(dbUpdates.final_status       != null ? { status: dbUpdates.final_status, finalStatus: dbUpdates.final_status } : {}),
        ...(dbUpdates.next_followup_date != null ? { followUpDate: dbUpdates.next_followup_date, follow_up_date: dbUpdates.next_followup_date } : {}),
        ...(dbUpdates.next_followup_date === null ? { followUpDate: null, follow_up_date: null } : {}),
        ...(dbUpdates.notes              != null ? { notes: dbUpdates.notes } : {}),
        ...(dbUpdates.interest_level     != null ? { interestLevel: dbUpdates.interest_level } : {}),
        ...(dbUpdates.site_visit_status  != null ? { siteVisitStatus: dbUpdates.site_visit_status } : {}),
      };
    }));
    burstCache(leadsKey);

    const { error } = await supabaseAdmin
      .from('leads')
      .update(dbUpdates)
      .eq('id', leadId);

    if (error) {
      console.error('[useMyLeads] updateLead error:', error.message);
      fetchLeads(true);
      throw error;
    }
  }, [leadsKey, fetchLeads]);

  // ─── addCallLog ────────────────────────────────────────────────────────────
  const addCallLog = useCallback(async (callData) => {
    const row = {
      employee_id:     callData.employeeId   || callData.employee_id   || userId,
      employee_name:   callData.employeeName || callData.employee_name || null,
      lead_id:         callData.leadId       || callData.lead_id       || null,
      lead_name:       callData.leadName     || callData.lead_name     || null,
      project_name:    callData.projectName  || callData.project_name  || '',
      call_type:       callData.type         || callData.call_type     || 'Outgoing',
      status:          callData.status       || '',
      duration:        parseInt(callData.duration) || 0,
      notes:           callData.notes        || '',
      major_objection: callData.majorObjection || callData.major_objection || null,
    };

    const { data, error } = await supabaseAdmin
      .from('calls')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('[useMyLeads] addCallLog error:', error.message);
      throw error;
    }

    const normalized = normalizeCall(data);
    setCalls(prev => [normalized, ...prev]);
    burstCache(callsKey);

    return data;
  }, [userId, callsKey]);

  // ─── Public API ────────────────────────────────────────────────────────────
  return {
    leads,
    leadsLoading,
    calls,
    updateLead,
    addCallLog,
    fetchLeads:  () => fetchLeads(false),
    fetchCalls:  () => fetchCalls(false),
    refetch:     () => fetchLeads(false),
  };
};
