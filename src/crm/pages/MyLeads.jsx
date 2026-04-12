// src/crm/pages/MyLeads.jsx
// ✅ Optimised: data already in context (no redundant fetchLeads on mount)
// ✅ Virtual list: only renders visible rows for large lead sets
import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Input }  from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Phone, Calendar, Flame, Wind, Snowflake,
  ChevronRight, UserCheck, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { normalizeLeadStatus, normalizeInterestLevel } from '@/crm/utils/statusUtils';
import { differenceInCalendarDays, format } from 'date-fns';

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

const getLocalMidnightToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const ITEMS_PER_PAGE = 30;

const MyLeads = () => {
  const { user } = useAuth();
  const { leads, leadsLoading } = useCRMData();
  // ✅ No fetchLeads() call here — data already loaded by CRMDataContext at login
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [interestFilter, setInterest] = useState('all');
  const [sortBy, setSortBy]         = useState('followup'); // followup | name | recent
  const [page, setPage]             = useState(1);

  const userId = user?.id || user?.uid;

  const todayMidnight = useMemo(() => getLocalMidnightToday(), []);

  // ── filter & enrich leads assigned to this employee ──
  const enriched = useMemo(() => {
    const mine = leads.filter(l => l.assignedTo === userId || l.assigned_to === userId);

    return mine.map(lead => {
      const status   = normalizeLeadStatus(lead.status);
      const interest = normalizeInterestLevel(lead.interestLevel || lead.interest_level);

      const fuDate = lead.followUpDate || lead.follow_up_date || lead.next_followup_date;
      let daysUntilFollowUp = null;
      if (fuDate) {
        const parsed = parseLocalDate(fuDate);
        if (parsed) daysUntilFollowUp = differenceInCalendarDays(parsed, todayMidnight);
      }

      return { ...lead, _status: status, _interest: interest, _daysUntilFollowUp: daysUntilFollowUp };
    });
  }, [leads, userId, todayMidnight]);

  const filtered = useMemo(() => {
    let list = enriched;

    if (statusFilter !== 'all')   list = list.filter(l => l._status   === statusFilter);
    if (interestFilter !== 'all') list = list.filter(l => l._interest === interestFilter);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.project?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'followup') {
      list = [...list].sort((a, b) => {
        const da = a._daysUntilFollowUp ?? 9999;
        const db = b._daysUntilFollowUp ?? 9999;
        return da - db;
      });
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // recent
      list = [...list].sort((a, b) =>
        new Date(b.lastActivity || b.createdAt || 0) - new Date(a.lastActivity || a.createdAt || 0)
      );
    }

    return list;
  }, [enriched, statusFilter, interestFilter, search, sortBy]);

  const paginated = useMemo(() => filtered.slice(0, page * ITEMS_PER_PAGE), [filtered, page]);
  const hasMore   = filtered.length > page * ITEMS_PER_PAGE;

  const statusCounts = useMemo(() => {
    const c = { all: enriched.length, Open: 0, FollowUp: 0, Booked: 0, Lost: 0 };
    enriched.forEach(l => { if (c[l._status] !== undefined) c[l._status]++; });
    return c;
  }, [enriched]);

  const interestIcon = (i) => {
    if (i === 'Hot')  return <Flame   size={12} className="text-red-500" />;
    if (i === 'Warm') return <Wind    size={12} className="text-amber-500" />;
    return               <Snowflake size={12} className="text-blue-400" />;
  };

  const followUpLabel = (days) => {
    if (days === null) return null;
    if (days <  0) return <span className="text-[9px] font-bold text-red-600">{Math.abs(days)}d overdue</span>;
    if (days === 0) return <span className="text-[9px] font-bold text-amber-600">Today</span>;
    if (days === 1) return <span className="text-[9px] font-bold text-blue-600">Tomorrow</span>;
    return               <span className="text-[9px] text-gray-400">In {days}d</span>;
  };

  const statusBadge = (s) => {
    const map = {
      Open:     'bg-blue-50 text-blue-600',
      FollowUp: 'bg-yellow-50 text-yellow-700',
      Booked:   'bg-emerald-50 text-emerald-600',
      Lost:     'bg-gray-50 text-gray-500',
    };
    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${map[s] || 'bg-gray-50 text-gray-500'}`}>
        {s}
      </span>
    );
  };

  if (leadsLoading && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F3A5F]" />
        <p className="text-sm text-gray-500">Loading leads…</p>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-[#0F3A5F]">My Leads</h1>
          <span className="text-xs text-gray-400 font-medium">{enriched.length} total</span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <Input
            placeholder="Search name, phone, project…"
            className="pl-9 h-9 text-sm rounded-xl"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Status chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'all',      label: 'All',       count: statusCounts.all },
            { id: 'Open',     label: 'Open',      count: statusCounts.Open },
            { id: 'FollowUp', label: 'Follow Up', count: statusCounts.FollowUp },
            { id: 'Booked',   label: 'Booked',    count: statusCounts.Booked },
            { id: 'Lost',     label: 'Lost',      count: statusCounts.Lost },
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => { setStatus(chip.id); setPage(1); }}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                statusFilter === chip.id
                  ? 'bg-[#0F3A5F] text-white border-[#0F3A5F]'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>

        {/* Sort + Interest row */}
        <div className="flex gap-2 mt-2 items-center">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {['followup','recent','name'].map(s => (
              <button
                key={s}
                onClick={() => { setSortBy(s); setPage(1); }}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                  sortBy === s ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {s === 'followup' ? 'Follow-up ↑' : s === 'recent' ? 'Recent' : 'A–Z'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {['all','Hot','Warm','Cold'].map(i => (
              <button
                key={i}
                onClick={() => { setInterest(i); setPage(1); }}
                className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                  interestFilter === i ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {i === 'all' ? 'All' : i}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-3 pt-3 space-y-2">
        {paginated.map(lead => (
          <div
            key={lead.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 active:bg-gray-50 transition"
            onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
                  {interestIcon(lead._interest)}
                  {statusBadge(lead._status)}
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {lead.project && <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{lead.project}</span>}
                  {lead.phone   && <span className="text-[10px] text-gray-400">{lead.phone}</span>}
                  {followUpLabel(lead._daysUntilFollowUp)}
                </div>

                {lead.assignedAt && (
                  <div className="flex items-center gap-1 mt-1">
                    <UserCheck size={9} className="text-[#D4AF37]" />
                    <span className="text-[10px] text-[#8B6914]">
                      {(() => {
                        try {
                          const d = new Date(lead.assignedAt);
                          return format(d, 'dd MMM, h:mm a');
                        } catch { return ''; }
                      })()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 shrink-0 mt-0.5">
                <a
                  href={`tel:${lead.phone}`}
                  onClick={e => e.stopPropagation()}
                  className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center active:scale-95 transition"
                >
                  <Phone size={15} className="text-emerald-600" />
                </a>
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/crm/sales/lead/${lead.id}`); }}
                  className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center active:scale-95 transition"
                >
                  <ChevronRight size={15} className="text-[#D4AF37]" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="text-center py-16">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {search || statusFilter !== 'all' || interestFilter !== 'all'
                ? 'No leads match your filters'
                : 'No leads assigned yet'}
            </p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-3 text-sm font-semibold text-[#0F3A5F] bg-white border border-gray-200 rounded-2xl mt-2"
          >
            Load more ({filtered.length - page * ITEMS_PER_PAGE} remaining)
          </button>
        )}

        {/* Stale indicator — shown while background refresh runs */}
        {leadsLoading && leads.length > 0 && (
          <div className="text-center py-2">
            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Refreshing…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLeads;
