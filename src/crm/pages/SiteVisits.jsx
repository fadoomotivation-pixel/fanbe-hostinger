// src/crm/pages/SiteVisits.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Search, X, Loader2, MapPin, Calendar, TrendingUp,
  Edit2, CheckCircle2, Flame, Wind, Snowflake, Clock,
  Building2, User, ChevronDown, AlertCircle, Wifi
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const extractInterest = (notes) => { if (!notes) return null; const m = notes.match(/^\[Interest: (\w+)\]/); return m ? m[1] : null; };
const extractFeedback = (notes) => { if (!notes) return ''; return notes.replace(/^\[Interest: \w+\] /, ''); };

const interestMeta = {
  High:   { icon: Flame,     bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444', label: 'High · Very Interested' },
  Medium: { icon: Wind,      bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B', label: 'Medium · Considering' },
  Low:    { icon: Snowflake, bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6', label: 'Low · Just Looking' },
};

const InterestBadge = ({ level }) => {
  const m = interestMeta[level] || interestMeta.Medium;
  const Icon = m.icon;
  return (
    <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold">
      <Icon size={10} />{level || '—'}
    </span>
  );
};

const InterestToggle = ({ value, onChange }) => (
  <div className="flex gap-2">
    {['High', 'Medium', 'Low'].map(l => {
      const m = interestMeta[l];
      const Icon = m.icon;
      const active = value === l;
      return (
        <button key={l} type="button" onClick={() => onChange(l)}
          style={active ? { background: m.bg, color: m.text, border: `1.5px solid ${m.border}` } : {}}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
            active ? '' : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'
          }`}>
          <Icon size={14} />{l}
        </button>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────────────────
   LEAD PICKER (with live search)
───────────────────────────────────────────────────────── */
const LeadPicker = ({ leads, value, onChange }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const inputRef          = useRef(null);
  const wrapRef           = useRef(null);
  const selected          = leads.find(l => l.id === value);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return leads.slice(0, 50);
    return leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.project?.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [leads, query]);

  const handleSelect = (lead) => { onChange(lead.id); setQuery(''); setOpen(false); };

  return (
    <div ref={wrapRef} className="relative">
      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
            selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'
          }`}>
          <div className="flex items-center gap-2 min-w-0">
            <User size={14} className={selected ? 'text-blue-500 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
            {selected ? (
              <span className="truncate font-semibold text-gray-900">
                {selected.name}
                <span className="text-gray-400 font-normal ml-1.5 text-xs">{selected.phone}</span>
              </span>
            ) : <span className="text-gray-400">Search lead by name, phone, project…</span>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selected && <span onClickCapture={e => { e.stopPropagation(); onChange(''); }} className="p-0.5 rounded"><X size={13} className="text-blue-400" /></span>}
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </button>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder={`Type name / phone / project… (${leads.length} leads)`}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-blue-400 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" />
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex justify-between">
            <span className="text-[10px] text-gray-400 font-medium">
              {query ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}` : `${filtered.length} of ${leads.length} leads`}
            </span>
            <button type="button" onClick={() => setOpen(false)} className="text-[10px] text-gray-400">Close ✕</button>
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <li className="flex flex-col items-center py-8 text-gray-400">
                <AlertCircle size={22} className="mb-2 text-gray-200" />
                <p className="text-xs">No leads match your search</p>
              </li>
            ) : filtered.map(lead => (
              <li key={lead.id}>
                <button type="button" onMouseDown={() => handleSelect(lead)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors ${
                    value === lead.id ? 'bg-blue-50' : ''
                  }`}>
                  <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: 'linear-gradient(135deg,#0F3A5F,#1B6CA8)' }}>
                    {(lead.name||'L').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{lead.phone}{lead.project ? ` · ${lead.project}` : ''}</p>
                  </div>
                  {value === lead.id && <CheckCircle2 size={15} className="text-blue-500 flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: color + '18' }}>
      <Icon size={17} style={{ color }} />
    </div>
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-base font-black text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   VISIT CARD (history item)
───────────────────────────────────────────────────────── */
const VisitCard = ({ visit, onEdit }) => {
  const interest  = visit.interest || extractInterest(visit.notes) || 'Medium';
  const feedback  = extractFeedback(visit.notes) || visit.feedback || '—';
  const visitDate = visit.visitDate || visit.timestamp;
  const m         = interestMeta[interest] || interestMeta.Medium;

  let dateStr = '—';
  try { dateStr = format(parseISO(visitDate), 'dd MMM yyyy'); } catch {}
  let timeStr = '';
  try { timeStr = visit.visitTime || format(parseISO(visitDate), 'hh:mm a'); } catch {}

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* color strip */}
      <div className="h-1" style={{ background: m.dot }} />
      <div className="px-4 py-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#0F3A5F,#1B6CA8)' }}>
              {(visit.leadName||'L').slice(0,2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{visit.leadName || '—'}</p>
              {visit.projectName && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                  <Building2 size={10} />{visit.projectName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <InterestBadge level={interest} />
            <button onClick={() => onEdit(visit)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition">
              <Edit2 size={13} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Feedback */}
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2.5">{feedback}</p>

        {/* Date/Time footer */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
          <span className="flex items-center gap-1"><Calendar size={10} />{dateStr}</span>
          {timeStr && <span className="flex items-center gap-1"><Clock size={10} />{timeStr}</span>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
const SiteVisits = () => {
  const { user }                                                     = useAuth();
  const { leads, addSiteVisitLog, updateSiteVisit, siteVisits, siteVisitsLoading } = useCRMData();
  const { toast }                                                    = useToast();
  const [searchParams]                                               = useSearchParams();
  const [submitting, setSubmitting]                                  = useState(false);

  const [formData, setFormData] = useState({ leadId: '', date: '', interest: 'Medium', feedback: '' });
  const [editingVisit, setEditingVisit] = useState(null);
  const [editForm, setEditForm]         = useState({ interest: 'Medium', feedback: '' });
  const [editSaving, setEditSaving]     = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('All');

  const userId  = user?.uid || user?.id;
  const myLeads = useMemo(() => leads.filter(l => l.assignedTo === userId || l.assigned_to === userId), [leads, userId]);
  const myVisits = useMemo(() =>
    siteVisits.filter(v => v.employeeId === userId)
      .sort((a, b) => new Date(b.timestamp || b.visitDate) - new Date(a.timestamp || a.visitDate)),
    [siteVisits, userId]
  );

  // Pre-select lead from URL
  useEffect(() => {
    const id = searchParams.get('leadId');
    if (id && leads.length > 0) {
      const lead = leads.find(l => l.id === id);
      if (lead && (lead.assignedTo === userId || lead.assigned_to === userId)) {
        setFormData(prev => ({ ...prev, leadId: id }));
        toast({ title: '✅ Lead Pre-selected', description: `${lead.name} is ready`, duration: 3000 });
      }
    }
  }, [searchParams, leads, userId]);

  // Stats
  const highCount   = myVisits.filter(v => (v.interest || extractInterest(v.notes)) === 'High').length;
  const medCount    = myVisits.filter(v => (v.interest || extractInterest(v.notes)) === 'Medium').length;

  // Filtered history
  const filteredVisits = useMemo(() => {
    const q = historySearch.toLowerCase();
    return myVisits.filter(v => {
      const matchSearch = !q || v.leadName?.toLowerCase().includes(q) || v.projectName?.toLowerCase().includes(q);
      const interest    = v.interest || extractInterest(v.notes) || 'Medium';
      const matchFilter = historyFilter === 'All' || interest === historyFilter;
      return matchSearch && matchFilter;
    });
  }, [myVisits, historySearch, historyFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leadId)    return toast({ title: 'Select a lead', variant: 'destructive' });
    if (!formData.date)      return toast({ title: 'Visit date required', variant: 'destructive' });
    if (!formData.feedback.trim()) return toast({ title: 'Add client feedback', variant: 'destructive' });

    setSubmitting(true);
    try {
      const lead        = myLeads.find(l => l.id === formData.leadId);
      const visitDateObj = new Date(formData.date);
      const result = await addSiteVisitLog({
        leadId:        formData.leadId,
        employeeId:    userId,
        leadName:      lead?.name    || 'Unknown',
        projectName:   lead?.project || 'General',
        visitDate:     visitDateObj.toISOString().split('T')[0],
        visitTime:     visitDateObj.toTimeString().slice(0, 5),
        status:        'Completed',
        interestLevel: formData.interest,
        notes:         `[Interest: ${formData.interest}] ${formData.feedback.trim()}`,
        feedback:      formData.feedback.trim(),
        location:      lead?.project || '',
        duration:      null,
      });
      if (result) {
        toast({ title: '✅ Site Visit Logged!', description: `${lead?.name} — ${formData.interest} interest` });
        setFormData({ leadId: '', date: '', interest: 'Medium', feedback: '' });
      } else {
        toast({ title: '❌ Save failed', description: 'Check Supabase logs', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const openEdit = (visit) => {
    setEditingVisit(visit);
    setEditForm({
      interest: visit.interest || extractInterest(visit.notes) || 'Medium',
      feedback: extractFeedback(visit.notes) || visit.feedback || '',
    });
  };

  const handleEditSave = async () => {
    if (!editForm.feedback.trim()) return toast({ title: 'Feedback cannot be empty', variant: 'destructive' });
    if (!updateSiteVisit)          return toast({ title: 'updateSiteVisit not available', variant: 'destructive' });
    setEditSaving(true);
    try {
      await updateSiteVisit(editingVisit.id, {
        interest:      editForm.interest,
        interestLevel: editForm.interest,
        notes:         `[Interest: ${editForm.interest}] ${editForm.feedback.trim()}`,
        feedback:      editForm.feedback.trim(),
      });
      toast({ title: '✅ Visit updated!' });
      setEditingVisit(null);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setEditSaving(false);
  };

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-[#F8F9FB] p-3 md:p-5 pb-24" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Page Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h1 className="text-xl font-black text-[#0F3A5F] flex items-center gap-2">
            <MapPin size={20} className="text-[#1B6CA8]" />Site Visit Tracker
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Visits sync to admin in real-time</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Wifi size={12} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-600">Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard icon={MapPin}       label="Total Visits" value={myVisits.length}  color="#1B6CA8" />
        <StatCard icon={Flame}        label="High Interest" value={highCount}        color="#EF4444" />
        <StatCard icon={Wind}         label="Considering"   value={medCount}         color="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ════════════════════════════════ */}
        {/*  LOG FORM                        */}
        {/* ════════════════════════════════ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#0F3A5F] to-[#1B6CA8]" />
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <MapPin size={14} className="text-[#1B6CA8]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-800">Log New Visit</h2>
                <p className="text-[10px] text-gray-400">{myLeads.length} leads assigned to you</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">

              {/* Lead Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Lead *</label>
                <LeadPicker leads={myLeads} value={formData.leadId}
                  onChange={id => setFormData({ ...formData, leadId: id })} />
                {formData.leadId && (() => {
                  const l = myLeads.find(x => x.id === formData.leadId);
                  return l ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <Building2 size={12} className="text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-blue-700 font-medium">
                        {l.project || 'No project'}{l.phone ? ` · ${l.phone}` : ''}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <Calendar size={11} />Visit Date & Time *
                </label>
                <Input type="datetime-local" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="h-10 rounded-xl border-gray-200 text-sm" />
              </div>

              {/* Interest Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp size={11} />Client Interest Level
                </label>
                <InterestToggle value={formData.interest} onChange={v => setFormData({ ...formData, interest: v })} />
              </div>

              {/* Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Client Feedback *</label>
                <Textarea value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="What did the client say after visiting the site?"
                  rows={4} className="rounded-xl border-gray-200 text-sm resize-none" />
              </div>

              <Button type="submit" disabled={submitting}
                className="w-full h-11 rounded-xl font-black text-sm bg-[#0F3A5F] hover:bg-[#0a2d4d] text-white shadow-sm">
                {submitting
                  ? <><Loader2 size={16} className="animate-spin mr-2" />Saving…</>
                  : '📍  Save Visit Log'}
              </Button>
            </form>
          </div>
        </div>

        {/* ════════════════════════════════ */}
        {/*  VISIT HISTORY                  */}
        {/* ════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-3">

          {/* History Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-gray-800">Visit History</h2>
              <div className="flex items-center gap-1.5">
                {siteVisitsLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
                <span className="text-[11px] text-gray-400 font-medium">{filteredVisits.length} of {myVisits.length}</span>
              </div>
            </div>
            {/* Search + Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search lead or project…"
                  className="w-full pl-8 pr-7 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-gray-50" />
                {historySearch && (
                  <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X size={12} className="text-gray-400" />
                  </button>
                )}
              </div>
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium text-gray-600 focus:ring-2 focus:ring-blue-100">
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          {/* Cards */}
          {filteredVisits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center py-14 text-gray-400">
              <MapPin size={32} className="mb-2 text-gray-200" />
              <p className="text-sm font-semibold">
                {myVisits.length === 0 ? 'No visits logged yet' : 'No results match your filter'}
              </p>
              <p className="text-xs mt-1 text-gray-300">
                {myVisits.length === 0 ? 'Log your first visit using the form' : 'Try clearing the search'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredVisits.map((visit, i) => (
                <VisitCard key={visit.id || i} visit={visit} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════ */}
      {/*  EDIT MODAL                     */}
      {/* ════════════════════════════════ */}
      {editingVisit && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]" onClick={() => setEditingVisit(null)} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              {/* Modal Header */}
              <div className="h-1 bg-gradient-to-r from-[#0F3A5F] to-[#1B6CA8]" />
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#0F3A5F] text-base">Edit Visit</h3>
                  <p className="text-xs text-gray-400">{editingVisit.leadName} · {editingVisit.projectName}</p>
                </div>
                <button onClick={() => setEditingVisit(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
                  <X size={15} className="text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Interest */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Interest Level</label>
                  <InterestToggle value={editForm.interest} onChange={v => setEditForm(prev => ({ ...prev, interest: v }))} />
                </div>

                {/* Feedback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Client Feedback</label>
                  <Textarea value={editForm.feedback}
                    onChange={e => setEditForm(prev => ({ ...prev, feedback: e.target.value }))}
                    rows={4} placeholder="Update client feedback…"
                    className="rounded-xl border-gray-200 text-sm resize-none" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold"
                    onClick={() => setEditingVisit(null)} disabled={editSaving}>
                    Cancel
                  </Button>
                  <Button className="flex-1 h-11 rounded-xl font-black bg-[#0F3A5F] hover:bg-[#0a2d4d] text-white"
                    onClick={handleEditSave} disabled={editSaving}>
                    {editSaving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SiteVisits;
