// src/crm/pages/LeadDetail.jsx
// ✅ Mobile-first redesign: Log Call is an inline bottom sheet (no page navigation)
// ✅ Combined Log Call + Update Status + Schedule Visit in ONE action
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { format, parseISO, isToday, isPast } from 'date-fns';
import {
  ArrowLeft, Phone, MessageCircle, Edit, ChevronRight,
  Clock, CheckCircle, X, Calendar, AlertCircle,
  FileText, ChevronDown, ChevronUp, PhoneCall
} from 'lucide-react';

const CALL_OUTCOMES = [
  { id: 'no_answer',    label: 'No Answer',    emoji: '📵', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  { id: 'busy',         label: 'Busy',         emoji: '🔴', cls: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'connected',    label: 'Connected ✅',  emoji: '✅', cls: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'switched_off', label: 'Switched Off', emoji: '📴', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const LEAD_STATUSES = [
  { id: 'FollowUp',      label: 'Follow Up',       emoji: '📅' },
  { id: 'SiteVisit',     label: 'Site Visit',      emoji: '📍' },
  { id: 'Booked',        label: 'Booked 🎉',       emoji: '💰' },
  { id: 'NotInterested', label: 'Not Interested',  emoji: '❌' },
  { id: 'CallBackLater', label: 'Call Back Later', emoji: '🔄' },
];

const statusCfg = {
  New:           { bg: 'bg-blue-100',   text: 'text-blue-800' },
  FollowUp:      { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  SiteVisit:     { bg: 'bg-purple-100', text: 'text-purple-800' },
  Booked:        { bg: 'bg-green-100',  text: 'text-green-800' },
  NotInterested: { bg: 'bg-gray-100',   text: 'text-gray-700' },
  Lost:          { bg: 'bg-red-100',    text: 'text-red-800' },
  CallBackLater: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
};
const interestCfg = {
  Hot:  { bg: 'bg-red-100',    text: 'text-red-700' },
  Warm: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Cold: { bg: 'bg-blue-100',   text: 'text-blue-700' },
};

const LeadDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { leads, leadsLoading, calls, siteVisits, addLeadNote, updateLead } = useCRMData();
  const { toast }  = useToast();

  const [showSheet, setShowSheet]       = useState(false);
  const [outcome, setOutcome]           = useState('');
  const [leadStatus, setLeadStatus]     = useState('');
  const [followDate, setFollowDate]     = useState('');
  const [quickNote, setQuickNote]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [showNotes, setShowNotes]       = useState(false);
  const [newNote, setNewNote]           = useState('');
  const [addingNote, setAddingNote]     = useState(false);

  const lead       = leads.find(l => l.id === id);
  const leadCalls  = (calls || []).filter(c => c.lead_id === id || c.leadId === id)
                      .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));
  const leadVisits = (siteVisits || []).filter(v => v.lead_id === id || v.leadId === id);

  useEffect(() => {
    if (!leadsLoading && !lead) {
      toast({ title: 'Lead not found', variant: 'destructive' });
      navigate('/crm/sales/my-leads');
    }
  }, [lead, leadsLoading]);

  // Lock body scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = showSheet ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSheet]);

  if (leadsLoading || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3A5F]" />
      </div>
    );
  }

  const sc = statusCfg[lead.status]   || statusCfg.New;
  const ic = interestCfg[lead.interestLevel] || interestCfg.Cold;
  const followUpRaw = lead.follow_up_date || lead.followUpDate;
  const isOverdue = followUpRaw && isPast(parseISO(followUpRaw)) && !isToday(parseISO(followUpRaw));
  const isFollowToday = followUpRaw && isToday(parseISO(followUpRaw));
  const today = new Date().toISOString().split('T')[0];

  // ── Save Log Call ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!outcome) { toast({ title: 'Select call outcome first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      // 1. Insert call record
      const { error: callErr } = await supabase.from('calls').insert({
        lead_id: id,
        employee_id: user?.id || user?.uid,
        employee_name: user?.name,
        status: outcome,
        notes: quickNote || null,
        duration: 0,
        created_at: new Date().toISOString(),
      });
      if (callErr) throw callErr;

      // 2. Update lead
      const patch = { last_activity: new Date().toISOString() };
      if (leadStatus) patch.status = leadStatus;
      if (followDate) patch.follow_up_date = followDate;
      if (quickNote)  patch.notes = `[${format(new Date(), 'dd MMM HH:mm')} – ${user?.name}] ${quickNote}`;
      await updateLead(id, patch);

      // 3. Auto-insert site_visit row when SiteVisit status
      if (leadStatus === 'SiteVisit' && followDate) {
        await supabase.from('site_visits').insert({
          lead_id: id,
          employee_id: user?.id || user?.uid,
          employee_name: user?.name,
          visit_date: followDate,
          status: 'Scheduled',
          notes: quickNote || null,
          created_at: new Date().toISOString(),
        });
      }

      toast({ title: '✅ Logged!', description: leadStatus ? `Status → ${leadStatus}` : 'Call saved' });
      setShowSheet(false);
      setOutcome(''); setLeadStatus(''); setFollowDate(''); setQuickNote('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await addLeadNote(id, newNote, user?.name || 'User');
    setNewNote('');
    toast({ title: '✅ Note saved' });
    setAddingNote(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 -ml-1 rounded-xl hover:bg-gray-100 active:bg-gray-200 touch-manipulation">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0F3A5F] text-base truncate leading-tight">{lead.name}</p>
          <p className="text-[11px] text-gray-400">Lead Detail</p>
        </div>
        <button onClick={() => navigate(`/crm/sales/edit-lead/${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 active:bg-gray-200 touch-manipulation">
          <Edit size={13} /> Edit
        </button>
      </div>

      {/* ── Hero Card ── */}
      <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 p-4">

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>{lead.status || 'New'}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ic.bg} ${ic.text}`}>{lead.interestLevel || 'Cold'}</span>
          {isOverdue && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              <AlertCircle size={10} /> Overdue
            </span>)}
          {isFollowToday && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
              <Clock size={10} /> Today
            </span>)}
        </div>

        {/* BIG tap-to-call button */}
        <a href={`tel:${lead.phone}`}
          className="flex items-center gap-3 bg-[#0F3A5F] text-white rounded-2xl px-4 py-3.5 mb-3 active:bg-[#0a2d4f] touch-manipulation">
          <div className="bg-white/20 rounded-full p-2"><Phone size={18} /></div>
          <div className="flex-1">
            <p className="text-[11px] text-blue-200">Tap to Call</p>
            <p className="text-xl font-black tracking-wide">{lead.phone}</p>
          </div>
          <ChevronRight size={20} className="opacity-50" />
        </a>

        {/* Follow-up row */}
        {followUpRaw && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-3 font-medium
            ${isOverdue ? 'bg-red-50 text-red-700' : isFollowToday ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            <Calendar size={14} />
            Follow-up: {format(parseISO(followUpRaw), 'EEE, dd MMM yyyy')}
          </div>
        )}

        {/* Action row */}
        <div className="grid grid-cols-3 gap-2">
          <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`}
            target="_blank" rel="noreferrer"
            className="flex flex-col items-center gap-1 py-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-xs font-semibold active:bg-green-100 touch-manipulation">
            <MessageCircle size={18} />
            WhatsApp
          </a>
          {/* ✅ THIS IS THE FIX: opens bottom sheet, NOT a new page */}
          <button onClick={() => setShowSheet(true)}
            className="col-span-2 flex items-center justify-center gap-2 py-3 bg-[#D4AF37] rounded-xl text-[#0F3A5F] text-sm font-black active:bg-[#c4a030] shadow-sm touch-manipulation">
            <PhoneCall size={18} />
            Log Call / Update
          </button>
        </div>
      </div>

      {/* ── Lead Details Grid ── */}
      <div className="bg-white mx-3 mt-2 rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Details</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Budget',  value: lead.budget || '—',     emoji: '💰' },
            { label: 'Project', value: lead.project || 'Not set', emoji: '🏗️' },
            { label: 'Source',  value: lead.source || '—',     emoji: '📌' },
            { label: 'Email',   value: lead.email || 'Not given', emoji: '✉️' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{item.emoji} {item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="mx-3 mt-2 grid grid-cols-3 gap-2">
        {[
          { label: 'Calls',    value: leadCalls.length,  color: 'text-blue-600' },
          { label: 'Connected',value: leadCalls.filter(c => ['connected','Connected'].includes(c.status)).length, color: 'text-green-600' },
          { label: 'Visits',   value: leadVisits.length, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Collapsible Notes ── */}
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
              <div className="bg-yellow-50 rounded-xl p-3 text-sm text-yellow-900 mt-3 whitespace-pre-wrap">{lead.notes}</div>
            )}
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="Quick note..." rows={2}
              className="w-full mt-2 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/20" />
            <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
              className="w-full py-2.5 bg-[#0F3A5F] text-white rounded-xl text-sm font-semibold disabled:opacity-40">
              {addingNote ? 'Saving...' : '+ Save Note'}
            </button>
          </div>
        )}
      </div>

      {/* ── Recent Calls History ── */}
      {leadCalls.length > 0 && (
        <div className="bg-white mx-3 mt-2 rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Calls</p>
          <div className="space-y-2">
            {leadCalls.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${ ['connected','Connected'].includes(c.status) ? 'bg-green-100 text-green-700'
                   : ['no_answer','NoAnswer'].includes(c.status) ? 'bg-gray-100 text-gray-500'
                   : 'bg-orange-100 text-orange-700' }`}>
                  <Phone size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 capitalize">{c.status?.replace(/_/g,' ')}</p>
                  <p className="text-[10px] text-gray-400">
                    {c.created_at ? format(parseISO(c.created_at), 'dd MMM, h:mm a') : '—'}
                    {c.employee_name ? ` · ${c.employee_name}` : ''}
                  </p>
                  {c.notes && <p className="text-xs text-gray-500 truncate mt-0.5">{c.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── LOG CALL BOTTOM SHEET ─ inline, no page navigation ── */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showSheet && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 touch-none" onClick={() => setShowSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
               style={{ maxHeight: '94vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-4 pb-8">
              {/* Lead reminder */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-black text-[#0F3A5F] text-lg leading-tight">{lead.name}</p>
                  <p className="text-xs text-gray-400">{lead.phone} · Log call outcome</p>
                </div>
                <button onClick={() => setShowSheet(false)}
                  className="p-2 rounded-full bg-gray-100 active:bg-gray-200 touch-manipulation">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              {/* ── STEP 1: What happened? ── */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">1 · What happened on the call?</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {CALL_OUTCOMES.map(o => (
                  <button key={o.id} onClick={() => setOutcome(o.id)}
                    className={`flex items-center gap-2 px-3 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all touch-manipulation
                      ${ outcome === o.id ? 'border-[#0F3A5F] bg-[#0F3A5F] text-white shadow-lg scale-[1.02]' : `border ${o.cls}` }`}>
                    <span className="text-lg">{o.emoji}</span> {o.label}
                  </button>
                ))}
              </div>

              {/* ── STEP 2: Update Status ── */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">2 · Update Lead Status</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {LEAD_STATUSES.map(s => (
                  <button key={s.id} onClick={() => setLeadStatus(leadStatus === s.id ? '' : s.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-semibold transition-all touch-manipulation
                      ${ leadStatus === s.id ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#0F3A5F] shadow-sm scale-[1.02]' : 'border-gray-100 bg-gray-50 text-gray-700' }`}>
                    <span>{s.emoji}</span> {s.label}
                  </button>
                ))}
              </div>

              {/* ── STEP 3: Date (follow-up or visit) ── */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                {leadStatus === 'SiteVisit' ? '3 · Schedule Visit Date' : '3 · Follow-up Date (optional)'}
              </p>
              <input type="date" min={today} value={followDate} onChange={e => setFollowDate(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#0F3A5F] mb-5" />

              {/* ── STEP 4: Quick Note ── */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">4 · Quick Note (optional)</p>
              <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)}
                placeholder="What did the lead say? Any remarks..."
                rows={2}
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0F3A5F] mb-5" />

              {/* ── SAVE ── */}
              <button onClick={handleSave} disabled={!outcome || saving}
                className="w-full py-4 bg-[#0F3A5F] text-white rounded-2xl text-base font-black disabled:opacity-40 active:bg-[#0a2d4f] shadow-xl touch-manipulation">
                {saving ? '⏳ Saving...' : '✅ Save & Update Lead'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadDetail;
