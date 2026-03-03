import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail, IndianRupee, Tag, MapPin, Calendar, CheckCircle2, MessageSquare, User } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const normalizeLeadStatus = (status) => {
  if (!status) return 'Open';
  const cleaned = String(status).trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (cleaned === 'followup') return 'FollowUp';
  if (cleaned === 'booked') return 'Booked';
  if (cleaned === 'lost') return 'Lost';
  return 'Open';
};

const parseNotes = (notes) => {
  if (!notes) return [];
  if (Array.isArray(notes)) {
    return notes.map(n => ({
      text: n.text || String(n),
      author: n.author || 'Team',
      timestamp: n.timestamp || null,
    }));
  }
  if (typeof notes === 'string' && notes.trim() !== '') {
    return notes.split('\n').filter(line => line.trim() !== '')
      .map(line => {
        const match = line.match(/^\[(.+?)\]\s*(.+?):\s*(.*)$/);
        if (match) return { timestamp: match[1], author: match[2].trim(), text: match[3].trim() };
        return { text: line.trim(), author: 'Team', timestamp: null };
      }).reverse();
  }
  return [];
};

const statusConfig = {
  Booked: { 
    gradient: 'bg-gradient-to-br from-emerald-500 to-green-600',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    label: 'Booked'
  },
  FollowUp: { 
    gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    label: 'Follow Up'
  },
  Lost: { 
    gradient: 'bg-gradient-to-br from-rose-500 to-red-600',
    light: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'Lost'
  },
  Open: { 
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'Open'
  },
};

const MobileLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addLeadNote, addBookingLog } = useCRMData();
  const { toast } = useToast();

  const lead = leads.find(l => l.id === leadId);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [statusForm, setStatusForm] = useState({
    status: normalizeLeadStatus(lead?.status),
    followUpDate: lead?.followUpDate?.split('T')[0] || '',
    followUpTime: lead?.followUpTime || '',
    bookingAmount: lead?.bookingAmount || lead?.partialPayment || '',
    tokenAmount: lead?.tokenAmount || '',
    partialPayment: lead?.partialPayment || '',
    paymentMode: lead?.paymentMode || 'Cash',
    unitNumber: lead?.unitNumber || '',
    notes: '',
  });

  if (!lead) return <div className="p-8 text-center text-gray-500">Lead not found</div>;

  const currentLeadStatus = normalizeLeadStatus(lead.status);
  const sc = statusConfig[currentLeadStatus] || statusConfig.Open;
  const parsedNotes = parseNotes(lead.notes);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addLeadNote(lead.id, noteText, 'Sales (Mobile)');
    setNoteText('');
    toast({ title: '✓ Note Added', description: 'Note saved successfully.' });
  };

  const handleUpdate = async () => {
    const isFollowUp = statusForm.status === 'FollowUp';
    const isBooked = statusForm.status === 'Booked';

    if (isFollowUp && !statusForm.followUpDate) {
      toast({ title: 'Date Required', description: 'Please select follow-up date.', variant: 'destructive' });
      return;
    }

    try {
      await updateLead(lead.id, {
        status: statusForm.status,
        followUpDate: isFollowUp ? statusForm.followUpDate : '',
        followUpTime: isFollowUp ? statusForm.followUpTime : '',
        ...(isBooked && {
          bookingAmount: statusForm.bookingAmount,
          tokenAmount: statusForm.tokenAmount,
          partialPayment: statusForm.partialPayment,
          paymentMode: statusForm.paymentMode,
          unitNumber: statusForm.unitNumber,
        }),
      });

      const wasBooked = currentLeadStatus === 'Booked';
      if (isBooked && !wasBooked) {
        const amount = Number(statusForm.bookingAmount || statusForm.partialPayment || statusForm.tokenAmount || 0);
        const employeeId = lead.assignedTo || lead.assigned_to;
        if (employeeId) {
          await addBookingLog({
            employeeId,
            leadId: lead.id,
            leadName: lead.name,
            projectName: lead.project,
            unitNumber: statusForm.unitNumber,
            bookingAmount: amount,
            amount,
            paymentMode: statusForm.paymentMode,
            notes: `Token: ₹${statusForm.tokenAmount || 0}${statusForm.notes ? ` | ${statusForm.notes}` : ''}`,
          });
        }
      }

      if (statusForm.notes) addLeadNote(lead.id, statusForm.notes, 'Sales (Mobile)');
      toast({ title: '✓ Updated', description: 'Status updated successfully.' });
      setIsUpdateOpen(false);
    } catch (error) {
      console.error('[MobileLeadDetails] Update failed:', error);
      toast({ title: 'Update failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-36">
      
      {/* Professional Gradient Header */}
      <div className={`${sc.gradient} relative overflow-hidden`}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all z-10"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Hero content */}
        <div className="relative px-4 pt-16 pb-20 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl text-white text-3xl font-bold mb-4 border-2 border-white/40 shadow-lg">
            <User size={40} className="opacity-90" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{lead.name}</h1>
          <p className="text-white/90 text-sm flex items-center justify-center gap-1.5 mb-3">
            <MapPin size={14} />
            {lead.project}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-1.5 rounded-full border border-white/30">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {sc.label}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons - Floating */}
      <div className="px-4 -mt-8 mb-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => window.location.href = `tel:${lead.phone}`}
            className="flex items-center justify-center gap-2 bg-white shadow-xl rounded-xl py-4 text-green-600 font-semibold text-sm border border-green-100 hover:shadow-2xl active:scale-95 transition-all"
          >
            <Phone size={18} /> Call Now
          </button>
          <WhatsAppButton
            leadName={lead.name}
            phoneNumber={lead.phone}
            projectName={lead.project}
            className="flex items-center justify-center gap-2 bg-white shadow-xl rounded-xl py-4 text-green-600 font-semibold text-sm border border-green-100 hover:shadow-2xl active:scale-95 transition-all"
            label="WhatsApp"
          />
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Stats Cards with Gradients */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <IndianRupee size={14} />
              <p className="text-xs font-medium uppercase tracking-wide">Budget</p>
            </div>
            <p className="text-lg font-bold">{lead.budget ? `₹${lead.budget}` : 'N/A'}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Tag size={14} />
              <p className="text-xs font-medium uppercase tracking-wide">Source</p>
            </div>
            <p className="text-base font-bold truncate">{lead.source}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Phone size={14} />
              <p className="text-xs font-medium uppercase tracking-wide">Phone</p>
            </div>
            <p className="text-sm font-bold">{lead.phone}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Mail size={14} />
              <p className="text-xs font-medium uppercase tracking-wide">Interest</p>
            </div>
            <p className="text-sm font-bold">{lead.interestLevel || 'General'}</p>
          </div>
        </div>

        {/* Follow-up Banner */}
        {lead.followUpDate && (
          <div className={`${sc.light} ${sc.border} border rounded-xl p-4 shadow-sm`}>
            <div className={`flex items-center gap-2 mb-2 ${sc.text}`}>
              <Calendar size={16} />
              <p className="text-xs font-semibold uppercase tracking-wide">Follow-up Scheduled</p>
            </div>
            <p className={`text-base font-bold ${sc.text}`}>
              {new Date(lead.followUpDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              {lead.followUpTime && ` at ${lead.followUpTime}`}
            </p>
          </div>
        )}

        {/* Booking Details (if booked) */}
        {currentLeadStatus === 'Booked' && (lead.tokenAmount || lead.unitNumber) && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-emerald-900 text-sm">Booking Confirmed</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {lead.tokenAmount && (
                <div className="bg-white/60 rounded-lg p-2.5">
                  <p className="text-xs text-emerald-600 font-medium">Token</p>
                  <p className="font-bold text-emerald-900">₹{Number(lead.tokenAmount).toLocaleString('en-IN')}</p>
                </div>
              )}
              {lead.partialPayment && (
                <div className="bg-white/60 rounded-lg p-2.5">
                  <p className="text-xs text-emerald-600 font-medium">Partial</p>
                  <p className="font-bold text-emerald-900">₹{Number(lead.partialPayment).toLocaleString('en-IN')}</p>
                </div>
              )}
              {lead.paymentMode && (
                <div className="bg-white/60 rounded-lg p-2.5">
                  <p className="text-xs text-emerald-600 font-medium">Payment Mode</p>
                  <p className="font-bold text-emerald-900 text-sm">{lead.paymentMode}</p>
                </div>
              )}
              {lead.unitNumber && (
                <div className="bg-white/60 rounded-lg p-2.5">
                  <p className="text-xs text-emerald-600 font-medium">Unit / Plot</p>
                  <p className="font-bold text-emerald-900 text-sm">{lead.unitNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" />
              Notes & History
            </h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                className="flex-1 text-sm border-slate-300 focus:border-blue-500"
              />
              <Button 
                size="sm" 
                onClick={handleAddNote}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shrink-0 px-5"
              >
                Add
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {parsedNotes.length > 0 ? (
                parsedNotes.map((note, i) => (
                  <div key={i} className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-gray-800 leading-relaxed mb-2">{note.text}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-xs font-medium text-blue-600">{note.author}</span>
                      <span className="text-xs text-gray-400">
                        {note.timestamp ? new Date(note.timestamp).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No notes yet. Add your first note!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA with Gradient */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl z-20 lg:bottom-0">
        <Button
          className={`w-full h-12 text-base font-bold ${sc.gradient} hover:opacity-90 text-white shadow-lg`}
          onClick={() => {
            setStatusForm({
              status: normalizeLeadStatus(lead.status),
              followUpDate: lead?.followUpDate?.split('T')[0] || '',
              followUpTime: lead?.followUpTime || '',
              bookingAmount: lead?.bookingAmount || lead?.partialPayment || '',
              tokenAmount: lead?.tokenAmount || '',
              partialPayment: lead?.partialPayment || '',
              paymentMode: lead?.paymentMode || 'Cash',
              unitNumber: lead?.unitNumber || '',
              notes: '',
            });
            setIsUpdateOpen(true);
          }}
        >
          Update Status
        </Button>
      </div>

      {/* Update Dialog - Same as before */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="w-[92vw] max-w-md rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-4 text-left rounded-t-2xl">
            <DialogTitle className="text-lg font-semibold text-slate-900">Update Lead Status</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Changes sync across all devices instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4 max-h-[72vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Status</label>
              <Select value={statusForm.status} onValueChange={v => setStatusForm({ ...statusForm, status: v })}>
                <SelectTrigger className="h-11 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="FollowUp">Follow Up</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusForm.status === 'FollowUp' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Date</label>
                  <Input
                    type="date"
                    value={statusForm.followUpDate}
                    onChange={e => setStatusForm({ ...statusForm, followUpDate: e.target.value })}
                    className="h-10 border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Time</label>
                  <Input
                    type="time"
                    value={statusForm.followUpTime}
                    onChange={e => setStatusForm({ ...statusForm, followUpTime: e.target.value })}
                    className="h-10 border-slate-300"
                  />
                </div>
              </div>
            )}

            {statusForm.status === 'Booked' && (
              <div className="space-y-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Booking Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Booking Amount</label>
                    <Input type="number" value={statusForm.bookingAmount} onChange={e => setStatusForm({ ...statusForm, bookingAmount: e.target.value })} className="h-10 border-slate-300 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Token Amount</label>
                    <Input type="number" value={statusForm.tokenAmount} onChange={e => setStatusForm({ ...statusForm, tokenAmount: e.target.value })} className="h-10 border-slate-300 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Partial Payment</label>
                    <Input type="number" value={statusForm.partialPayment} onChange={e => setStatusForm({ ...statusForm, partialPayment: e.target.value })} className="h-10 border-slate-300 mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Unit / Plot</label>
                    <Input value={statusForm.unitNumber} onChange={e => setStatusForm({ ...statusForm, unitNumber: e.target.value })} className="h-10 border-slate-300 mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Payment Mode</label>
                  <Select value={statusForm.paymentMode} onValueChange={v => setStatusForm({ ...statusForm, paymentMode: v })}>
                    <SelectTrigger className="h-10 border-slate-300 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Remarks</label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={statusForm.notes}
                onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="min-h-[90px] resize-none border-slate-300"
              />
            </div>

            <Button 
              onClick={handleUpdate} 
              className="h-11 w-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileLeadDetails;
