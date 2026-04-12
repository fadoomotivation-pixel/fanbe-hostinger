// src/crm/pages/MyLeads.jsx
// ✅ Mobile-first redesign: premium card layout, 44px tap targets, clear visual hierarchy
import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Search, Phone, Flame, Wind, Snowflake,
  ChevronRight, UserCheck, Clock, AlertCircle,
  Loader2, SlidersHorizontal, X, Plus, Calendar
} from 'lucide-react';
import { normalizeLeadStatus, normalizeInterestLevel } from '@/crm/utils/statusUtils';
import { differenceInCalendarDays, format } from 'date-fns';

const parseLocalDate = (d) => {
  if (!d || typeof d !== 'string') return null;
  const [y, m, day] = d.split('T')[0].split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

const getToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

const ITEMS = 30;

// ─── Interest icon ────────────────────────────────────────────────────────────
const InterestIcon = ({ level }) => {
  if (level === 'Hot')  return <Flame   size={11} className="text-red-500" />;
  if (level === 'Warm') return <Wind    size={11} className="text-amber-400" />;
  return                       <Snowflake size={11} className="text-sky-400" />;
};

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const cfg = {
    Open:     'bg-blue-50  text-blue-600  ring-blue-100',
    FollowUp: 'bg-amber-50 text-amber-700 ring-amber-100',
    Booked:   'bg-emerald-50 text-emerald-600 ring-emerald-100',
    Lost:     'bg-gray-50  text-gray-400  ring-gray-100',
  }[status] || 'bg-gray-50 text-gray-400 ring-gray-100';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${cfg}`}>
      {status === 'FollowUp' ? 'Follow Up' : status}
    </span>
  );
};

// ─── Follow-up chip ───────────────────────────────────────────────────────────
const FuChip = ({ days }) => {
  if (days === null) return null;
  if (days < 0)  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600"><AlertCircle size={9}/>{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600"><Clock size={9}/>Today</span>;
  if (days === 1) return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-500"><Clock size={9}/>Tomorrow</span>;
  return               <span className="text-[10px] text-gray-400">In {days}d</span>;
};

// ─── Individual lead card ─────────────────────────────────────────────────────
const LeadCard = React.memo(({ lead, onNavigate }) => {
  const urgent = lead._daysUntilFollowUp !== null && lead._daysUntilFollowUp <= 0;
  const isNew  = lead._callStatus === 'never_called';

  return (
    <div
      onClick={onNavigate}
      className={`relative bg-white rounded-2xl border active:scale-[0.99] active:bg-gray-50 transition-all duration-150 overflow-hidden cursor-pointer ${
        isNew   ? 'border-l-[3px] border-l-sky-400   border-gray-100' :
        urgent  ? 'border-l-[3px] border-l-red-400   border-gray-100' :
        lead._interest === 'Hot' ? 'border-l-[3px] border-l-red-300 border-gray-100' :
        'border-gray-100'
      }`}
    >
      <div className="flex items-stretch gap-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 px-4 py-3">
          {/* Row 1: name + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[15px] text-gray-900 leading-snug">{lead.name}</span>
            <InterestIcon level={lead._interest} />
            {isNew && <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-bold tracking-wide">NEW</span>}
          </div>

          {/* Row 2: project · phone */}
          <div className="flex items-center gap-2 mt-0.5">
            {lead.project && (
              <span className="text-[11px] text-gray-400 truncate max-w-[140px]">{lead.project}</span>
            )}
            {lead.project && lead.phone && <span className="text-gray-200">·</span>}
            {lead.phone && (
              <span className="text-[11px] text-gray-400">{lead.phone}</span>
            )}
          </div>

          {/* Row 3: status + follow-up */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusPill status={lead._status} />
            <FuChip days={lead._daysUntilFollowUp} />
          </div>

          {/* Row 4: assigned time */}
          {lead.assignedAt && (
            <div className="flex items-center gap-1 mt-1.5">
              <UserCheck size={10} className="text-[#D4AF37] shrink-0" />
              <span className="text-[10px] text-[#9a7720]">
                {(() => { try { return format(new Date(lead.assignedAt), 'dd MMM, h:mm a'); } catch { return ''; } })()}
              </span>
            </div>
          )}
        </div>

        {/* Action column */}
        <div className="flex flex-col items-center justify-center gap-2 px-3 border-l border-gray-50 bg-gray-50/50">
          <a
            href={`tel:${lead.phone}`}
            onClick={e => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label={`Call ${lead.name}`}
          >
            <Phone size={16} className="text-white" />
          </a>
          <button
            onClick={e => { e.stopPropagation(); onNavigate(); }}
            className="w-10 h-10 rounded-full bg-[#0F3A5F] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            aria-label={`View ${lead.name}`}
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
});
LeadCard.displayName = 'LeadCard';

// ─── Main page ────────────────────────────────────────────────────────────────
const MyLeads = () => {
  const { user }  = useAuth();
  const { leads, leadsLoading } = useCRMData();
  const navigate  = useNavigate();

  const [search,     setSearch]   = useState('');
  const [status,     setStatus]   = useState('all');
  const [interest,   setInterest] = useState('all');
  const [sortBy,     setSortBy]   = useState('followup');
  const [page,       setPage]     = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const userId = user?.id || user?.uid;
  const today  = useMemo(() => getToday(), []);

  // ── Enrich leads ──
  const enriched = useMemo(() => {
    return leads
      .filter(l => l.assignedTo === userId || l.assigned_to === userId)
      .map(lead => {
        const _status   = normalizeLeadStatus(lead.status);
        const _interest = normalizeInterestLevel(lead.interestLevel || lead.interest_level);
        const fuDate    = lead.followUpDate || lead.follow_up_date || lead.next_followup_date;
        let _daysUntilFollowUp = null;
        if (fuDate) {
          const p = parseLocalDate(fuDate);
          if (p) _daysUntilFollowUp = differenceInCalendarDays(p, today);
        }
        return { ...lead, _status, _interest, _daysUntilFollowUp };
      });
  }, [leads, userId, today]);

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let list = enriched;
    if (status   !== 'all') list = list.filter(l => l._status   === status);
    if (interest !== 'all') list = list.filter(l => l._interest === interest);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.project?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'followup') {
      list = [...list].sort((a, b) => (a._daysUntilFollowUp ?? 9999) - (b._daysUntilFollowUp ?? 9999));
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      list = [...list].sort((a, b) =>
        new Date(b.lastActivity || b.createdAt || 0) - new Date(a.lastActivity || a.createdAt || 0)
      );
    }
    return list;
  }, [enriched, status, interest, search, sortBy]);

  const visible = useMemo(() => filtered.slice(0, page * ITEMS), [filtered, page]);
  const hasMore = filtered.length > page * ITEMS;

  const counts = useMemo(() => {
    const c = { all: enriched.length, Open: 0, FollowUp: 0, Booked: 0, Lost: 0 };
    enriched.forEach(l => { if (c[l._status] !== undefined) c[l._status]++; });
    return c;
  }, [enriched]);

  const overdueCount  = useMemo(() => enriched.filter(l => l._daysUntilFollowUp !== null && l._daysUntilFollowUp < 0).length, [enriched]);
  const todayCount    = useMemo(() => enriched.filter(l => l._daysUntilFollowUp === 0).length, [enriched]);

  const activeFilters = (status !== 'all' ? 1 : 0) + (interest !== 'all' ? 1 : 0) + (sortBy !== 'followup' ? 1 : 0);

  if (leadsLoading && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[65vh] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-[#0F3A5F]" />
        <p className="text-sm text-gray-400">Loading your leads…</p>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-[#f5f6fa] min-h-screen">

      {/* ── STICKY HEADER ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">

        {/* Title row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h1 className="text-[17px] font-bold text-[#0F3A5F] leading-tight">My Leads</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">{enriched.length} total assigned</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Add lead shortcut */}
            <button
              onClick={() => navigate('/crm/sales/add-lead')}
              className="w-9 h-9 rounded-full bg-[#0F3A5F] flex items-center justify-center shadow-sm active:scale-90 transition-transform"
              aria-label="Add lead"
            >
              <Plus size={16} className="text-white" />
            </button>
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
                showFilter || activeFilters > 0
                  ? 'bg-[#0F3A5F] border-[#0F3A5F] text-white'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
              aria-label="Filters"
            >
              <SlidersHorizontal size={15} />
              {activeFilters > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D4AF37] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Urgent banners */}
        {(overdueCount > 0 || todayCount > 0) && (
          <div className="flex gap-2 px-4 pb-2">
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                <AlertCircle size={11} className="text-red-500" />
                <span className="text-[11px] font-bold text-red-600">{overdueCount} overdue</span>
              </div>
            )}
            {todayCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
                <Clock size={11} className="text-amber-500" />
                <span className="text-[11px] font-bold text-amber-600">{todayCount} due today</span>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search name, phone, project…"
              className="pl-9 pr-9 h-10 text-sm rounded-xl bg-[#f5f6fa] border-gray-100 focus:bg-white focus:border-[#0F3A5F]/30"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <X size={10} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all',      label: 'All',       n: counts.all },
            { id: 'Open',     label: 'Open',      n: counts.Open },
            { id: 'FollowUp', label: 'Follow Up', n: counts.FollowUp },
            { id: 'Booked',   label: 'Booked',    n: counts.Booked },
            { id: 'Lost',     label: 'Lost',      n: counts.Lost },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => { setStatus(c.id); setPage(1); }}
              className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold border transition-all ${
                status === c.id
                  ? 'bg-[#0F3A5F] text-white border-[#0F3A5F] shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {c.label}
              <span className={`ml-1 text-[10px] ${ status === c.id ? 'text-white/70' : 'text-gray-400' }`}>
                {c.n}
              </span>
            </button>
          ))}
        </div>

        {/* Collapsible filters */}
        {showFilter && (
          <div className="px-4 pb-3 border-t border-gray-50 pt-3 bg-gray-50/50 space-y-2.5">
            {/* Sort */}
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Sort by</p>
              <div className="flex gap-1.5">
                {[
                  { id: 'followup', label: 'Follow-up ↑' },
                  { id: 'recent',   label: 'Recent' },
                  { id: 'name',     label: 'A–Z' },
                ].map(s => (
                  <button key={s.id} onClick={() => setSortBy(s.id)}
                    className={`h-7 px-3 rounded-full text-[11px] font-semibold border transition-all ${
                      sortBy === s.id
                        ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Interest */}
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Interest level</p>
              <div className="flex gap-1.5">
                {['all','Hot','Warm','Cold'].map(i => (
                  <button key={i} onClick={() => setInterest(i)}
                    className={`h-7 px-3 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                      interest === i
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    {i !== 'all' && <InterestIcon level={i} />}
                    {i === 'all' ? 'All' : i}
                  </button>
                ))}
              </div>
            </div>
            {/* Reset */}
            {activeFilters > 0 && (
              <button onClick={() => { setStatus('all'); setInterest('all'); setSortBy('followup'); setPage(1); }}
                className="text-[11px] text-[#0F3A5F] font-semibold underline">
                Reset all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── RESULTS HEADER ────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-[11px] text-gray-400 font-medium">
          {filtered.length === enriched.length
            ? `${enriched.length} leads`
            : `${filtered.length} of ${enriched.length} leads`}
        </p>
        {leadsLoading && leads.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Loader2 size={9} className="animate-spin" /> Refreshing…
          </span>
        )}
      </div>

      {/* ── LEAD LIST ────────────────────────────────────── */}
      <div className="px-3 space-y-2">
        {visible.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onNavigate={() => navigate(`/crm/sales/lead/${lead.id}`)}
          />
        ))}

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400 text-center max-w-[200px]">
              {search || status !== 'all' || interest !== 'all'
                ? 'No leads match your filters'
                : 'No leads assigned to you yet'}
            </p>
            {(search || status !== 'all' || interest !== 'all') && (
              <button
                onClick={() => { setSearch(''); setStatus('all'); setInterest('all'); setPage(1); }}
                className="text-xs text-[#0F3A5F] font-semibold underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3.5 text-sm font-semibold text-[#0F3A5F] bg-white border border-gray-200 rounded-2xl mt-1 active:bg-gray-50 transition"
          >
            Show {Math.min(ITEMS, filtered.length - page * ITEMS)} more
            <span className="ml-1 text-xs text-gray-400">
              ({filtered.length - page * ITEMS} remaining)
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MyLeads;
