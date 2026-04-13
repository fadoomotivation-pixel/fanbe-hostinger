// src/crm/hooks/useMyLeads.js
// ✅ PERF v3: Deferred background fetch + instant first render
// Strategy:
//   - Fetch first 100 leads immediately → show UI fast
//   - Background: fetch remaining pages silently (no loading spinner)
//   - Calls fetched 400ms AFTER leads render (non-blocking)
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { addCall, getCalls } from '@/lib/crmSupabase';

const LEAD_COLUMNS = [
  'id', 'full_name', 'phone', 'source', 'final_status', 'status',
  'interest_level', 'notes', 'assigned_to', 'assigned_to_name',
  'created_at', 'updated_at', 'project', 'next_followup_date',
  'assigned_at', 'prev_assigned_to', 'prev_assigned_to_name', 'prev_assigned_at',
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
  const reqId       = useRef(0);
  const tabWasHidden = useRef(false);

  const fetchLeads = useCallback(async () => {
    if (!userId) return;
    const thisReq = ++reqId.current;
    const FIRST_PAGE = 100;   // show UI fast with first 100
    const REST_SIZE  = 500;   // background pages
    try {
      setLeadsLoading(true);

      // ── Page 1: show immediately ──
      const { data: firstPage, error: e1 } = await supabaseAdmin
        .from('leads')
        .select(LEAD_COLUMNS)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false })
        .range(0, FIRST_PAGE - 1);

      if (e1) { console.error('[MyLeads] Fetch error:', e1.message); if (thisReq === reqId.current) setLeads([]); return; }
      if (thisReq !== reqId.current) return;

      setLeads((firstPage || []).map(normalize));
      setLeadsLoading(false);   // ← UI visible NOW after first page

      // ── Background: remaining pages ──
      if (!firstPage || firstPage.length < FIRST_PAGE) return; // no more rows

      let allData = [...firstPage];
      let from = FIRST_PAGE;
      let keepGoing = true;
      while (keepGoing) {
        if (thisReq !== reqId.current) return;
        const { data, error } = await supabaseAdmin
          .from('leads')
          .select(LEAD_COLUMNS)
          .eq('assigned_to', userId)
          .order('created_at', { ascending: false })
          .range(from, from + REST_SIZE - 1);
        if (error) { console.error('[MyLeads] bg fetch error:', error.message); break; }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (thisReq === reqId.current) setLeads(allData.map(normalize));
        if (data.length < REST_SIZE) keepGoing = false;
        else from += REST_SIZE;
      }
      console.log(`[MyLeads] req#${thisReq} — ${allData.length} leads total`);
    } catch (err) {
      console.error('[MyLeads] Unexpected error:', err);
      if (thisReq === reqId.current) { setLeads([]); setLeadsLoading(false); }
    }
  }, [userId]);

  const fetchCalls = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getCalls(userId);
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
      if (result.success) { await fetchCalls(); return result.data; }
      return null;
    } catch (err) { console.error('[MyLeads] addCallLog error:', err); return null; }
  }, [fetchCalls]);

  useEffect(() => {
    if (!userId) return;
    fetchLeads();
    // ─ calls deferred 400ms so leads render first ─
    const t = setTimeout(() => fetchCalls(), 400);
    return () => clearTimeout(t);
  }, [userId, fetchLeads, fetchCalls]);

  useEffect(() => {
    if (!userId) return;
    const leadsChannel = supabaseAdmin
      .channel(`realtime:leads:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `assigned_to=eq.${userId}` }, () => fetchLeads())
      .subscribe();
    const callsChannel = supabaseAdmin
      .channel(`realtime:calls:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `employee_id=eq.${userId}` }, () => fetchCalls())
      .subscribe();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') { tabWasHidden.current = true; }
      else if (document.visibilityState === 'visible' && tabWasHidden.current) { tabWasHidden.current = false; fetchLeads(); }
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
