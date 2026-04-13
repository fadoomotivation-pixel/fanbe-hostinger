// src/crm/hooks/useMyLeads.js
// ⚡ PERFORMANCE HOOK — fetches ONLY the current user's leads from Supabase.
// Instead of pulling 2000+ leads into the browser and filtering client-side,
// this hook sends a WHERE assigned_to = $userId query so Supabase returns
// only the rows this user actually needs (typically 50–300 leads).
//
// Speed gains:
//   • Network: 10–40x less data transferred (e.g. 50 leads vs 2084)
//   • Parse: no client-side .filter() over 2000 objects on every render
//   • Memory: keeps React state small → faster diffing & re-renders
//
// Cache strategy:
//   • sessionStorage key: `my_leads_${userId}` with a 3-minute TTL
//   • On cache hit: leads render INSTANTLY (0 ms) while a background revalidation
//     runs silently — user sees data immediately, then gets fresh data
//   • On cache miss: normal Supabase fetch, result cached for next load
//
// Realtime:
//   • Subscribes only to leads WHERE assigned_to = userId
//   • Uses a targeted channel filter so other users' changes don't trigger refetch

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const getCacheKey = (userId) => `my_leads_${userId}`;

const readCache = (userId) => {
  try {
    const raw = sessionStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
};

const writeCache = (userId, data) => {
  try {
    sessionStorage.setItem(getCacheKey(userId), JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — silent fail */ }
};

const normalizeRow = (row) => ({
  id:                  row.id,
  name:                row.full_name          || '',
  phone:               row.phone              || '',
  email:               row.email              || '',
  source:              row.source             || 'Manual Import',
  status:              row.final_status       || row.status || 'FollowUp',
  budget:              row.budget             || '',
  interestLevel:       row.interest_level     || 'Cold',
  notes:               row.notes              || '',
  callAttempt:         row.call_attempt       || '',
  callStatus:          row.call_status        || '',
  siteVisitStatus:     row.site_visit_status  || '',
  finalStatus:         row.final_status       || 'FollowUp',
  assignedTo:          row.assigned_to        || null,
  assignedToName:      row.assigned_to_name   || null,
  createdBy:           row.created_by         || null,
  createdAt:           row.created_at,
  lastActivity:        row.updated_at,
  activityLog:         [],
  project:             row.project            || '',
  followUpDate:        row.next_followup_date || null,
  follow_up_date:      row.next_followup_date || null,
  follow_up_time:      row.follow_up_time     || null,
  follow_up_notes:     row.follow_up_notes    || null,
  follow_up_status:    row.follow_up_status   || null,
  tokenAmount:         row.token_amount       || 0,
  bookingAmount:       row.booking_amount     || 0,
  partialPayment:      row.partial_payment    || 0,
  paymentMode:         row.payment_mode       || 'Cash',
  unitNumber:          row.unit_number        || '',
  isVIP:               row.is_vip             || false,
  assignedAt:          row.assigned_at            || null,
  prevAssignedTo:      row.prev_assigned_to       || null,
  prevAssignedToName:  row.prev_assigned_to_name  || null,
  prevAssignedAt:      row.prev_assigned_at       || null,
});

export const useMyLeads = (userId) => {
  const [leads, setLeads]       = useState(() => (userId ? readCache(userId) || [] : []));
  const [loading, setLoading]   = useState(() => !(userId && readCache(userId)));
  const reqId = useRef(0);
  const tabWasHidden = useRef(false);

  const fetchMyLeads = useCallback(async (background = false) => {
    if (!userId) return;
    const thisReq = ++reqId.current;
    if (!background) setLoading(true);

    try {
      // ⚡ KEY FIX: .eq('assigned_to', userId) — Supabase applies WHERE on the DB
      // before sending data. Only this user's leads cross the wire.
      const { data, error } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useMyLeads] fetch error:', error.message);
        if (thisReq === reqId.current && !background) setLoading(false);
        return;
      }
      if (thisReq !== reqId.current) return;

      const normalized = (data || []).map(normalizeRow);
      setLeads(normalized);
      writeCache(userId, normalized);
      console.log(`[useMyLeads] req#${thisReq} — ${normalized.length} leads for user`);
    } catch (err) {
      console.error('[useMyLeads] unexpected error:', err);
    } finally {
      if (thisReq === reqId.current) setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    const cached = readCache(userId);
    if (cached) {
      // Instant render from cache, silently revalidate in background
      setLeads(cached);
      setLoading(false);
      fetchMyLeads(true);
    } else {
      fetchMyLeads(false);
    }
  }, [userId, fetchMyLeads]);

  // Targeted Realtime — only fires when this user's rows change
  useEffect(() => {
    if (!userId) return;
    const channel = supabaseAdmin
      .channel(`my_leads_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `assigned_to=eq.${userId}` },
        () => fetchMyLeads(true)
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tabWasHidden.current = true;
      } else if (document.visibilityState === 'visible' && tabWasHidden.current) {
        tabWasHidden.current = false;
        fetchMyLeads(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabaseAdmin.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId, fetchMyLeads]);

  return { leads, loading, refetch: fetchMyLeads };
};
