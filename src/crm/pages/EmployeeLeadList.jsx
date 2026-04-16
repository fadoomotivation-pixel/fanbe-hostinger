import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabase';
import {
  Search, Plus, Phone, Calendar, IndianRupee,
  TrendingUp, Users, CheckCircle2, Clock, X,
  ChevronRight, Flame, FileText, ChevronDown, Loader2
} from 'lucide-react';

/* ─── Status config ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  Open:         { dot: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  text: '#1d4ed8', label: 'Open'      },
  FollowUp:     { dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#b45309', label: 'Follow Up' },
  'Follow Up':  { dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#b45309', label: 'Follow Up' },
  Booked:       { dot: '#10b981', bg: 'rgba(16,185,129,0.12)', text: '#065f46', label: 'Booked'    },
  Lost:         { dot: '#ef4444', bg: 'rgba(239,68,68,0.12)',  text: '#991b1b', label: 'Lost'      },
};
const getStatus = s => STATUS_CFG[s] || STATUS_CFG.Open;

/* ─── Helpers ───────────────────────────────────────────────────────── */
const fmtDate = d => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const fmtTime = d => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const fmtBudget = v => {
  if (!v) return null;
  const n = parseInt(v.toString().replace(/,/g, ''), 10);
  if (isNaN(n)) return v;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `${(n / 1000).toFixed(0)}K`;
  return n.toLocaleString('en-IN');
};

const isUrgent = lead => {
  if (!lead.followUpDate) return false;
  const diff = new Date(lead.followUpDate) - Date.now();
  return diff >= 0 && diff < 86400000;
};

const normalise = row => ({
  id:           row.id,
  name:         row.name,
  phone:        row.phone,
  project:      row.project,
  status:       row.status,
  budget:       row.budget,
  assignedTo:   row.assigned_to,
  followUpDate: row.follow_up_date,
  updatedAt:    row.updated_at,
  createdAt:    row.created_at,
  lastNote:     row.last_note,
});

/* ─── QuickLog Bottom Sheet ─────────────────────────────────────────── */
const QUICK_STATUSES = [
  { key: 'Open',       label: 'Open',       color: '#2563eb', bg: 'rgba(59,130,246,0.1)'  },
  { key: 'FollowUp',   label: 'Follow Up',  color: '#b45309', bg: 'rgba(245,158,11,0.1)'  },
  { key: 'Booked',     label: 'Booked',     color: '#065f46', bg: 'rgba(16,185,129,0.1)'  },
  { key: 'Lost',       label: 'Lost',       color: '#991b1b', bg: 'rgba(239,68,68,0.1)'   },
];

const QuickLogSheet = ({ lead, onClose, onSaved }) => {
  const [status,  setStatus]  = useState(lead?.status === 'Follow Up' ? 'FollowUp' : (lead?.status || 'Open'));
  const [note,    setNote]    = useState('');
  const [followUp,setFollowUp]= useState('');
  const [saving,  setSaving]  = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const dbStatus = status === 'FollowUp' ? 'Follow Up' : status;
      const updates = { status: dbStatus, updated_at: new Date().toISOString() };
      if (note.trim()) updates.last_note      = note.trim();
      if (followUp)    updates.follow_up_date = followUp;

      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', lead.id);

      if (!error) {
        onSaved?.({ id: lead.id, ...updates });
        setSavedOk(true);
        setTimeout(() => { setSavedOk(false); onClose(); }, 900);
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 16px)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
        </div>

        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Quick Log</p>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{lead?.name}</h3>
              {lead?.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                >
                  <Phone size={13} /> {lead.phone}
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: '#f1f5f9', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} color="#64748b" />
            </button>
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Update Status</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
            {QUICK_STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                style={{
                  padding: '12px 8px', borderRadius: 12, border: `2px solid ${status === s.key ? s.color : 'transparent'}`,
                  background: status === s.key ? s.bg : '#f8fafc',
                  color: status === s.key ? s.color : '#64748b',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: 48,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Call Note</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What did you discuss?"
            rows={3}
            style={{
              width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0',
              padding: '12px', fontSize: 15, color: '#0f172a',
              resize: 'none', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit', lineHeight: 1.5,
              background: '#f8fafc',
            }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />

          {status === 'FollowUp' && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Follow-Up Date</p>
              <input
                type="date"
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0',
                  padding: '12px', fontSize: 15, color: '#0f172a',
                  outline: 'none', boxSizing: 'border-box', background: '#f8fafc',
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || savedOk}
            style={{
              width: '100%', marginTop: 18,
              padding: '16px', borderRadius: 14, border: 'none',
              background: savedOk
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
              color: '#fff', fontSize: 16, fontWeight: 800,
              cursor: saving || savedOk ? 'default' : 'pointer',
              boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
              opacity: saving ? 0.75 : 1,
              minHeight: 52,
            }}
          >
            {savedOk ? '✓ Saved!' : saving ? 'Saving…' : 'Save Log'}
          </button>
        </div>
      </div>
    </>
  );
};

/* ─── Skeleton ──────────────────────────────────────────────────────── */
const LeadSkeleton = () => (
  <div style={S.card}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ ...S.skel, width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...S.skel, width: '60%', height: 14 }} />
        <div style={{ ...S.skel, width: '40%', height: 11 }} />
        <div style={{ ...S.skel, width: '80%', height: 11 }} />
      </div>
      <div style={{ ...S.skel, width: 64, height: 22, borderRadius: 99 }} />
    </div>
  </div>
);

/* ─── Lead Card ─────────────────────────────────────────────────────── */
const LeadCard = React.memo(({ lead, onClick, onCallLog }) => {
  const st      = getStatus(lead.status);
  const urgent  = isUrgent(lead);
  const initials = (lead.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleCall = e => {
    e.stopPropagation();
    if (lead.phone) window.location.href = `tel:${lead.phone}`;
    setTimeout(() => onCallLog(lead), 400);
  };

  const handleQuickLog = e => {
    e.stopPropagation();
    onCallLog(lead);
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...S.card,
        borderLeft: urgent ? '3px solid #f59e0b' : '3px solid transparent',
        WebkitTapHighlightColor: 'transparent',
      }}
      className="lead-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {lead.name}
            </span>
            {urgent && <Flame size={13} color="#f59e0b" />}
          </div>
          {lead.project && (
            <p style={{
              fontSize: 12, color: '#64748b', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {lead.project}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            background: st.bg, color: st.text,
          }}>
            {st.label}
          </span>
          <ChevronRight size={15} color="#94a3b8" />
        </div>
      </div>

      {(lead.phone || lead.budget || lead.followUpDate) && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
          {lead.budget && (
            <div style={S.infoChip}>
              <IndianRupee size={12} color="#10b981" />
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>₹{fmtBudget(lead.budget)}</span>
            </div>
          )}
          {lead.followUpDate && (
            <div style={{
              ...S.infoChip,
              background: urgent ? 'rgba(245,158,11,0.1)' : 'rgba(239,246,255,1)',
              borderRadius: 6, padding: '3px 8px',
            }}>
              <Calendar size={12} color={urgent ? '#f59e0b' : '#3b82f6'} />
              <span style={{ fontSize: 11, color: urgent ? '#b45309' : '#1d4ed8', fontWeight: 600 }}>
                {fmtDate(lead.followUpDate)}
              </span>
            </div>
          )}
        </div>
      )}

      {lead.lastNote && (
        <p style={{
          fontSize: 11, color: '#64748b', marginTop: 8, fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          📝 {lead.lastNote}
        </p>
      )}

      <div
        style={{
          display: 'flex', gap: 8, marginTop: 12,
          borderTop: '1px solid #f1f5f9', paddingTop: 10,
        }}
        onClick={e => e.stopPropagation()}
      >
        <a
          href={lead.phone ? `tel:${lead.phone}` : undefined}
          onClick={handleCall}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            minHeight: 44, borderRadius: 10, border: 'none',
            background: lead.phone ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
            color: lead.phone ? '#065f46' : '#94a3b8',
            fontSize: 13, fontWeight: 700, cursor: lead.phone ? 'pointer' : 'default',
            textDecoration: 'none', boxSizing: 'border-box',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s',
          }}
        >
          <Phone size={15} color={lead.phone ? '#10b981' : '#94a3b8'} />
          {lead.phone ? lead.phone : 'No number'}
        </a>

        <button
          onClick={handleQuickLog}
          style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '0 16px', minHeight: 44, borderRadius: 10, border: 'none',
            background: 'rgba(37,99,235,0.1)', color: '#1d4ed8',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          <FileText size={14} />
          Log
        </button>
      </div>

      {(lead.updatedAt || lead.createdAt) && (
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
          Updated {fmtTime(lead.updatedAt || lead.createdAt)}
        </p>
      )}
    </div>
  );
});

/* ─── Filter pill ───────────────────────────────────────────────────── */
const FilterPill = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
      background: active ? '#1e3a5f' : '#f1f5f9',
      color: active ? '#fff' : '#64748b',
      boxShadow: active ? '0 2px 8px rgba(30,58,95,0.2)' : 'none',
      WebkitTapHighlightColor: 'transparent',
      whiteSpace: 'nowrap',
      minHeight: 38,
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{
        background: active ? 'rgba(255,255,255,0.25)' : 'rgba(30,58,95,0.1)',
        color: active ? '#fff' : '#1e3a5f',
        borderRadius: 99, padding: '1px 7px', fontSize: 11, fontWeight: 700,
      }}>
        {count}
      </span>
    )}
  </button>
);

/* ─── Stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div style={{
    flex: '1 1 0', minWidth: 0,
    background: '#fff', borderRadius: 14,
    padding: '12px 14px', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 9,
      background: `${accent}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    }}>
      <Icon size={16} color={accent} />
    </div>
    <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 500 }}>{label}</p>
  </div>
);

/* ─── Inline styles ─────────────────────────────────────────────────── */
const S = {
  card: {
    background: '#fff', borderRadius: 16, padding: '14px 16px',
    border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.12s',
    WebkitTapHighlightColor: 'transparent', userSelect: 'none',
  },
  skel: {
    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', borderRadius: 6,
  },
  infoChip: { display: 'flex', alignItems: 'center', gap: 5 },
};

/* ─── Constants ─────────────────────────────────────────────────────── */
const FILTERS    = ['All', 'Open', 'FollowUp', 'Booked', 'Lost'];
const FILTER_LABELS = { All: 'All', Open: 'Open', FollowUp: 'Follow Up', Booked: 'Booked', Lost: 'Lost' };
const PAGE_SIZE  = 20;
const STATS_TTL  = 60 * 1000; // ⚡ FIX: 1-min cache — back-nav skips refetch

/* ─── DB status helpers ─────────────────────────────────────────────── */
const filterToDbStatus = f => {
  if (f === 'FollowUp') return ['Follow Up', 'FollowUp'];
  if (f === 'All') return null;
  return [f];
};

/* ─── Page ──────────────────────────────────────────────────────────── */
const EmployeeLeadList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [myLeads,       setMyLeads]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(true);
  const [page,          setPage]          = useState(0);

  // ⚡ FIX: single stats object (fed by RPC), plus in-memory cache ref
  const [stats,         setStats]         = useState({ total: 0, open: 0, followUp: 0, booked: 0, today: 0, tomorrow: 0 });
  const statsCacheRef   = useRef({ data: null, ts: 0 }); // ⚡ back-nav cache

  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('All');
  const [quickLogLead,  setQuickLogLead]  = useState(null);

  const searchRef   = useRef(null);
  const listEnd     = useRef(null);
  const debounceRef = useRef(null);
  const userId      = user?.uid || user?.id;

  /* ── Build query ── */
  const buildQuery = useCallback((fromIndex = 0, currentFilter = filter, currentSearch = search) => {
    let q = supabase
      .from('leads')
      .select('id,name,phone,project,status,budget,assigned_to,follow_up_date,updated_at,created_at,last_note')
      .eq('assigned_to', userId)
      .order('updated_at', { ascending: false })
      .range(fromIndex, fromIndex + PAGE_SIZE - 1);

    const dbStatuses = filterToDbStatus(currentFilter);
    if (dbStatuses) q = q.in('status', dbStatuses);
    if (currentSearch.trim()) {
      const t = currentSearch.trim();
      q = q.or(`name.ilike.%${t}%,phone.ilike.%${t}%,project.ilike.%${t}%`);
    }
    return q;
  }, [userId, filter, search]);

  /* ──────────────────────────────────────────────────────────────────────────
   * ⚡ FIX: fetchStats — single RPC call replaces 6 serial COUNT queries
   *         + 1-min in-memory cache so back-nav is instant
   * ──────────────────────────────────────────────────────────────────────── */
  const fetchStats = useCallback(async (force = false) => {
    if (!userId) return;

    // Return cached stats if still fresh and not forced
    if (!force && statsCacheRef.current.data && Date.now() - statsCacheRef.current.ts < STATS_TTL) {
      setStats(statsCacheRef.current.data);
      return;
    }

    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_lead_stats', { p_user_id: userId });

      if (error) throw error;

      const s = {
        total:    data.total    ?? 0,
        open:     data.open     ?? 0,
        followUp: data.followUp ?? 0,
        booked:   data.booked   ?? 0,
        today:    data.today    ?? 0,
        tomorrow: data.tomorrow ?? 0,
      };
      statsCacheRef.current = { data: s, ts: Date.now() };
      setStats(s);
    } catch (err) {
      console.error('[fetchStats] RPC error:', err.message);
    }
  }, [userId]);

  /* ── First page ── */
  const fetchFirstPage = useCallback(async (currentFilter, currentSearch) => {
    if (!userId) return;
    setLoading(true);
    setMyLeads([]);
    setPage(0);
    setHasMore(true);
    try {
      let q = supabase
        .from('leads')
        .select('id,name,phone,project,status,budget,assigned_to,follow_up_date,updated_at,created_at,last_note')
        .eq('assigned_to', userId)
        .order('updated_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      const dbStatuses = filterToDbStatus(currentFilter);
      if (dbStatuses) q = q.in('status', dbStatuses);
      if (currentSearch.trim()) {
        const t = currentSearch.trim();
        q = q.or(`name.ilike.%${t}%,phone.ilike.%${t}%,project.ilike.%${t}%`);
      }

      const { data, error } = await q;
      if (!error) {
        const rows = (data || []).map(normalise);
        setMyLeads(rows);
        setHasMore(rows.length === PAGE_SIZE);
        setPage(1);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /* ── Next page ── */
  const fetchNextPage = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const fromIndex = page * PAGE_SIZE;
      let q = supabase
        .from('leads')
        .select('id,name,phone,project,status,budget,assigned_to,follow_up_date,updated_at,created_at,last_note')
        .eq('assigned_to', userId)
        .order('updated_at', { ascending: false })
        .range(fromIndex, fromIndex + PAGE_SIZE - 1);

      const dbStatuses = filterToDbStatus(filter);
      if (dbStatuses) q = q.in('status', dbStatuses);
      if (search.trim()) {
        const t = search.trim();
        q = q.or(`name.ilike.%${t}%,phone.ilike.%${t}%,project.ilike.%${t}%`);
      }

      const { data, error } = await q;
      if (!error && data?.length) {
        setMyLeads(prev => [...prev, ...data.map(normalise)]);
        setHasMore(data.length === PAGE_SIZE);
        setPage(p => p + 1);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [userId, page, filter, search, loadingMore, hasMore]);

  /* ── Mount ── */
  useEffect(() => {
    fetchFirstPage('All', '');
    fetchStats();
  }, [userId]); // eslint-disable-line

  /* ── Filter change ── */
  useEffect(() => {
    if (!userId) return;
    fetchFirstPage(filter, search);
  }, [filter]); // eslint-disable-line

  /* ── Search debounce ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchFirstPage(filter, search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line

  /* ── Realtime ── */
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my-leads-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `assigned_to=eq.${userId}` },
        payload => {
          setMyLeads(prev => {
            if (payload.eventType === 'DELETE') return prev.filter(l => l.id !== payload.old.id);
            const updated = normalise(payload.new);
            const idx = prev.findIndex(l => l.id === updated.id);
            if (idx === -1) return [updated, ...prev];
            const next = [...prev]; next[idx] = updated; return next;
          });
          fetchStats(true); // force-refresh stats on realtime change
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, fetchStats]);

  /* ── QuickLog optimistic update ── */
  const handleQuickLogSaved = useCallback(updates => {
    setMyLeads(prev => prev.map(l => {
      if (l.id !== updates.id) return l;
      return {
        ...l,
        status:       updates.status === 'Follow Up' ? 'FollowUp' : updates.status,
        lastNote:     updates.last_note     ?? l.lastNote,
        followUpDate: updates.follow_up_date ?? l.followUpDate,
        updatedAt:    updates.updated_at,
      };
    }));
    fetchStats(true);
  }, [fetchStats]);

  /* ── Infinite scroll ── */
  useEffect(() => {
    if (!listEnd.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchNextPage();
    }, { threshold: 0.1 });
    obs.observe(listEnd.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, fetchNextPage]);

  const handleCardClick = useCallback(id => navigate(`/crm/lead/${id}`), [navigate]);

  // convenience aliases from unified stats
  const todayCount    = stats.today;
  const tomorrowCount = stats.tomorrow;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
    }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin    { from { transform: rotate(0deg) }     to { transform: rotate(360deg) } }
        .lead-card:active  { transform: scale(0.985); box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important; }
        .lead-card:hover   { box-shadow: 0 4px 16px rgba(30,58,95,0.12) !important; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        .load-more-spinner { animation: spin 0.8s linear infinite; }
        @media (max-width: 480px) { .stat-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(248,250,252,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px 0',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5, lineHeight: 1.2 }}>My Leads</h1>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{stats.total} assigned</p>
            </div>
            <button
              onClick={() => navigate('/crm/lead/new')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 16px', borderRadius: 99, border: 'none',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
                WebkitTapHighlightColor: 'transparent', minHeight: 44,
              }}
            >
              <Plus size={15} /> Add
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, project…"
              style={{
                width: '100%', height: 44, paddingLeft: 38, paddingRight: search ? 36 : 12,
                borderRadius: 12, border: '1.5px solid #e2e8f0',
                background: '#fff', fontSize: 16, color: '#0f172a',
                outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={15} color="#94a3b8" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <FilterPill
                key={f}
                label={FILTER_LABELS[f]}
                active={filter === f}
                onClick={() => setFilter(f)}
                count={
                  f === 'All'      ? stats.total    :
                  f === 'Open'     ? stats.open     :
                  f === 'FollowUp' ? stats.followUp :
                  f === 'Booked'   ? stats.booked   :
                  undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 16px 0' }}>

        {!loading && todayCount > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Flame size={16} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
              {todayCount} follow-up{todayCount !== 1 ? 's' : ''} due today
            </span>
          </div>
        )}
        {!loading && tomorrowCount > 0 && (
          <div style={{
            background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Calendar size={16} color="#3b82f6" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>
              {tomorrowCount} follow-up{tomorrowCount !== 1 ? 's' : ''} due tomorrow
            </span>
          </div>
        )}

        <div
          className="stat-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}
        >
          <StatCard label="Total"     value={stats.total}    icon={Users}        accent="#2563eb" />
          <StatCard label="Open"      value={stats.open}     icon={TrendingUp}   accent="#3b82f6" />
          <StatCard label="Follow Up" value={stats.followUp} icon={Clock}        accent="#f59e0b" />
          <StatCard label="Booked"    value={stats.booked}   icon={CheckCircle2} accent="#10b981" />
        </div>

        {(search || filter !== 'All') && !loading && (
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: 500 }}>
            {myLeads.length}{hasMore ? '+' : ''} result{myLeads.length !== 1 ? 's' : ''}
            {search ? ` for "${search}"` : ''}
            {filter !== 'All' ? ` · ${FILTER_LABELS[filter]}` : ''}
          </p>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(6)].map((_, i) => <LeadSkeleton key={i} />)}
          </div>
        ) : myLeads.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <Search size={24} color="#94a3b8" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No leads found</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {search ? 'Try a different search term' : 'No leads in this category yet'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  marginTop: 14, padding: '10px 22px', borderRadius: 99,
                  background: '#1e3a5f', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44,
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => handleCardClick(lead.id)}
                onCallLog={setQuickLogLead}
              />
            ))}

            <div ref={listEnd} style={{ height: 1 }} />

            {loadingMore && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', gap: 8, alignItems: 'center' }}>
                <Loader2 size={18} color="#2563eb" className="load-more-spinner" />
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Loading more…</span>
              </div>
            )}

            {!hasMore && myLeads.length > 0 && (
              <div style={{ textAlign: 'center', padding: '14px 0 4px' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>All {myLeads.length} leads loaded</span>
              </div>
            )}
          </div>
        )}
      </div>

      {quickLogLead && (
        <QuickLogSheet
          lead={quickLogLead}
          onClose={() => setQuickLogLead(null)}
          onSaved={handleQuickLogSaved}
        />
      )}
    </div>
  );
};

export default EmployeeLeadList;
