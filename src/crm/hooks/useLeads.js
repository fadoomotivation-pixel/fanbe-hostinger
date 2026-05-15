import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 50;

// Columns covered by idx_leads_mypage_covering — querying these keeps the
// fetch on an index-only scan and avoids pulling 53 columns × thousands of rows.
const LIST_COLUMNS = [
  'id',
  'name',
  'phone',
  'status',
  'final_status',
  'interest_level',
  'follow_up_date',
  'follow_up_priority',
  'project_name',
  'is_vip',
  'is_archived',
  'is_active',
  'created_at',
  'updated_at',
  'assigned_to',
  'assigned_to_name',
  'source',
  'last_note',
].join(',');

/**
 * useLeads
 * ────────
 * Paginated leads query against public.leads. Defaults to "my leads"
 * (assigned_to = current user) but admins/managers can override via
 * the `scope` option.
 *
 * Why this is fast on production data (4753 rows):
 *  - Only fetches 18 columns (uses idx_leads_mypage_covering)
 *  - LIMIT 50 + keyset pagination on updated_at, NOT OFFSET
 *  - Filters server-side, not in JS
 *
 * Usage:
 *   const { leads, loading, loadingMore, hasMore, loadMore, refetch,
 *           total, search, setSearch, status, setStatus } = useLeads();
 */
export function useLeads({ scope = 'mine' } = {}) {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Anchor cursor for keyset pagination
  const cursorRef = useRef(null); // { updated_at, id }
  const reqIdRef = useRef(0);

  const canSeeAll = ['super_admin', 'sales_manager', 'sub_admin', 'manager'].includes(user?.role);
  const effectiveScope = scope === 'all' && canSeeAll ? 'all' : 'mine';

  const buildBase = useCallback(() => {
    let q = supabase.from('leads').select(LIST_COLUMNS, { count: 'exact' });

    if (effectiveScope === 'mine' && user?.id) {
      q = q.eq('assigned_to', user.id);
    }
    q = q.eq('is_archived', false);

    if (status && status !== 'all') {
      q = q.eq('status', status);
    }
    if (search?.trim()) {
      const s = search.trim();
      q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
    }
    return q.order('updated_at', { ascending: false }).order('id', { ascending: false });
  }, [effectiveScope, user?.id, status, search]);

  const fetchInitial = useCallback(async () => {
    if (!user) return;
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    cursorRef.current = null;

    const { data, count, error } = await buildBase().limit(PAGE_SIZE);
    if (myReq !== reqIdRef.current) return;

    if (error) {
      setError(error);
      setLeads([]);
      setTotal(0);
      setHasMore(false);
    } else {
      setLeads(data || []);
      setTotal(count ?? null);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      const last = data?.[data.length - 1];
      cursorRef.current = last ? { updated_at: last.updated_at, id: last.id } : null;
    }
    setLoading(false);
  }, [buildBase, user]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursorRef.current) return;
    setLoadingMore(true);
    const cursor = cursorRef.current;
    const myReq = reqIdRef.current;

    // Keyset: rows whose (updated_at, id) sort AFTER the cursor in DESC order
    let q = buildBase();
    q = q.or(
      `updated_at.lt.${cursor.updated_at},and(updated_at.eq.${cursor.updated_at},id.lt.${cursor.id})`,
    );
    const { data, error } = await q.limit(PAGE_SIZE);

    if (myReq !== reqIdRef.current) {
      setLoadingMore(false);
      return;
    }
    if (error) {
      setError(error);
    } else if (data?.length) {
      setLeads(prev => [...prev, ...data]);
      const last = data[data.length - 1];
      cursorRef.current = { updated_at: last.updated_at, id: last.id };
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [buildBase, hasMore, loadingMore]);

  // Refetch on filter / user change
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Lightweight mutation helpers — they update locally + persist to Supabase.
  // The caller can `await` them; rejections bubble back as Error objects.
  const updateLead = useCallback(async (id, patch) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));
    const { data, error } = await supabase
      .from('leads')
      .update(patch)
      .eq('id', id)
      .select(LIST_COLUMNS)
      .single();
    if (error) {
      // Roll back optimistic update on failure
      fetchInitial();
      throw error;
    }
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)));
    return data;
  }, [fetchInitial]);

  const addLead = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select(LIST_COLUMNS)
      .single();
    if (error) throw error;
    setLeads(prev => [data, ...prev]);
    setTotal(t => (t ?? 0) + 1);
    return data;
  }, []);

  return useMemo(
    () => ({
      leads,
      total,
      loading,
      loadingMore,
      hasMore,
      error,
      search,
      setSearch,
      status,
      setStatus,
      scope: effectiveScope,
      canSeeAll,
      loadMore,
      refetch: fetchInitial,
      updateLead,
      addLead,
    }),
    [leads, total, loading, loadingMore, hasMore, error, search, status, effectiveScope, canSeeAll, loadMore, fetchInitial, updateLead, addLead],
  );
}
