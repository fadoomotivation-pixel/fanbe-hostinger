// src/crm/hooks/useMyLeads.js
// ✅ PERF FIX v2 (Senior Tester Analysis — Apr 2026):
// ROOT CAUSES of 18s load found in Network tab screenshot:
//   1. select('*') was fetching 50+ columns × 793 rows = ~1.4MB payload
//   2. getCalls() called WITHOUT userId → downloaded entire calls table (all employees)
//   3. Realtime calls channel had NO filter → woke up on every employee's call log
// FIXES:
//   1. select() now lists only the 18 columns MyLeads actually renders
//   2. fetchCalls(userId) passed → Supabase server-side filters employee_id
//   3. Realtime calls channel: filter=`employee_id=eq.${userId}`
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { addCall, getCalls } from '@/lib/crmSupabase';

// ── Only the columns MyLeads actually renders ──────────────────────────
const LEAD_COLUMNS = [
  'id',
  'full_name',
  'phone',
  'source',
  'final_status',
  'status',
  'interest_level',
  'notes',
  'assigned_to',
  'assigned_to_name',
  'created_at',
  'updated_at',
  'project',
  'next_followup_date',
  'assigned_at',
  'prev_assigned_to',
  'prev_assigned_to_name',
  'prev_assigned_at',
].join(',');

const normalize = (row) => ({
  id:                 row.id,
  name:               row.full_name          || '',
  phone:              row.phone              || '',
  source:             row.source             || 'Manual Import',
  status:             row.final_status       || row.status || 'FollowUp',
  interestLevel:      row.interest_level     || 'Cold',
  notes:              row.notes              || '',
  finalStatus:        row.final_status       || 'FollowUp',
  assignedTo:         row.assigned_to        || null,
  assignedToName:     row.assigned_to_name   || null,
  createdAt:          row.created_at,
  updatedAt:          row.updated_at,
  lastActivity:       row.updated_at,
  project:            row.project            || '',
  followUpDate:       row.next_followup_date || null,
  follow_up_date:     row.next_followup_date || null,
  assignedAt:         row.assigned_at        || null,
  assigned_to:        row.assigned_to        || null,
  prevAssignedTo:     row.prev_assigned_to       || null,
  prevAssignedToName: row.prev_assigned_to_name  || null,
  prevAssignedAt:     row.prev_assigned_at       || null,
});

export const useMyLeads = (userId) => {
  const [leads, setLeads]               = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [calls, setCalls]               = useState([]);
  const reqId = useRef(0);
  const tabWasHidden = useRef(false);

  // ── FIX 1: select only needed columns (was select('*') = 50+ cols) ────
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
          .select(LEAD_COLUMNS)          // ← was select('*') — now only 18 columns
          .eq('assigned_to', userId)
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
      console.log(`[MyLeads] req#${thisReq} — ${allData.length} leads loaded`);
    } catch (err) {
      console.error('[MyLeads] Unexpected error:', err);
      if (thisReq === reqId.current) setLeads([]);
    } finally {
      if (thisReq === reqId.current) setLeadsLoading(false);
    }
  }, [userId]);

  // ── FIX 2: pass userId so server filters (was: no arg → full table dump) ─
  const fetchCalls = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getCalls(userId);           // ← was getCalls() — no filter!
      const myCalls = (data || []).map(row => ({
        id:             row.id,
        employeeId:     row.employee_id,
        leadId:         row.lead_id,
        leadName:       row.lead_name,
        projectName:    row.project_name,
        type:           row.call_type,
        status:         row.status,
        duration:       row.duration,
        notes:          row.notes,
        employee_name:  row.employee_name,
        created_at:     row.created_at,
        timestamp:      row.created_at,
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
      if (updates.source          !== undefined) mapped.source             = updates.source;
      if (updates.status          !== undefined) mapped.final_status       = updates.status;
      if (updates.interestLevel   !== undefined) mapped.interest_level     = updates.interestLevel;
      if (updates.notes           !== undefined) mapped.notes              = updates.notes;
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

      const hasFollowUpUpdate = updates.follow_up_date !== undefined || updates.followUpDate !== undefined;
      const newFollowUp = hasFollowUpUpdate
        ? (updates.follow_up_date ?? updates.followUpDate ?? null)
        : undefined;
      setLeads(prev => prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates, lastActivity: new Date().toISOString() };
        if (hasFollowUpUpdate) {
          updated.follow_up_date     = newFollowUp;
          updated.followUpDate       = newFollowUp;
          updated.next_followup_date = newFollowUp;
        }
        return updated;
      }));
    } catch (err) { console.error('[MyLeads] updateLead unexpected error:', err); }
  }, []);

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

  // ── FIX 3: Realtime calls channel now filtered by employee_id ─────────
  useEffect(() => {
    if (!userId) return;

    const leadsChannel = supabaseAdmin
      .channel(`realtime:leads:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'leads',
        filter: `assigned_to=eq.${userId}`,
      }, () => fetchLeads())
      .subscribe();

    // ← FIX: was filter-less (fired on ALL employees' call logs)
    const callsChannel = supabaseAdmin
      .channel(`realtime:calls:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'calls',
        filter: `employee_id=eq.${userId}`,
      }, () => fetchCalls())
      .subscribe();

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

  return { leads, leadsLoading, fetchLeads, fetchCalls, updateLead, addCallLog, calls };
};
