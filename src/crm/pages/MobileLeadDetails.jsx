import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Phone, IndianRupee, Mail,
  Edit2, Check, X, Plus, Trash2, MessageSquare,
  Flame, Wind, Snowflake, MapPin, Clock, PhoneCall,
  Building2, UserCheck, CalendarClock, Share2
} from 'lucide-react';
import FollowUpBadge from '@/crm/components/FollowUpBadge';
import LogCallModal from '@/crm/components/LogCallModal';
import { normalizeLeadStatus, normalizeInterestLevel, getStatusColor } from '@/crm/utils/statusUtils';

/* ─── Temperature Chip ─── */
const TemperatureChip = ({ level }) => {
  const normalized = normalizeInterestLevel(level);
  const config = {
    Hot:  { icon: Flame,     bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
    Warm: { icon: Wind,      bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    Cold: { icon: Snowflake, bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  };
  const c = config[normalized] || config.Warm;
  const Icon = c.icon;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide">
      <Icon size={11} />
      {normalized}
    </span>
  );
};

/* ─── Status Pill ─── */
const StatusPill = ({ status }) => {
  const label = status === 'FollowUp' ? 'Follow Up' : status;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${getStatusColor(status)}`}>
      {label}
    </span>
  );
};

/* ─── Info Row ─── */
const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="mt-0.5 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50">
        <Icon size={14} className="text-gray-400" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
};

/* ─── Phone Row ─── */
const PhoneRow = ({ phone, label = 'Primary', onRemove }) => (
  <div className="flex items-center justify-between gap-2 py-2.5 border-b border-gray-50 last:border-0">
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900">{phone}</p>
    </div>
    <div className="flex gap-1.5 flex-shrink-0">
      <a href={`tel:${phone}`}>
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 active:scale-95 transition-transform">
          <Phone size={15} className="text-emerald-600" />
        </button>
      </a>
      <a href={`https://wa.me/91${phone}`} target="_blank" rel="noopener noreferrer">
        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 active:scale-95 transition-transform">
          <MessageSquare size={15} className="text-emerald-600" />
        </button>
      </a>
      {onRemove && (
        <button onClick={onRemove} className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 border border-red-200 active:scale-95 transition-transform">
          <Trash2 size={14} className="text-red-500" />
        </button>
      )}
    </div>
  </div>
);

/* ─── Action Button ─── */
const ActionBtn = ({ icon: Icon, label, onClick, color = '#1E40AF', bg = '#EFF6FF', border = '#BFDBFE' }) => (
  <button
    onClick={onClick}
    style={{ background: bg, border: `1.5px solid ${border}`, color }}
    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl flex-1 active:scale-95 transition-transform"
  >
    <Icon size={18} />
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

/* ═══════════════════════════════════════════════════════ */
/*                  MAIN COMPONENT                        */
/* ═══════════════════════════════════════════════════════ */
const MobileLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // PERF: previously called useCRMData() (no args) which triggers a full
  // 5-table admin payload fetch (~4900 leads × all columns × 5 round-trips)
  // just to find ONE lead by id. Every lead-tap blocked behind that load.
  // Now: pass {enabled:false} to skip the bulk fetches, keep only the
  // mutators (updateLead, addLeadNote), and fetch THIS lead directly
  // from Supabase — one row, sub-second.
  const { updateLead, addLeadNote } = useCRMData({ enabled: false });
  // Seed lead state from navigation state (the lead list passes the lead
  // object via navigate(url, { state: { lead } })) so the detail page
  // renders instantly with the data the list already had — no spinner
  // while the single-row Supabase fetch is in-flight. The fetch still
  // runs in the background to refresh with the latest server-side data
  // (notes, status, etc. that may have changed since the list was rendered).
  const seededLead = location.state?.lead || null;
  const [lead, setLead] = useState(seededLead);
  const [leadsLoading, setLeadsLoading] = useState(!seededLead);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;
    setLeadsLoading(true);
    supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('[MobileLeadDetails] fetch error:', error.message);
        } else if (data) {
          // Normalize to the shape the rest of this component expects
          // (other pages get this via useCRMData's normalize step).
          setLead({
            id:                 data.id,
            name:               data.full_name || '',
            phone:              data.phone || '',
            email:              data.email || '',
            project:            data.project || '',
            status:             data.final_status || data.status || 'FollowUp',
            finalStatus:        data.final_status || 'FollowUp',
            budget:             data.budget || '',
            interestLevel:      data.interest_level || 'Cold',
            interest_level:     data.interest_level || 'Cold',
            assignedTo:         data.assigned_to || null,
            assigned_to:        data.assigned_to || null,
            assignedToName:     data.assigned_to_name || null,
            notes:              data.notes || '',
            siteVisitStatus:    data.site_visit_status || '',
            followUpDate:       data.next_followup_date || null,
            follow_up_date:     data.next_followup_date || null,
            next_followup_date: data.next_followup_date || null,
            createdAt:          data.created_at,
            created_at:         data.created_at,
            assignedAt:         data.assigned_at || null,
            assigned_at:        data.assigned_at || null,
          });
        }
        setLeadsLoading(false);
      });
    return () => { cancelled = true; };
  }, [leadId]);

  const { user } = useAuth();
  const { toast } = useToast();

  // `lead` is now provided by the useState above (fetched directly from
  // Supabase by id), not by leads.find from useCRMData's bulk array.
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(lead?.name || '');
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [alternatePhone, setAlternatePhone] = useState('');
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);

  useEffect(() => {
    if (lead) setEditedName(lead.name);
  }, [lead]);

  const handleBack = () => {
    if (location.state?.from) navigate(location.state.from);
    else if (window.history.length > 2) navigate(-1);
    else navigate('/crm/my-leads');
  };

  /* ── Loading ── */
  if (leadsLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
        {/* Skeleton Header */}
        <div className="bg-white px-4 py-3 flex items-center gap-3 border-b">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded-full animate-pulse" />
        </div>
        {/* Skeleton Hero */}
        <div className="mx-3 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
            </div>
          </div>
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <UserCheck size={28} className="text-gray-300" />
        </div>
        <h2 className="text-base font-bold text-gray-700 mb-1">Lead not found</h2>
        <p className="text-sm text-gray-400 mb-5">This lead may have been removed.</p>
        <button onClick={() => navigate('/crm/my-leads')}
          className="px-5 py-2.5 bg-[#0F3A5F] text-white text-sm font-semibold rounded-xl active:scale-95 transition">
          Back to Leads
        </button>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' });
      return;
    }
    try {
      await updateLead(lead.id, { name: editedName.trim() });
      await addLeadNote(lead.id, `Name updated from "${lead.name}" to "${editedName.trim()}"`, 'Employee');
      toast({ title: 'Updated', description: 'Lead name saved' });
      setIsEditingName(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to update name', variant: 'destructive' });
    }
  };

  const handleAddAlternatePhone = async () => {
    if (!alternatePhone.trim() || alternatePhone.length < 10) {
      toast({ title: 'Invalid', description: 'Enter a valid 10-digit number', variant: 'destructive' });
      return;
    }
    try {
      const cur = lead.alternatePhone || lead.alternate_phone || [];
      const phones = Array.isArray(cur) ? cur : [cur].filter(Boolean);
      if (phones.includes(alternatePhone)) {
        toast({ title: 'Duplicate', description: 'Number already added', variant: 'destructive' });
        return;
      }
      phones.push(alternatePhone);
      await updateLead(lead.id, { alternatePhone: phones });
      await addLeadNote(lead.id, `Alternate phone added: ${alternatePhone}`, 'Employee');
      toast({ title: 'Added', description: 'Alternate number saved' });
      setAlternatePhone('');
      setIsAddingPhone(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to add phone', variant: 'destructive' });
    }
  };

  const handleRemoveAlternatePhone = async (phoneToRemove) => {
    try {
      const cur = lead.alternatePhone || lead.alternate_phone || [];
      const phones = Array.isArray(cur) ? cur : [cur].filter(Boolean);
      await updateLead(lead.id, { alternatePhone: phones.filter(p => p !== phoneToRemove) });
      await addLeadNote(lead.id, `Alternate phone removed: ${phoneToRemove}`, 'Employee');
      toast({ title: 'Removed' });
    } catch {
      toast({ title: 'Error', description: 'Failed to remove phone', variant: 'destructive' });
    }
  };

  const alternatePhones = Array.isArray(lead.alternatePhone || lead.alternate_phone)
    ? (lead.alternatePhone || lead.alternate_phone)
    : [lead.alternatePhone || lead.alternate_phone].filter(Boolean);

  const status = normalizeLeadStatus(lead.status);
  const followUpDate = lead.followUpDate || lead.follow_up_date;
  const followUpTime = lead.followUpTime || lead.follow_up_time;
  const interest = lead.interestLevel || lead.interest_level;
  const lastUpdated = lead.updatedAt || lead.updated_at;

  /* Initials avatar */
  const initials = (lead.name || 'L').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-28" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-3 py-2.5 flex items-center gap-2">
        <button onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Lead Profile</p>
          <p className="text-sm font-bold text-gray-900 truncate leading-tight">{lead.name}</p>
        </div>
        <a href={`tel:${lead.phone}`}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-500 shadow-sm active:scale-95 transition-transform">
          <Phone size={16} className="text-white" />
        </a>
      </div>

      <div className="px-3 pt-3 space-y-3">

        {/* ── Hero Identity Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0F3A5F] to-[#1B6CA8]" />

          <div className="px-4 pt-4 pb-3">
            {/* Name Row */}
            <div className="flex items-start gap-3 mb-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0F3A5F, #1B6CA8)' }}>
                {initials}
              </div>

              {/* Name + edit */}
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex gap-2 items-center">
                    <Input value={editedName} onChange={e => setEditedName(e.target.value)}
                      className="h-9 text-sm flex-1" autoFocus />
                    <button onClick={handleSaveName}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500 active:scale-95 transition">
                      <Check size={14} className="text-white" />
                    </button>
                    <button onClick={() => { setEditedName(lead.name); setIsEditingName(false); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 active:scale-95 transition">
                      <X size={14} className="text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-1">
                    <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight">{lead.name}</h1>
                    <button onClick={() => setIsEditingName(true)}
                      className="p-1 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 active:scale-95 transition flex-shrink-0">
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <StatusPill status={status} />
                  <TemperatureChip level={interest} />
                  {followUpDate && (
                    <FollowUpBadge followUpDate={followUpDate} followUpTime={followUpTime} size="small" />
                  )}
                </div>
              </div>
            </div>

            {/* Tap to Call Banner */}
            <a href={`tel:${lead.phone}`}
              className="flex items-center gap-3 bg-gradient-to-r from-[#0F3A5F] to-[#1B6CA8] rounded-xl px-4 py-3 active:opacity-90 transition-opacity mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-blue-200 font-semibold uppercase tracking-widest">Tap to Call</p>
                <p className="text-white font-black text-base tracking-wide">{lead.phone}</p>
              </div>
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20">
                <Phone size={14} className="text-white" />
              </div>
            </a>

            {/* Quick Meta */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {lead.project && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <Building2 size={11} className="text-gray-400" /> {lead.project}
                </span>
              )}
              {lead.budget && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <IndianRupee size={11} className="text-gray-400" /> ₹{Number(lead.budget).toLocaleString('en-IN')}
                </span>
              )}
              {lastUpdated && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <Clock size={11} className="text-gray-400" />
                  {new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Dock ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <div className="flex gap-2">
            <ActionBtn icon={PhoneCall} label="Log Call"
              onClick={() => setIsLogCallModalOpen(true)}
              color="#5B21B6" bg="#F5F3FF" border="#DDD6FE" />
            <ActionBtn icon={UserCheck} label="Update"
              onClick={() => navigate(`/crm/lead/${lead.id}/update`)}
              color="#0F3A5F" bg="#EFF6FF" border="#BFDBFE" />
            <ActionBtn icon={MapPin} label="Visit"
              onClick={() => navigate(`/crm/sales/site-visits?leadId=${lead.id}`)}
              color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" />
            <ActionBtn icon={MessageSquare} label="WhatsApp"
              onClick={() => window.open(`https://wa.me/91${lead.phone}`, '_blank')}
              color="#065F46" bg="#ECFDF5" border="#A7F3D0" />
          </div>
        </div>

        {/* ── Contact Numbers ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Contact Numbers</h3>
            <button onClick={() => setIsAddingPhone(true)}
              className="flex items-center gap-1 text-[11px] text-blue-600 font-bold active:scale-95 transition">
              <Plus size={13} /> Add
            </button>
          </div>
          <PhoneRow phone={lead.phone} label="Primary" />
          {alternatePhones.map((p, i) => (
            <PhoneRow key={i} phone={p} label={`Alternate ${i + 1}`}
              onRemove={() => handleRemoveAlternatePhone(p)} />
          ))}
        </div>

        {/* ── Details Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Details</h3>
          <InfoRow icon={Mail}         label="Email"   value={lead.email} />
          <InfoRow icon={Building2}    label="Project" value={lead.project} />
          <InfoRow icon={IndianRupee}  label="Budget"  value={lead.budget ? `₹${Number(lead.budget).toLocaleString('en-IN')}` : null} />
          <InfoRow icon={Share2}       label="Source"  value={lead.source} />
          {followUpDate && (
            <InfoRow icon={CalendarClock} label="Follow-up"
              value={`${new Date(followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${followUpTime ? ' · ' + followUpTime : ''}`} />
          )}
        </div>

        {/* ── Notes ── */}
        {lead.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Notes</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{lead.notes}</p>
          </div>
        )}

      </div>

      {/* ── Add Phone Dialog ── */}
      <Dialog open={isAddingPhone} onOpenChange={setIsAddingPhone}>
        <DialogContent className="w-11/12 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Add Alternate Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="10-digit mobile number"
              value={alternatePhone}
              onChange={e => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10} className="text-base h-11" />
            <div className="flex gap-2">
              <Button onClick={handleAddAlternatePhone} className="flex-1 h-11 bg-[#0F3A5F] hover:bg-[#0a2d4d] rounded-xl font-bold">
                Save Number
              </Button>
              <Button variant="outline" onClick={() => { setAlternatePhone(''); setIsAddingPhone(false); }}
                className="flex-1 h-11 rounded-xl font-bold">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Log Call Modal ── */}
      <LogCallModal
        lead={lead}
        isOpen={isLogCallModalOpen}
        onClose={() => setIsLogCallModalOpen(false)}
        onSuccess={() => toast({ title: '✅ Call Logged', description: 'Call recorded successfully' })}
      />
    </div>
  );
};

export default MobileLeadDetails;
