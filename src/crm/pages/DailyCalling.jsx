
import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Phone, PhoneOff, PhoneMissed, Clock, User, MessageCircle,
  ChevronRight, Flame, Wind, Snowflake, Search, CheckCircle2,
  XCircle, TrendingUp, PhoneCall, Loader2, X
} from 'lucide-react';
import { format, isToday } from 'date-fns';

const CALL_OUTCOMES = [
  { value: 'Connected',     label: 'Connected',    icon: Phone,       color: 'bg-green-50 border-green-300 text-green-700',  iconColor: 'text-green-600' },
  { value: 'Not Connected', label: 'No Answer',     icon: PhoneMissed, color: 'bg-yellow-50 border-yellow-300 text-yellow-700', iconColor: 'text-yellow-600' },
  { value: 'Busy',          label: 'Busy',          icon: PhoneOff,    color: 'bg-orange-50 border-orange-300 text-orange-700', iconColor: 'text-orange-600' },
  { value: 'Switched Off',  label: 'Switched Off',  icon: XCircle,     color: 'bg-gray-100 border-gray-300 text-gray-700',     iconColor: 'text-gray-600' },
];

const TemperatureIcon = ({ level }) => {
  if (level === 'Hot') return <Flame size={12} className="text-red-500" />;
  if (level === 'Warm') return <Wind size={12} className="text-amber-500" />;
  return <Snowflake size={12} className="text-blue-400" />;
};

const DailyCalling = () => {
  const { user } = useAuth();
  const { leads, addCallLog, calls, updateLead } = useCRMData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const userId = user?.id;

  const myLeads = useMemo(() => {
    return leads
      .filter(l => l.assignedTo === userId || l.assigned_to === userId)
      .filter(l => !['NotInterested', 'Lost', 'Booked'].includes(l.status))
      .sort((a, b) => {
        // Prioritize leads with today's follow-up, then overdue, then rest
        const fuA = a.follow_up_date || a.followUpDate;
        const fuB = b.follow_up_date || b.followUpDate;
        const aToday = fuA && isToday(new Date(fuA)) ? 0 : 1;
        const bToday = fuB && isToday(new Date(fuB)) ? 0 : 1;
        if (aToday !== bToday) return aToday - bToday;
        return new Date(fuA || 0) - new Date(fuB || 0);
      });
  }, [leads, userId]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return myLeads;
    const q = searchTerm.toLowerCase();
    return myLeads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.project?.toLowerCase().includes(q)
    );
  }, [myLeads, searchTerm]);

  const myCalls = useMemo(() => {
    return (calls || [])
      .filter(c => c.employeeId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [calls, userId]);

  // Today's call stats
  const todayStats = useMemo(() => {
    const todayCalls = myCalls.filter(c => {
      try { return isToday(new Date(c.timestamp)); } catch { return false; }
    });
    return {
      total: todayCalls.length,
      connected: todayCalls.filter(c => c.status === 'Connected').length,
      notConnected: todayCalls.filter(c => c.status !== 'Connected').length,
    };
  }, [myCalls]);

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setCallStatus('');
    setDuration('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedLead) return toast({ title: 'Error', description: 'Select a lead first', variant: 'destructive' });
    if (!callStatus) return toast({ title: 'Error', description: 'Select call outcome', variant: 'destructive' });

    setSaving(true);
    try {
      await addCallLog({
        leadId: selectedLead.id,
        employeeId: userId,
        employeeName: user?.name || '',
        leadName: selectedLead.name,
        projectName: selectedLead.project || 'General',
        type: 'Outgoing',
        status: callStatus,
        duration: parseInt(duration) || 0,
        notes: notes || `Call: ${callStatus}`,
      });

      // Update lead's last activity
      await updateLead(selectedLead.id, {
        last_activity: new Date().toISOString(),
        lastCallOutcome: callStatus,
        last_call_outcome: callStatus,
        lastCallTime: new Date().toISOString(),
        last_call_time: new Date().toISOString(),
      });

      toast({ title: 'Call Logged', description: `${selectedLead.name} — ${callStatus}` });
      setSelectedLead(null);
      setCallStatus('');
      setDuration('');
      setNotes('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-[#0F3A5F]">Call CRM</h1>
              <p className="text-[11px] text-gray-400">{myLeads.length} active leads to call</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {format(new Date(), 'dd MMM')}
              </span>
            </div>
          </div>

          {/* ── Today's Progress Stats ── */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-50 rounded-xl px-3 py-2 text-center border border-blue-100">
              <p className="text-xl font-black text-blue-700">{todayStats.total}</p>
              <p className="text-[9px] font-bold text-blue-500 uppercase">Calls Today</p>
            </div>
            <div className="bg-green-50 rounded-xl px-3 py-2 text-center border border-green-100">
              <p className="text-xl font-black text-green-700">{todayStats.connected}</p>
              <p className="text-[9px] font-bold text-green-500 uppercase">Connected</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2 text-center border border-amber-100">
              <p className="text-xl font-black text-amber-700">{todayStats.notConnected}</p>
              <p className="text-[9px] font-bold text-amber-500 uppercase">Missed</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search lead name, phone, project..."
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/20" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Call Session ── */}
      {selectedLead && (
        <div className="mx-3 mt-3">
          <div className="bg-white rounded-2xl border-2 border-[#0F3A5F]/20 shadow-lg overflow-hidden">
            {/* Lead info header */}
            <div className="bg-[#0F3A5F] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">{selectedLead.name}</p>
                  <p className="text-white/70 text-xs">{selectedLead.phone} {selectedLead.project ? `| ${selectedLead.project}` : ''}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="text-white/60 active:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 bg-white/20 text-white/90 text-[10px] font-bold rounded-full">
                  {selectedLead.status || 'New'}
                </span>
                <span className="flex items-center gap-1 text-white/70 text-[10px]">
                  <TemperatureIcon level={selectedLead.interestLevel || selectedLead.interest_level} />
                  {selectedLead.interestLevel || selectedLead.interest_level || 'Cold'}
                </span>
                {selectedLead.budget && (
                  <span className="text-white/70 text-[10px]">{selectedLead.budget}</span>
                )}
              </div>
            </div>

            {/* Quick action buttons: Call + WhatsApp */}
            <div className="flex border-b border-gray-100">
              <a href={`tel:${selectedLead.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-600 active:bg-emerald-50 border-r border-gray-100">
                <Phone size={16} /> Call Now
              </a>
              <a href={`https://wa.me/91${selectedLead.phone?.replace(/\D/g, '').slice(-10)}`}
                target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-[#25D366] active:bg-green-50">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>

            {/* Call outcome chips */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Call Outcome</p>
              <div className="grid grid-cols-2 gap-2">
                {CALL_OUTCOMES.map(o => {
                  const Icon = o.icon;
                  const isSelected = callStatus === o.value;
                  return (
                    <button key={o.value} onClick={() => setCallStatus(o.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all touch-manipulation ${
                        isSelected ? o.color : 'border-gray-100 bg-gray-50 text-gray-600'
                      }`}>
                      <Icon size={14} className={isSelected ? o.iconColor : 'text-gray-400'} />
                      {o.label}
                      {isSelected && <CheckCircle2 size={12} className="ml-auto text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration + Notes */}
            {callStatus === 'Connected' && (
              <div className="px-4 pb-2">
                <Input type="number" placeholder="Duration (minutes)" value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="h-9 text-sm" />
              </div>
            )}

            <div className="px-4 pb-3">
              <Textarea placeholder="Quick note about the call..." value={notes}
                onChange={e => setNotes(e.target.value)} rows={2}
                className="text-sm resize-none" />
            </div>

            {/* Save */}
            <div className="px-4 pb-4">
              <button onClick={handleSubmit} disabled={!callStatus || saving}
                className="w-full py-3 bg-[#0F3A5F] text-white rounded-xl text-sm font-bold disabled:opacity-40 active:bg-[#0a2d4f] shadow-lg transition-all touch-manipulation">
                {saving
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving...</span>
                  : 'Log Call & Next Lead'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lead List — tap to start calling ── */}
      <div className="px-3 pt-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
          {selectedLead ? 'Other Leads' : 'Tap a lead to start calling'}
        </p>
        <div className="space-y-2">
          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <PhoneCall size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No leads to call</p>
            </div>
          )}
          {filteredLeads.map(lead => {
            if (selectedLead && lead.id === selectedLead.id) return null;
            const fu = lead.follow_up_date || lead.followUpDate;
            const isFuToday = fu && (() => { try { return isToday(new Date(fu)); } catch { return false; } })();
            const interest = lead.interestLevel || lead.interest_level;

            return (
              <div key={lead.id}
                onClick={() => handleSelectLead(lead)}
                className={`bg-white rounded-xl border shadow-sm active:scale-[0.98] transition-all touch-manipulation cursor-pointer ${
                  isFuToday ? 'border-amber-200 border-l-4 border-l-amber-400' : 'border-gray-100'
                }`}>
                <div className="flex items-center px-3 py-3 gap-3">
                  {/* Temperature dot */}
                  <div className="shrink-0">
                    <TemperatureIcon level={interest} />
                  </div>

                  {/* Lead info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-gray-900 truncate">{lead.name}</p>
                      {interest === 'Hot' && <Flame size={11} className="text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                      <span>{lead.phone}</span>
                      {lead.project && <span className="truncate max-w-[80px]">{lead.project}</span>}
                    </div>
                  </div>

                  {/* Status + Follow-up */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">
                      {lead.status || 'New'}
                    </span>
                    {isFuToday && (
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                        <Clock size={9} /> Today
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <a href={`tel:${lead.phone}`}
                      className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center active:bg-emerald-100">
                      <Phone size={13} className="text-emerald-600" />
                    </a>
                    <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '').slice(-10)}`}
                      target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center active:bg-green-100">
                      <MessageCircle size={13} className="text-[#25D366]" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Call History ── */}
      {myCalls.length > 0 && (
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
            Recent Calls
          </p>
          <div className="space-y-1.5">
            {myCalls.slice(0, 8).map(call => (
              <div key={call.id} className="bg-white rounded-lg border border-gray-100 px-3 py-2 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  call.status === 'Connected' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Phone size={12} className={call.status === 'Connected' ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{call.leadName}</p>
                  <p className="text-[10px] text-gray-400">
                    {call.status} {call.duration ? `| ${call.duration}m` : ''}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {(() => {
                    try { return format(new Date(call.timestamp), 'h:mm a'); } catch { return ''; }
                  })()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCalling;
