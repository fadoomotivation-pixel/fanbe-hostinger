// src/crm/components/LeadTable.jsx
// ✅ PERF: pagination fully controlled by parent (page/totalCount/onPageChange props)
// ✅ PERF: calculateScore() deferred to idle time via requestIdleCallback so it
//         never blocks the first paint on slow networks
// ✅ PERF: skeleton loader shown while scores are computing
// ✅ PERF: React.memo on every row — only changed rows re-render
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Edit2, ArrowUpDown, StickyNote, Trash2, UserPlus, RefreshCw, X, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateScore, getScoreBadge, getScoreColor, getProgressBarColor } from '@/lib/leadScoringEngine';

const STATUS_COLORS = {
  Open:     'bg-blue-100 text-blue-800 border-blue-200',
  FollowUp: 'bg-orange-100 text-orange-800 border-orange-200',
  Booked:   'bg-green-100 text-green-800 border-green-200',
  Lost:     'bg-red-100 text-red-800 border-red-200',
};
const getStatusColor = (s) => STATUS_COLORS[s] || 'bg-gray-100 text-gray-800';

const getLastNoteText = (notes) => {
  if (!notes) return null;
  if (Array.isArray(notes)) return notes[notes.length - 1]?.text || null;
  if (typeof notes === 'string' && notes.trim()) return notes.trim();
  return null;
};

// ── Skeleton row shown while scores are computing ─────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(9)].map((_, i) => (
      <td key={i} className="p-4">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

// ── Memoized row — only re-renders when its own data changes ──────────────────
const LeadRow = React.memo(({ lead, isSelected, onSelect, onAction, onStatusChange, type }) => {
  const noteText    = useMemo(() => getLastNoteText(lead.notes), [lead.notes]);
  const scoreBadge  = getScoreBadge(lead.score);
  const scoreColor  = getScoreColor(lead.score);
  const progressColor = getProgressBarColor(lead.score);
  return (
    <tr className={`hover:bg-blue-50/30 transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="p-4">
        <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(lead.id, c)} />
      </td>
      <td className="p-4 w-24">
        <div className="flex flex-col gap-1 items-center">
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${scoreColor}`}>{scoreBadge}</span>
          <span className="text-xl font-bold text-gray-700">{lead.score}</span>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${progressColor}`} style={{ width: `${lead.score}%` }} />
          </div>
        </div>
      </td>
      <td className="p-4 font-medium text-[#0F3A5F]">
        <div>{lead.name}</div>
        {lead.isVIP && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 ml-1 text-[10px]">VIP</Badge>}
      </td>
      <td className="p-4">
        <div className="text-gray-600">{lead.phone}</div>
        <div className="text-xs text-gray-400">{lead.email}</div>
      </td>
      <td className="p-4 text-gray-600">{lead.project}</td>
      {type === 'daily'     && <td className="p-4 text-xs text-gray-500 hidden lg:table-cell"><div className="font-medium">{lead.assignedToName || 'Unassigned'}</div></td>}
      {type === 'follow-up' && <td className="p-4">—</td>}
      {type === 'booked'    && <td className="p-4">—</td>}
      {type === 'lost'      && <td className="p-4">—</td>}
      <td className="p-4">
        <div className="flex items-start gap-2 group/note cursor-pointer" onClick={() => onAction('viewNotes', lead)}>
          <div className="flex-1 min-w-0">
            {noteText ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-gray-600 truncate max-w-[180px]">
                      {noteText.length > 50 ? noteText.substring(0, 50) + '...' : noteText}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">{noteText}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : <span className="text-xs text-gray-400 italic">No notes</span>}
          </div>
          <Edit2 size={12} className="text-gray-400 opacity-0 group-hover/note:opacity-100 transition-opacity mt-1" />
        </div>
      </td>
      <td className="p-4">
        <Select value={lead.status} onValueChange={(val) => onStatusChange(lead, val)}>
          <SelectTrigger className={`h-8 w-28 text-xs border border-transparent focus:ring-0 ${getStatusColor(lead.status)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="FollowUp">Follow Up</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full"
            onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}>
            <Phone size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 rounded-full"
            onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}>
            <MessageSquare size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full"
            onClick={(e) => { e.stopPropagation(); onAction('viewNotes', lead); }}>
            <StickyNote size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
});
LeadRow.displayName = 'LeadRow';

// ── Mobile card ───────────────────────────────────────────────────────────────
const LeadCard = React.memo(({ lead, isSelected, onSelect, onAction }) => {
  const noteText = useMemo(() => getLastNoteText(lead.notes), [lead.notes]);
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
    }`}>
      <div className="flex gap-3">
        <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(lead.id, c)} className="mt-1" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900">{lead.name}</h3>
              <div className="text-sm text-blue-600">{lead.phone}</div>
            </div>
            <Badge variant="outline">{lead.status}</Badge>
          </div>
          <div className="mt-2 text-xs text-gray-500">{lead.project}</div>
          {noteText && (
            <div className="mt-1 text-xs text-gray-400 italic truncate">
              {noteText.length > 60 ? noteText.substring(0, 60) + '...' : noteText}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t mt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('call', lead)}><Phone size={14} className="mr-1" /> Call</Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('whatsapp', lead)}><MessageSquare size={14} className="mr-1" /> WA</Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('viewNotes', lead)}><StickyNote size={14} className="mr-1" /> Notes</Button>
      </div>
    </div>
  );
});
LeadCard.displayName = 'LeadCard';

// ── Pagination bar (inside the card) ─────────────────────────────────────────
const PaginationBar = ({ page, total, pageSize, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
      <span className="text-xs">{start}–{end} of {total} leads</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 font-semibold text-gray-700 text-xs">{page} / {totalPages}</span>
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
// Props:
//   leads        — the CURRENT PAGE slice (already filtered + paginated by parent)
//   totalCount   — total filtered count (for pagination bar)
//   page         — current page number (1-based), controlled by parent
//   pageSize     — rows per page (default 50)
//   onPageChange — callback(newPage)
const LeadTable = ({
  leads,
  onAction,
  onStatusChange,
  selectedIds = [],
  onSelectLead,
  onSelectAll,
  type = 'daily',
  showSource = false,
  // pagination props (controlled by parent)
  totalCount   = 0,
  page         = 1,
  pageSize     = 50,
  onPageChange = () => {},
}) => {
  const [sortField, setSortField] = useState('score');
  const [sortDir,   setSortDir]   = useState('desc');

  // ── Deferred scoring via requestIdleCallback ──────────────────────────────
  // On slow networks the main thread is busy painting. We score leads during
  // browser idle time so the table rows appear immediately (unstyled scores)
  // and scores fill in ~100ms later without blocking interaction.
  const [scoredLeads, setScoredLeads] = useState(() => leads.map(l => ({ ...l, score: 0 })));
  const [scoresReady, setScoresReady] = useState(false);
  const idleHandle = useRef(null);

  useEffect(() => {
    setScoresReady(false);
    // Cancel any previous idle job
    if (idleHandle.current) {
      if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(idleHandle.current);
      else clearTimeout(idleHandle.current);
    }
    const run = () => {
      setScoredLeads(leads.map(l => ({ ...l, score: calculateScore(l) })));
      setScoresReady(true);
    };
    if (typeof requestIdleCallback !== 'undefined') {
      idleHandle.current = requestIdleCallback(run, { timeout: 500 });
    } else {
      // Safari fallback
      idleHandle.current = setTimeout(run, 50);
    }
    return () => {
      if (idleHandle.current) {
        if (typeof cancelIdleCallback !== 'undefined') cancelIdleCallback(idleHandle.current);
        else clearTimeout(idleHandle.current);
      }
    };
  }, [leads]);

  // ── Sort scored leads ─────────────────────────────────────────────────────
  const sortedLeads = useMemo(() => {
    const arr = [...scoredLeads];
    arr.sort((a, b) => {
      let vA = a[sortField], vB = b[sortField];
      if (typeof vA === 'string') { vA = vA.toLowerCase(); vB = (vB || '').toLowerCase(); }
      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return arr;
  }, [scoredLeads, sortField, sortDir]);

  const handleSort = useCallback((field) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return field;
    });
  }, []);

  const allSelected  = leads.length > 0 && selectedIds.length === leads.length;
  const noneSelected = selectedIds.length === 0;
  const quickSelectSizes = useMemo(() => [10, 25, 50].filter(n => n < leads.length), [leads.length]);
  const selectedSet  = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleSelectN = useCallback((n) => {
    const topN = sortedLeads.slice(0, n).map(l => l.id);
    topN.forEach(id => { if (!selectedIds.includes(id)) onSelectLead(id, true); });
  }, [sortedLeads, selectedIds, onSelectLead]);

  return (
    <div className="space-y-3">

      {/* Quick select toolbar */}
      {leads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-xs text-gray-400 font-medium mr-1 shrink-0">Quick select:</span>
          {quickSelectSizes.map(n => (
            <button key={n} onClick={() => handleSelectN(n)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium transition-colors">
              <CheckSquare size={11} /> {n}
            </button>
          ))}
          <button onClick={() => onSelectAll(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-blue-300 text-blue-800 bg-blue-100 hover:bg-blue-200 font-semibold transition-colors">
            <CheckSquare size={11} /> All {leads.length}
          </button>
          {!noneSelected && (
            <>
              <button onClick={() => onSelectAll(false)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 transition-colors ml-1">
                <X size={11} /> Clear
              </button>
              <span className="ml-auto text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                {selectedIds.length} selected
              </span>
            </>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 h-6">{selectedIds.length} Selected</Badge>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-500 hover:text-gray-900" onClick={() => onSelectAll(false)}>
              <X size={12} className="mr-1" /> Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onAction('bulk_assign')}>
              <UserPlus size={14} className="mr-2" /> Assign
            </Button>
            <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onAction('bulk_status')}>
              <RefreshCw size={14} className="mr-2" /> Status
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onAction('bulk_delete')}>
              <Trash2 size={14} className="mr-2" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="p-4 w-10"><Checkbox checked={allSelected} onCheckedChange={onSelectAll} /></th>
                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('score')}>
                  <div className="flex items-center">Score <ArrowUpDown size={12} className="ml-1 text-gray-400" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Name <ArrowUpDown size={12} className="ml-1 text-gray-400" /></div>
                </th>
                <th className="p-4">Contact</th>
                <th className="p-4">Project</th>
                {type === 'daily'     && <th className="p-4 hidden lg:table-cell">Assigned To</th>}
                {type === 'follow-up' && <th className="p-4">Follow-Up</th>}
                {type === 'booked'    && <th className="p-4">Booking</th>}
                {type === 'lost'      && <th className="p-4">Reason</th>}
                <th className="p-4 w-64">Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.length === 0 ? (
                <tr><td colSpan="10" className="p-8 text-center text-gray-400">No leads found.</td></tr>
              ) : !scoresReady ? (
                // Skeleton rows while scoring runs in idle time
                [...Array(Math.min(leads.length, 10))].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                sortedLeads.map(lead => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedSet.has(lead.id)}
                    onSelect={onSelectLead}
                    onAction={onAction}
                    onStatusChange={onStatusChange}
                    type={type}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination bar — inside the card, always visible */}
        <PaginationBar
          page={page}
          total={totalCount}
          pageSize={pageSize}
          onChange={onPageChange}
        />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-10 bg-white p-2 shadow-md rounded-md flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-blue-800">{selectedIds.length} Selected</span>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => onAction('bulk_delete')}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        )}
        {sortedLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isSelected={selectedSet.has(lead.id)}
            onSelect={onSelectLead}
            onAction={onAction}
          />
        ))}
        <PaginationBar
          page={page}
          total={totalCount}
          pageSize={pageSize}
          onChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default LeadTable;
