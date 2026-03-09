// src/crm/pages/LeadDetail.jsx
// Lead detail page — mobile-first, all actions via bottom sheet
// BOOKING FLOW: Full booking form bottom sheet with token, partial payment, unit number
// Design: #0F3A5F primary, #D4AF37 gold accent, emerald success
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format, isToday, isPast, formatDistanceToNow } from 'date-fns';

// ✅ Parse YYYY-MM-DD as LOCAL midnight to avoid UTC timezone drift
const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};
import SmartNotesInput from '@/crm/components/SmartNotesInput';
import {
  ArrowLeft, Phone, MessageCircle, Edit, ChevronRight,
  Clock, CheckCircle, X, Calendar, AlertCircle,
  FileText, ChevronDown, ChevronUp, PhoneCall, Copy,
  MapPin, Target, Loader2, Mail, Trophy, Building2,
  IndianRupee, CreditCard, Hash, StickyNote
} from 'lucide-react';

const CALL_OUTCOMES = [
  { id: 'Not Answered',  label: 'No Answer',    emoji: '📵', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'Busy',          label: 'Busy',         emoji: '🔴', cls: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'Connected',     label: 'Connected',    emoji: '✅', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'Switched Off',  label: 'Switched Off', emoji: '📴', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const LEAD_STATUSES = [
  { id: 'FollowUp',      label: 'Follow Up',       emoji: '📅' },
  { id: 'SiteVisit',     label: 'Site Visit',      emoji: '📍' },
  { id: 'NotInterested', label: 'Not Interested',  emoji: '❌' },
  { id: 'CallBackLater', label: 'Call Back Later', emoji: '🔄' },
];

const QUICK_TAGS = [
  { label: '💰 Price Issue',      value: '#PriceIssue' },
  { label: '📅 Callback',         value: '#Callback' },
  { label: '🏠 Site Visit?',      value: '#SiteVisit' },
  { label: '👨‍👩‍👧 Family Decision', value: '#FamilyDecision' },
  { label: '🏦 Loan Needed',      value: '#LoanNeeded' },
  { label: '✅ Very Interested',  value: '#VeryInterested' },
  { label: '⏰ Not Available',    value: '#NotAvailable' },
  { label: '🔄 Follow Up',        value: '#FollowUp' },
];

const PAYMENT_MODES = ['Cash', 'Cheque', 'NEFT', 'UPI'];

const statusCfg = {
  New:           { bg: 'bg-blue-100',    text: 'text-blue-800' },
  Open:          { bg: 'bg-sky-100',     text: 'text-sky-800' },
  FollowUp:      { bg: 'bg-amber-100',   text: 'text-amber-800' },
  SiteVisit:     { bg: 'bg-purple-100',  text: 'text-purple-800' },
  Booked:        { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  NotInterested: { bg: 'bg-gray-100',    text: 'text-gray-700' },
  Lost:          { bg: 'bg-red-100',     text: 'text-red-800' },
  CallBackLater: { bg: 'bg-indigo-100',  text: 'text-indigo-800' },
};
const interestCfg = {
  Hot:  { bg: 'bg-red-100',    text: 'text-red-700' },
  Warm: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Cold: { bg: 'bg-blue-100',   text: 'text-blue-700' },
};

const timeAgo = (ts) => {
  if (!ts) return '';
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }); } catch { return ''; }
};

const formatPhone = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0,5)}-${d.slice(5)}`;
  if (d.length > 10) return `+${d.slice(0, d.length-10)}-${d.slice(-10,-5)}-${d.slice(-5)}`;
  return p;
};

const formatINR = (val) => {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${n.toLocaleString('en-IN')}`;
  return `₹${n}`;
};

const LeadDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const {
    leads, leadsLoading, calls, siteVisits, bookings,
    addLeadNote, updateLead, addCallLog, addSiteVisitLog, addBookingLog
  } = useCRMData();
  const { toast }  = useToast();

  const [showSheet, setShowSheet]               = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [outcome, setOutcome]                   = useState('');
  const [leadStatus, setLeadStatus]             = useState('');
  const [followDate, setFollowDate]             = useState('');
  const [quickNote, setQuickNote]               = useState('');
  const [saving, setSaving]                     = useState(false);
  const [showNotes, setShowNotes]               = useState(false);
  const [showHistory, setShowHistory]           = useState(true);
  const [newNote, setNewNote]                   = useState('');
  const [addingNote, setAddingNote]             = useState(false);
  const [copiedPhone, setCopiedPhone]           = useState(false);
  const [bookingSaving, setBookingSaving]       = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    bookingAmount: '',
    tokenAmount: '',
    partialPayment: '',
    unitNumber: '',
    paymentMode: 'Cash',
    notes: '',
  });

  const lead       = leads.find(l => l.id === id);
  const leadCalls  = useMemo(() =>
    (calls || []).filter(c => c.lead_id === id || c.leadId === id)
      .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)),
    [calls, id]
  );
  const leadVisits = useMemo(() =>
    (siteVisits || []).filter(v => v.lead_id === id || v.leadId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [siteVisits, id]
  );
  const leadBookings = useMemo(() =>
    (bookings || []).filter(b => b.lead_id === id || b.leadId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [bookings, id]
  );

  // Combined timeline
  const timeline = useMemo(() => {
    const items = [];
    leadCalls.forEach(c => items.push({
      type: 'call', status: c.status, notes: c.notes, employee: c.employee_name,
      time: c.created_at || c.timestamp, duration: c.duration,
    }));
    leadVisits.forEach(v => items.push({
      type: 'visit', status: v.status, notes: v.notes || v.feedback,
      employee: v.employee_name, time: v.timestamp, location: v.location,
    }));
    leadBookings.forEach(b => items.push({
      type: 'booking', notes: b.notes, amount: b.amount,
      employee: b.employee_name, time: b.timestamp, unit: b.unitNumber,
    }));
    return items.sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [leadCalls, leadVisits, leadBookings]);

  useEffect(() => {
    if (!leadsLoading && !lead) {
      toast({ title: 'Lead not found', variant: 'destructive' });
      navigate('/crm/sales/my-leads');
    }
  }, [lead, leadsLoading, navigate, toast]);

  // Lock body scroll when any sheet open
  useEffect(() => {
    document.body.style.overflow = (showSheet || showBookingSheet) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSheet, showBookingSheet]);

  if (leadsLoading || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F3A5F]" />
      </div>
    );
  }

  const userId = user?.id || user?.uid;
  const sc = statusCfg[lead.status] || statusCfg.New;
  const ic = interestCfg[lead.interestLevel || lead.interest_level] || interestCfg.Cold;
  const followUpRaw = lead.follow_up_date || lead.followUpDate;
  const isBooked = lead.status === 'Booked';
  let isOverdue = false, isFollowToday = false;
  try {
    const fuDate = parseLocalDate(followUpRaw);
    isOverdue     = fuDate && isPast(fuDate) && !isToday(fuDate);
    isFollowToday = fuDate && isToday(fuDate);
  } catch { /* ignore */ }
  const today = new Date().toISOString().split('T')[0];

  // ── Save Log Call ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!outcome) { toast({ title: 'Select call outcome first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await addCallLog({
        leadId: id, leadName: lead.name, projectName: lead.project || '',
        employeeId: userId, employeeName: user?.name || '',
        type: 'Outgoing', status: outcome, duration: 0,
        notes: quickNote || null,
      });
      const patch = { last_activity: new Date().toISOString() };
      if (leadStatus) patch.status = leadStatus;
      if (leadStatus === 'NotInterested') {
        patch.follow_up_date = null;
        patch.followUpDate = null;
        setFollowDate('');
      } else if (followDate) {
        patch.follow_up_date = followDate;
        patch.followUpDate = followDate;
      }
      await updateLead(id, patch);
      if (quickNote) await addLeadNote(id, quickNote, user?.name || 'User');
      if (leadStatus === 'SiteVisit' && followDate) {
        await addSiteVisitLog({
          leadId: id, leadName: lead.name, projectName: lead.project || '',
          employeeId: userId, employeeName: user?.name || '',
          visitDate: followDate, status: 'Scheduled', notes: quickNote || null,
        });
      }
      toast({ title: 'Logged!', description: leadStatus ? `Status → ${leadStatus}` : 'Call saved' });
      setShowSheet(false);
      setOutcome(''); setLeadStatus(''); setFollowDate(''); setQuickNote('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  // ── Save Booking ─────────────────────────────────────────────────────
  const handleBooking = async () => {
    const { bookingAmount, tokenAmount, unitNumber } = bookingForm;
    if (!bookingAmount || Number(bookingAmount) <= 0) {
      toast({ title: 'Enter booking amount', variant: 'destructive' }); return;
    }
    if (!tokenAmount || Number(tokenAmount) <= 0) {
      toast({ title: 'Enter token amount collected', variant: 'destructive' }); return;
    }
    if (!unitNumber.trim()) {
      toast({ title: 'Enter unit number', variant: 'destructive' }); return;
    }
    setBookingSaving(true);
    try {
      await addBookingLog({
        leadId: id, leadName: lead.name, projectName: lead.project || '',
        employeeId: userId, employeeName: user?.name || '',
        bookingAmount:  parseFloat(bookingForm.bookingAmount),
        tokenAmount:    parseFloat(bookingForm.tokenAmount),
        partialPayment: parseFloat(bookingForm.partialPayment || 0),
        unitNumber:    bookingForm.unitNumber,
        paymentMode:   bookingForm.paymentMode,
        paymentStatus: bookingForm.partialPayment ? 'Partial' : 'Pending',
        bookingDate:   new Date().toISOString().split('T')[0],
        notes:         bookingForm.notes || '',
      });
      toast({ title: '🏆 Booking confirmed!', description: `Unit ${bookingForm.unitNumber} booked for ${formatINR(bookingForm.bookingAmount)}` });
      setShowBookingSheet(false);
      setBookingForm({ bookingAmount: '', tokenAmount: '', partialPayment: '', unitNumber: '', paymentMode: 'Cash', notes: '' });
    } catch (e) {
      toast({ title: 'Booking failed', description: e.message, variant: 'destructive' });
    }
    setBookingSaving(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await addLeadNote(id, newNote, user?.name || 'User');
    setNewNote('');
    toast({ title: 'Note saved' });
    setAddingNote(false);
  };

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(lead.phone).then(() => {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1500);
    });
  };

  const updateBookingField = (field, value) => setBookingForm(prev => ({ ...prev, [field]: value }));

  const appendTag = (tagValue) => {
    setQuickNote(prev => {
      const sep = prev && !prev.endsWith(' ') ? ' ' : '';
      return (prev + sep + tagValue).slice(0, 500);
    });
  };

  return (
    // ✅ pb-40 on mobile to clear both: action bar (56px) + MobileBottomNav (64px) + gap
    // ✅ pb-24 on desktop since there is no bottom nav
    <div className="min-h-screen bg-gray-50 pb-40 md:pb-24">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 -ml-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 touch-manipulation">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0F3A5F] text-base truncate leading-tight">{lead.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{lead.status || 'New'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ic.bg} ${ic.text}`}>{lead.interestLevel || lead.interest_level || 'Cold'}</span>
          </div>
        </div>
        <button onClick={() => navigate(`/crm/sales/edit-lead/${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 active:bg-gray-200 touch-manipulation">
          <Edit size={13} /> Edit
        </button>
      </div>

      {/* ── BOOKED Banner ── */}
      {isBooked && (
        <div className="mx-3 mt-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2.5">
              <Trophy size={24} className="text-yellow-300" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black tracking-wide">BOOKED</p>
              <p className="text-emerald-100 text-xs">Congratulations! This lead has been converted.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/20">
            {lead.unitNumber && (
              <div><p className="text-[10px] text-emerald-200 uppercase">Unit</p><p className="text-sm font-bold">{lead.unitNumber}</p></div>
            )}
            {(lead.tokenAmount > 0) && (
              <div><p className="text-[10px] text-emerald-200 uppercase">Token</p><p className="text-sm font-bold">{formatINR(lead.tokenAmount)}</p></div>
            )}
            {(lead.bookingAmount > 0) && (
              <div><p className="text-[10px] text-emerald-200 uppercase">Booking</p><p className="text-sm font-bold">{formatINR(lead.bookingAmount)}</p></div>
            )}
          </div>
        </div>
      )}

      {/* ── Contact Card ── */}
      <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isOverdue && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              <AlertCircle size={10} /> Overdue
            </span>
          )}
          {isFollowToday && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              <Clock size={10} /> Follow-up Today
            </span>
          )}
        </div>

        {/* Tap to call */}
        <a href={`tel:${lead.phone}`}
          className="flex items-center gap-3 bg-[#0F3A5F] text-white rounded-2xl px-4 py-3.5 mb-3 active:bg-[#0a2d4f] touch-manipulation transition-all">
          <div className="bg-white/20 rounded-full p-2"><Phone size={18} /></div>
          <div className="flex-1">
            <p className="text-[11px] text-blue-200">Tap to Call</p>
            <p className="text-xl font-black tracking-wide">{formatPhone(lead.phone)}</p>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyPhone(); }}
            className="bg-white/20 rounded-full p-2 active:bg-white/30 transition">
            {copiedPhone ? <CheckCircle size={16} /> : <Copy size={16} />}
          </button>
        </a>

        {followUpRaw && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-3 font-medium ${
            isOverdue ? 'bg-red-50 text-red-700' : isFollowToday ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>
            <Calendar size={14} />
            Follow-up: {format(parseLocalDate(followUpRaw), 'EEE, dd MMM yyyy')}
          </div>
        )}

        {/* Action row — WhatsApp + Email + Log Call (desktop inline only) */}
        <div className="grid grid-cols-3 gap-2">
          <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`}
            target="_blank" rel="noreferrer"
            className="flex flex-col items-center gap-1 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold active:bg-emerald-100 touch-manipulation">
            <MessageCircle size={18} /> WhatsApp
          </a>
          {lead.email && lead.email !== 'Not given' ? (
            <a href={`mailto:${lead.email}`}
              className="flex flex-col items-center gap-1 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs font-semibold active:bg-blue-100 touch-manipulation">
              <Mail size={18} /> Email
            </a>
          ) : <div />}
          {/* Log Call inline — desktop only */}
          <button
            onClick={() => setShowSheet(true)}
            className="hidden md:flex items-center justify-center gap-2 py-3 bg-[#0F3A5F] rounded-xl text-white text-sm font-bold active:bg-[#0a2d4f] shadow-sm touch-manipulation transition-all">
            <PhoneCall size={18} /> Log Call
          </button>
        </div>
      </div>

      {/* ── Lead Details Grid ── */}
      <div className="bg-white mx-3 mt-2 rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Details</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Budget',  value: lead.budget || '—',   icon: '💰' },
            { label: 'Project', value: lead.project || 'Not set',  icon: '🏗️' },
            { label: 'Source',  value: lead.source || '—',   icon: '📌' },
            { label: 'Email',   value: lead.email || 'Not given',  icon: '✉️' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{item.icon} {item.value}</p>
            </div>
          ))}
        </div>
        {isBooked && (lead.tokenAmount > 0 || lead.partialPayment > 0) && (
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            {lead.partialPayment > 0 && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-[10px] text-amber-600 uppercase tracking-wide">Partial Payment</p>
                <p className="text-sm font-semibold text-amber-800 mt-0.5">{formatINR(lead.partialPayment)}</p>
              </div>
            )}
            {(lead.bookingAmount - lead.tokenAmount - (lead.partialPayment || 0)) > 0 && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-[10px] text-red-600 uppercase tracking-wide">Pending</p>
                <p className="text-sm font-semibold text-red-800 mt-0.5">
                  {formatINR(lead.bookingAmount - lead.tokenAmount - (lead.partialPayment || 0))}
                </p>
              </div>
            )}
          </div>
        )}
        {(lead.assignedToName || lead.assigned_to_name) && (
          <p className="text-[10px] text-gray-300 mt-3">
            Assigned by {lead.assignedToName || lead.assigned_to_name}
            {(lead.assignedAt || lead.assigned_at) && ` · ${timeAgo(lead.assignedAt || lead.assigned_at)}`}
          </p>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="mx-3 mt-2 grid grid-cols-3 gap-2">
        {[
          { label: 'Calls',     value: leadCalls.length,  color: 'text-blue-600', icon: Phone },
          { label: 'Connected', value: leadCalls.filter(c => ['Connected','connected','interested'].includes(c.status)).length, color: 'text-emerald-600', icon: CheckCircle },
          { label: 'Visits',    value: leadVisits.length, color: 'text-purple-600', icon: MapPin },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Activity Timeline ── */}
      <div className="bg-white mx-3 mt-2 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 touch-manipulation">
          <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Clock size={13} /> Activity Timeline ({timeline.length})
          </span>
          {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showHistory && (
          <div className="px-4 pb-4 border-t border-gray-50">
            {timeline.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock size={20} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400">No activity yet. Make your first call!</p>
              </div>
            ) : (
              <div className="space-y-0 mt-3">
                {timeline.slice(0, 10).map((item, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {i < timeline.length - 1 && i < 9 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100" />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      item.type === 'call'
                        ? (['Connected','connected','interested'].includes(item.status) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500')
                        : item.type === 'visit' ? 'bg-purple-100 text-purple-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {item.type === 'call' ? <Phone size={13} />
                        : item.type === 'visit' ? <MapPin size={13} />
                        : <Target size={13} />}
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <p className="text-xs font-semibold text-gray-800 capitalize">
                        {item.type === 'call'    ? (item.status?.replace(/_/g, ' ') || 'Call')
                          : item.type === 'visit' ? `Visit - ${item.status || 'Scheduled'}`
                          : `Booking${item.amount ? ` - ${formatINR(item.amount)}` : ''}`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {item.time ? format(new Date(item.time), 'dd MMM yyyy, h:mm a') : '—'}
                        {item.employee ? ` · ${item.employee}` : ''}
                      </p>
                      {item.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Notes Section ── */}
      <div className="bg-white mx-3 mt-2 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between px-4 py-3 touch-manipulation">
          <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <FileText size={13} /> Notes
          </span>
          {showNotes ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showNotes && (
          <div className="px-4 pb-4 border-t border-gray-50 space-y-3">
            {lead.notes && (
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-900 mt-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{lead.notes}</div>
            )}
            <div className="mt-2">
              <SmartNotesInput
                value={newNote}
                onChange={setNewNote}
                existingNotes={lead.notes || ''}
                placeholder="Add a note..."
                rows={2}
                maxLength={500}
                onSuggestionAccept={(actions) => {
                  if (actions.suggestStatus) {
                    toast({ title: 'Suggestion', description: `Consider changing status to "${actions.suggestStatus}"` });
                  }
                  if (actions.suggestFollowUp && typeof actions.suggestFollowUp === 'number') {
                    const d = new Date(); d.setDate(d.getDate() + actions.suggestFollowUp);
                    toast({ title: 'Follow-up suggested', description: `Set follow-up for ${d.toLocaleDateString('en-IN')}` });
                  }
                }}
              />
            </div>
            <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
              className="w-full py-2.5 bg-[#0F3A5F] text-white rounded-xl text-sm font-semibold disabled:opacity-40 active:bg-[#0a2d4f] transition-all touch-manipulation">
              {addingNote ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving...</span> : '+ Save Note'}
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/*                  FIXED BOTTOM ACTION BAR                        */}
      {/* ════════════════════════════════════════════════ */}
      {/*                                                                  */}
      {/* ✅ Mobile: bottom-16 → sits above MobileBottomNav (h-16 = 64px)  */}
      {/* ✅ Desktop: bottom-0 → no nav bar, anchors to viewport bottom      */}
      {/*                                                                  */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 px-4 py-3 flex gap-2">

        {/* Call */}
        <a href={`tel:${lead.phone}`}
          className="flex items-center justify-center gap-1.5 px-3 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold active:bg-emerald-100 touch-manipulation">
          <Phone size={15} /> Call
        </a>

        {/* WhatsApp icon-only */}
        <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-3 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl text-[#25D366] text-xs font-bold active:bg-[#25D366]/20 touch-manipulation">
          <MessageCircle size={15} />
        </a>

        {/* Log Call — mobile only; desktop uses inline card button above */}
        <button
          onClick={() => setShowSheet(true)}
          className="flex-1 md:hidden flex items-center justify-center gap-2 py-3 bg-[#0F3A5F] rounded-xl text-white text-sm font-bold active:bg-[#0a2d4f] touch-manipulation transition-all">
          <PhoneCall size={16} /> Log Call
        </button>

        {/* Book — always visible when not already booked */}
        {!isBooked && (
          <button
            onClick={() => setShowBookingSheet(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#D4AF37] rounded-xl text-[#0F3A5F] text-sm font-black shadow-md active:bg-[#c4a030] touch-manipulation transition-all">
            <Trophy size={16} /> Book
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* LOG CALL BOTTOM SHEET                                           */}
      {/* ════════════════════════════════════════════════ */}
      {showSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] touch-none" onClick={() => setShowSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl"
               style={{ maxHeight: '94vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pb-24">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-[#0F3A5F] text-lg leading-tight">{lead.name}</p>
                  <p className="text-xs text-gray-400">{formatPhone(lead.phone)} · Log call outcome</p>
                </div>
                <button onClick={() => setShowSheet(false)}
                  className="p-2 rounded-full bg-gray-100 active:bg-gray-200 touch-manipulation">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              {/* Step 1 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">1 · What happened on the call?</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CALL_OUTCOMES.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className={`flex items-center gap-2 px-3 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                      outcome === o.id ? 'border-[#0F3A5F] bg-[#0F3A5F] text-white shadow-lg scale-[1.02]' : `border ${o.cls}`
                    }`}>
                    <span className="text-lg">{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>

              {/* Step 2 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">2 · Update Lead Status</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {LEAD_STATUSES.map(s => (
                  <button key={s.id} onClick={() => {
                    setLeadStatus(leadStatus === s.id ? '' : s.id);
                    if (s.id === 'NotInterested') setFollowDate('');
                  }}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                      leadStatus === s.id ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0F3A5F] shadow-sm scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-700'
                    }`}>
                    <span>{s.emoji}</span> {s.label}
                  </button>
                ))}
              </div>

              {/* Step 3 - Hidden when NotInterested */}
              {leadStatus !== 'NotInterested' && (
                <>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {leadStatus === 'SiteVisit' ? '3 · Schedule Visit Date' : '3 · Follow-up Date (optional)'}
                  </p>
                  <div className="flex gap-2 mb-2">
                    {[{ label: 'Tomorrow', days: 1 }, { label: '3 Days', days: 3 }, { label: 'Next Week', days: 7 }].map(opt => {
                      const target = new Date(); target.setDate(target.getDate() + opt.days);
                      const targetStr = target.toISOString().split('T')[0];
                      return (
                        <button key={opt.label} onClick={() => setFollowDate(targetStr)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            followDate === targetStr ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'
                          }`}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <input type="date" min={today} value={followDate} onChange={e => setFollowDate(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#0F3A5F] mb-5" />
                </>
              )}

              {/* Step 4 */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">4 · Quick Note (optional)</p>
              <div className="mb-5">
                <SmartNotesInput
                  value={quickNote}
                  onChange={setQuickNote}
                  existingNotes={lead.notes || ''}
                  placeholder="What did the lead say? Any remarks..."
                  rows={3}
                  maxLength={500}
                  onSuggestionAccept={(actions) => {
                    if (actions.suggestStatus && !leadStatus) {
                      setLeadStatus(actions.suggestStatus);
                      toast({ title: 'Status suggested', description: `Set to "${actions.suggestStatus}"` });
                    }
                    if (actions.followUpDate && !followDate) {
                      setFollowDate(actions.followUpDate);
                    } else if (actions.suggestFollowUp && !followDate && typeof actions.suggestFollowUp === 'number') {
                      const d = new Date(); d.setDate(d.getDate() + actions.suggestFollowUp);
                      setFollowDate(d.toISOString().split('T')[0]);
                    }
                  }}
                />
              </div>

              <button onClick={handleSave} disabled={!outcome || saving}
                className="w-full py-4 bg-[#0F3A5F] text-white rounded-2xl text-base font-black disabled:opacity-40 active:bg-[#0a2d4f] shadow-xl touch-manipulation transition-all">
                {saving
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Saving...</span>
                  : 'Save & Update Lead'
                }
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* BOOKING BOTTOM SHEET                                            */}
      {/* ════════════════════════════════════════════════ */}
      {showBookingSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] touch-none" onClick={() => setShowBookingSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl"
               style={{ maxHeight: '94vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-4 pb-24">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-[#0F3A5F] text-lg leading-tight flex items-center gap-2">
                    <Trophy size={20} className="text-[#D4AF37]" /> Book This Lead
                  </p>
                  <p className="text-xs text-gray-400">{lead.name} · {lead.project || 'No project'}</p>
                </div>
                <button onClick={() => setShowBookingSheet(false)}
                  className="p-2 rounded-full bg-gray-100 active:bg-gray-200 touch-manipulation">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              {/* Payment Details */}
              <div className="bg-gradient-to-r from-[#0F3A5F]/5 to-[#D4AF37]/5 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-[#0F3A5F] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <IndianRupee size={12} /> Payment Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Booking Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                      <input type="number" placeholder="e.g. 5000000"
                        value={bookingForm.bookingAmount}
                        onChange={e => updateBookingField('bookingAmount', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37] transition" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Token Amount * (collected today)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                      <input type="number" placeholder="e.g. 100000"
                        value={bookingForm.tokenAmount}
                        onChange={e => updateBookingField('tokenAmount', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37] transition" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Partial Payment (optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                      <input type="number" placeholder="0"
                        value={bookingForm.partialPayment}
                        onChange={e => updateBookingField('partialPayment', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37] transition" />
                    </div>
                  </div>
                </div>
                {bookingForm.bookingAmount && bookingForm.tokenAmount && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Pending Amount</span>
                    <span className="text-sm font-bold text-red-600">
                      {formatINR(Math.max(0, Number(bookingForm.bookingAmount) - Number(bookingForm.tokenAmount) - Number(bookingForm.partialPayment || 0)))}
                    </span>
                  </div>
                )}
              </div>

              {/* Unit */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] font-black text-[#0F3A5F] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Building2 size={12} /> Unit Details
                </p>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Unit Number *</label>
                  <input type="text" placeholder="e.g. A-401, B-202"
                    value={bookingForm.unitNumber}
                    onChange={e => updateBookingField('unitNumber', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#D4AF37] transition" />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CreditCard size={12} /> Payment Mode
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_MODES.map(mode => (
                    <button key={mode} onClick={() => updateBookingField('paymentMode', mode)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all touch-manipulation ${
                        bookingForm.paymentMode === mode
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0F3A5F]'
                          : 'border-gray-100 bg-gray-50 text-gray-600'
                      }`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <StickyNote size={12} /> Notes (optional)
                </p>
                <textarea value={bookingForm.notes} onChange={e => updateBookingField('notes', e.target.value)}
                  placeholder="Any remarks about this booking..." rows={2}
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#D4AF37]" />
              </div>

              <button onClick={handleBooking} disabled={bookingSaving}
                className="w-full py-4 bg-[#D4AF37] text-[#0F3A5F] rounded-2xl text-base font-black disabled:opacity-40 active:bg-[#c4a030] shadow-xl touch-manipulation transition-all">
                {bookingSaving
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Processing...</span>
                  : <span className="flex items-center justify-center gap-2"><Trophy size={18} /> Confirm Booking</span>
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadDetail;