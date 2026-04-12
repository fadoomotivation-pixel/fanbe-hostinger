import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import {
  Search, Plus, Phone, Calendar, IndianRupee,
  TrendingUp, Users, CheckCircle2, Clock, X,
  ChevronRight, Flame
} from 'lucide-react';

/* ─── Status config ──────────────────────────────────────────────────── */
const STATUS_CFG = {
  Open:       { dot: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  text: '#1d4ed8', label: 'Open'      },
  FollowUp:   { dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#b45309', label: 'Follow Up' },
  'Follow Up':{ dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#b45309', label: 'Follow Up' },
  Booked:     { dot: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#065f46', label: 'Booked'    },
  Lost:       { dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',  text: '#991b1b', label: 'Lost'      },
};

const getStatus = s => STATUS_CFG[s] || STATUS_CFG.Open;

/* ─── Helpers ────────────────────────────────────────────────────────── */
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

/* ─── normalise DB row → UI shape ───────────────────────────────────── */
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

/* ─── Skeleton ───────────────────────────────────────────────────────── */
const LeadSkeleton = () => (
  <div style={styles.card}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ ...styles.skel, width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...styles.skel, width: '60%', height: 14 }} />
        <div style={{ ...styles.skel, width: '40%', height: 11 }} />
        <div style={{ ...styles.skel, width: '80%', height: 11 }} />
      </div>
      <div style={{ ...styles.skel, width: 64, height: 22, borderRadius: 99 }} />
    </div>
  </div>
);

/* ─── Lead Card ──────────────────────────────────────────────────────── */
const LeadCard = React.memo(({ lead, onClick }) => {
  const st     = getStatus(lead.status);
  const urgent = isUrgent(lead);
  const initials = (lead.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.card,
        borderLeft: urgent ? '3px solid #f59e0b' : '3px solid transparent',
        WebkitTapHighlightColor: 'transparent',
      }}
      className="lead-card"
    >
      {/* Top row */}
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
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.name}
            </span>
            {urgent && <Flame size={13} color="#f59e0b" />}
          </div>
          {lead.project && (
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      <div style={{ height: 1, background: '#f1f5f9', margin: '10px 0' }} />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {lead.phone && (
          <div style={styles.infoChip}>
            <Phone size={12} color="#3b82f6" />
            <span style={{ fontSize: 12, color: '#334155' }}>{lead.phone}</span>
          </div>
        )}
        {lead.budget && (
          <div style={styles.infoChip}>
            <IndianRupee size={12} color="#10b981" />
            <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
              ₹{fmtBudget(lead.budget)}
            </span>
          </div>
        )}
        {lead.followUpDate && (
          <div style={{
            ...styles.infoChip,
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

      {lead.lastNote && (
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📝 {lead.lastNote}
        </p>
      )}

      {(lead.updatedAt || lead.createdAt) && (
        <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
          Updated {fmtTime(lead.updatedAt || lead.createdAt)}
        </p>
      )}
    </div>
  );
});

/* ─── Filter pill ────────────────────────────────────────────────────── */
const FilterPill = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
      background: active ? '#1e3a5f' : '#f1f5f9',
      color: active ? '#fff' : '#64748b',
      boxShadow: active ? '0 2px 8px rgba(30,58,95,0.2)' : 'none',
      WebkitTapHighlightColor: 'transparent',
      whiteSpace: 'nowrap',
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

/* ─── Stat card ──────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div style={{
    flex: '1 1 0', minWidth: 0,
    background: '#fff', borderRadius: 14,
    padding: '14px 16px', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: `${accent}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    }}>
      <Icon size={17} color={accent} />
    </div>
    <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 500 }}>{label}</p>
  </div>
);

/* ─── Inline styles ──────────────────────────────────────────────────── */
const styles = {
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

/* ─── Constants ──────────────────────────────────────────────────────── */
const FILTERS = ['All', 'Open', 'FollowUp', 'Booked', 'Lost'];
const FILTER_LABELS = { All: 'All', Open: 'Open', FollowUp: 'Follow Up', Booked: 'Booked', Lost: 'Lost' };
const PAGE_SIZE = 20;

/* ─── Page ───────────────────────────────────────────────────────────── */
const EmployeeLeadList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Own fetch — completely independent of global useCRMData ── */
  const [myLeads,  setMyLeads]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [page,     setPage]     = useState(1);
  const searchRef = useRef(null);
  const listEnd   = useRef(null);

  const userId = user?.uid || user?.id;

  /* ── Initial fetch: only rows assigned to this employee ── */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id,name,phone,project,status,budget,assigned_to,follow_up_date,updated_at,created_at,last_note')
          .eq('assigned_to', userId)
          .order('updated_at', { ascending: false });

        if (!cancelled && !error) {
          console.log(`[MyLeads] loaded ${data.length} leads for user ${userId}`);
          setMyLeads(data.map(normalise));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  /* ── Realtime: only listen to rows for this user ── */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`my-leads-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `assigned_to=eq.${userId}` },
        payload => {
          setMyLeads(prev => {
            if (payload.eventType === 'DELETE') {
              return prev.filter(l => l.id !== payload.old.id);
            }
            const updated = normalise(payload.new);
            const idx = prev.findIndex(l => l.id === updated.id);
            if (idx === -1) return [updated, ...prev];
            const next = [...prev];
            next[idx] = updated;
            return next.sort((a, b) =>
              new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
            );
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:    myLeads.length,
    open:     myLeads.filter(l => l.status === 'Open').length,
    followUp: myLeads.filter(l => l.status === 'FollowUp' || l.status === 'Follow Up').length,
    booked:   myLeads.filter(l => l.status === 'Booked').length,
  }), [myLeads]);

  /* ── Filter + Search ── */
  const filtered = useMemo(() => {
    let list = myLeads;
    if (filter !== 'All') list = list.filter(l =>
      l.status === filter || (filter === 'FollowUp' && l.status === 'Follow Up')
    );
    if (search) {
      const t = search.toLowerCase();
      list = list.filter(l =>
        l.name?.toLowerCase().includes(t) ||
        l.phone?.includes(t) ||
        l.project?.toLowerCase().includes(t)
      );
    }
    return list;
  }, [myLeads, filter, search]);

  const visible = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const handleCardClick = useCallback(id => navigate(`/crm/lead/${id}`), [navigate]);

  useEffect(() => { setPage(1); }, [search, filter]);

  /* ── Infinite scroll ── */
  useEffect(() => {
    if (!listEnd.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visible.length < filtered.length) setPage(p => p + 1);
    }, { threshold: 0.1 });
    obs.observe(listEnd.current);
    return () => obs.disconnect();
  }, [visible.length, filtered.length]);

  /* ── Today / Tomorrow follow-ups ── */
  const todayCount = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return myLeads.filter(l => {
      if (!l.followUpDate) return false;
      const d = new Date(l.followUpDate); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    }).length;
  }, [myLeads]);

  const tomorrowCount = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return myLeads.filter(l => {
      if (!l.followUpDate) return false;
      const d = new Date(l.followUpDate); d.setHours(0,0,0,0);
      return d.getTime() === tomorrow.getTime();
    }).length;
  }, [myLeads]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)',
      paddingBottom: 32,
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
        .lead-card:active { transform: scale(0.985); box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important; }
        .lead-card:hover  { box-shadow: 0 4px 16px rgba(30,58,95,0.12) !important; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 16px 0',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
                My Leads
              </h1>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {myLeads.length} leads assigned to you
              </p>
            </div>
            <button
              onClick={() => navigate('/crm/lead/new')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 99, border: 'none',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus size={15} />
              Add Lead
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, project…"
              style={{
                width: '100%', height: 42, paddingLeft: 38, paddingRight: search ? 36 : 12,
                borderRadius: 12, border: '1.5px solid #e2e8f0',
                background: '#fff', fontSize: 14, color: '#0f172a',
                outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
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
                  f === 'All'      ? myLeads.length :
                  f === 'Open'     ? stats.open :
                  f === 'FollowUp' ? stats.followUp :
                  f === 'Booked'   ? stats.booked :
                  myLeads.filter(l => l.status === f).length
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Follow-up alerts */}
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

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <StatCard label="Total"     value={stats.total}    icon={Users}        accent="#2563eb" />
          <StatCard label="Open"      value={stats.open}     icon={TrendingUp}   accent="#3b82f6" />
          <StatCard label="Follow Up" value={stats.followUp} icon={Clock}        accent="#f59e0b" />
          <StatCard label="Booked"    value={stats.booked}   icon={CheckCircle2} accent="#10b981" />
        </div>

        {/* Results label */}
        {(search || filter !== 'All') && (
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: 500 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {search ? ` for "${search}"` : ''}
            {filter !== 'All' ? ` · ${FILTER_LABELS[filter]}` : ''}
          </p>
        )}

        {/* Lead list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(6)].map((_, i) => <LeadSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
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
                  marginTop: 14, padding: '8px 20px', borderRadius: 99,
                  background: '#1e3a5f', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => handleCardClick(lead.id)}
              />
            ))}
            <div ref={listEnd} style={{ height: 10 }} />
            {visible.length < filtered.length && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>
                Loading more…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLeadList;
