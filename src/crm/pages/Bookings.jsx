import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Search, X, CheckCircle2, Clock, IndianRupee,
  CalendarDays, StickyNote, ChevronDown, User,
  Building2, BookOpen, TrendingUp, AlertCircle
} from 'lucide-react';

/* ─── helpers ─── */
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const statusMeta = {
  Pending:  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  Partial:  { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  Complete: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
};
const StatusBadge = ({ s }) => {
  const m = statusMeta[s] || statusMeta.Pending;
  return (
    <span style={{ background: m.bg, color: m.text }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold">
      <span style={{ background: m.dot }} className="w-1.5 h-1.5 rounded-full" />
      {s}
    </span>
  );
};

/* ─────────────────────────────────────────────────────── */
/*  LIVE-SEARCH LEAD PICKER                                */
/* ─────────────────────────────────────────────────────── */
const LeadPicker = ({ leads, value, onChange }) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const inputRef            = useRef(null);
  const containerRef        = useRef(null);

  const selected = leads.find(l => l.id === value);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return leads.slice(0, 50); // show first 50 when no query
    return leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.project?.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [leads, query]);

  const handleSelect = (lead) => {
    onChange(lead.id);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      {!open ? (
        <button type="button" onClick={handleOpen}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all
            ${ selected
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300'
            }`}>
          <div className="flex items-center gap-2 min-w-0">
            <User size={14} className={selected ? 'text-blue-500 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
            {selected ? (
              <span className="truncate font-semibold text-gray-900">
                {selected.name}
                <span className="text-gray-400 font-normal ml-1.5 text-xs">{selected.phone}</span>
              </span>
            ) : (
              <span>Search lead by name, phone, project…</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selected && (
              <span onClick={handleClear}
                className="p-0.5 rounded hover:bg-blue-200 transition">
                <X size={13} className="text-blue-400" />
              </span>
            )}
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </button>
      ) : (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Type name, phone or project… (${leads.length} leads)`}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-blue-400 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          />
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Hint bar */}
          <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-medium">
              {query ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}` : `Showing ${filtered.length} of ${leads.length}`}
            </span>
            <button type="button" onClick={() => setOpen(false)}
              className="text-[10px] text-gray-400 hover:text-gray-600 font-medium">
              Close ✕
            </button>
          </div>

          {/* List */}
          <ul className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <li className="flex flex-col items-center py-8 text-gray-400">
                <AlertCircle size={24} className="mb-2 text-gray-300" />
                <p className="text-sm font-medium">No leads found</p>
                <p className="text-xs mt-0.5">Try a different name or phone</p>
              </li>
            ) : (
              filtered.map(lead => (
                <li key={lead.id}>
                  <button type="button" onClick={() => handleSelect(lead)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-blue-50 active:bg-blue-100 transition-colors
                      ${value === lead.id ? 'bg-blue-50' : ''}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#0F3A5F,#1B6CA8)' }}>
                      {(lead.name || 'L').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {lead.phone}{lead.project ? ` · ${lead.project}` : ''}
                      </p>
                    </div>
                    {value === lead.id && <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────── */
/*  STAT CARD                                              */
/* ─────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color + '20' }}>
      <Icon size={17} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-base font-black text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                         */
/* ─────────────────────────────────────────────────────── */
const Bookings = () => {
  const { user }                          = useAuth();
  const { leads, addBookingLog, bookings } = useCRMData();
  const { toast }                         = useToast();

  const [formData, setFormData] = useState({
    leadId: '', date: '', amount: '', status: 'Pending', notes: ''
  });
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('All');

  const myLeads    = useMemo(() => leads.filter(l => l.assignedTo === user?.id), [leads, user]);
  const myBookings = useMemo(() =>
    bookings
      .filter(b => b.employeeId === user?.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [bookings, user]
  );

  // Stats
  const totalRev  = myBookings.reduce((s, b) => s + Number(b.amount || 0), 0);
  const completed = myBookings.filter(b => b.status === 'Complete').length;
  const pending   = myBookings.filter(b => b.status === 'Pending').length;

  // Filtered table
  const filteredBookings = useMemo(() => {
    const q = tableSearch.toLowerCase();
    return myBookings.filter(b => {
      const matchSearch = !q ||
        b.leadName?.toLowerCase().includes(q) ||
        b.projectName?.toLowerCase().includes(q);
      const matchStatus = tableStatus === 'All' || b.status === tableStatus;
      return matchSearch && matchStatus;
    });
  }, [myBookings, tableSearch, tableStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.leadId)
      return toast({ title: 'Select a lead', description: 'Please search and pick a lead first', variant: 'destructive' });
    if (!formData.date)
      return toast({ title: 'Date required', description: 'Please pick a booking date', variant: 'destructive' });
    if (!formData.amount || Number(formData.amount) <= 0)
      return toast({ title: 'Amount required', description: 'Enter a valid amount', variant: 'destructive' });

    const lead = myLeads.find(l => l.id === formData.leadId);
    addBookingLog({
      ...formData,
      employeeId: user.id,
      leadName: lead?.name || 'Unknown',
      projectName: lead?.project || 'General',
    });
    toast({ title: '🎉 Booking Logged!', description: `${lead?.name} — ₹${fmt(formData.amount)}` });
    setFormData({ leadId: '', date: '', amount: '', status: 'Pending', notes: '' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-3 md:p-5 pb-24" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Page Title ── */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-[#0F3A5F] flex items-center gap-2">
          <BookOpen size={20} className="text-[#1B6CA8]" />
          Booking Tracker
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Log and review your property bookings</p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard icon={IndianRupee}  label="Total Rev"  value={`₹${fmt(totalRev)}`}   color="#059669" />
        <StatCard icon={CheckCircle2} label="Completed"  value={completed}               color="#1D4ED8" />
        <StatCard icon={Clock}        label="Pending"    value={pending}                  color="#D97706" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ════════════════════════════════ */}
        {/*   NEW BOOKING FORM              */}
        {/* ════════════════════════════════ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Form Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                <TrendingUp size={14} className="text-[#1B6CA8]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-800">New Booking</h2>
                <p className="text-[10px] text-gray-400">{myLeads.length} leads assigned to you</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">

              {/* ── Lead Picker ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Lead *</label>
                <LeadPicker
                  leads={myLeads}
                  value={formData.leadId}
                  onChange={(id) => setFormData({ ...formData, leadId: id })}
                />
                {formData.leadId && (() => {
                  const l = myLeads.find(x => x.id === formData.leadId);
                  return l ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                      <Building2 size={12} className="text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-blue-700 font-medium">
                        {l.project || 'No project'}
                        {l.phone ? ` · ${l.phone}` : ''}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* ── Date ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <CalendarDays size={11} /> Booking Date *
                </label>
                <Input type="date" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="h-10 rounded-xl border-gray-200 text-sm" />
              </div>

              {/* ── Amount ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <IndianRupee size={11} /> Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                  <Input type="number" placeholder="0"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="h-10 pl-7 rounded-xl border-gray-200 text-sm" />
                </div>
              </div>

              {/* ── Payment Status ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Payment Status</label>
                <div className="flex gap-2">
                  {['Pending', 'Partial', 'Complete'].map(s => {
                    const m = statusMeta[s];
                    const active = formData.status === s;
                    return (
                      <button key={s} type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        style={active ? { background: m.bg, color: m.text, border: `1.5px solid ${m.dot}` } : {}}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          active ? '' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                        }`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Notes ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <StickyNote size={11} /> Notes
                </label>
                <Textarea placeholder="Optional remarks about this booking…"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="rounded-xl border-gray-200 text-sm min-h-[72px] resize-none" />
              </div>

              <Button type="submit"
                className="w-full h-11 rounded-xl font-black text-sm bg-[#059669] hover:bg-[#047857] text-white shadow-sm">
                ✅  Submit Booking
              </Button>
            </form>
          </div>
        </div>

        {/* ════════════════════════════════ */}
        {/*   BOOKINGS TABLE               */}
        {/* ════════════════════════════════ */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Table Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-sm font-black text-gray-800">My Bookings</h2>
                <span className="text-[11px] text-gray-400 font-medium">
                  {filteredBookings.length} of {myBookings.length}
                </span>
              </div>
              {/* Search + Filter row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder="Search lead or project…"
                    className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-gray-50" />
                  {tableSearch && (
                    <button onClick={() => setTableSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X size={13} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <select value={tableStatus} onChange={e => setTableStatus(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100 font-medium text-gray-600">
                  <option>All</option>
                  <option>Pending</option>
                  <option>Partial</option>
                  <option>Complete</option>
                </select>
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-gray-400">
                  <BookOpen size={32} className="mb-2 text-gray-200" />
                  <p className="text-sm font-semibold">
                    {myBookings.length === 0 ? 'No bookings yet' : 'No results match your filter'}
                  </p>
                  <p className="text-xs mt-0.5">
                    {myBookings.length === 0 ? 'Submit your first booking using the form' : 'Try clearing the search'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Lead', 'Project', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                              style={{ background: 'linear-gradient(135deg,#0F3A5F,#1B6CA8)' }}>
                              {(b.leadName || 'L').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900 text-xs whitespace-nowrap">{b.leadName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{b.projectName || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-black text-gray-900">₹{fmt(b.amount)}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge s={b.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
