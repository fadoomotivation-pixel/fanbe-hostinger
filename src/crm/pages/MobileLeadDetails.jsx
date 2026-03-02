import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, IndianRupee, Tag, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
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
      text:      n.text      || String(n),
      author:    n.author    || 'Team',
      timestamp: n.timestamp || null,
    }));
  }
  if (typeof notes === 'string' && notes.trim() !== '') {
    return notes
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const match = line.match(/^\[(.+?)\]\s*(.+?):\s*(.*)$/);
        if (match) return { timestamp: match[1], author: match[2].trim(), text: match[3].trim() };
        return { text: line.trim(), author: 'Team', timestamp: null };
      })
      .reverse();
  }
  return [];
};

const statusConfig = {
  Booked:   { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', label: 'Booked' },
  FollowUp: { bg: 'bg-amber-500',   hover: 'hover:bg-amber-600',   label: 'Follow Up' },
  Lost:     { bg: 'bg-red-500',     hover: 'hover:bg-red-600',     label: 'Lost' },
  Open:     { bg: 'bg-blue-500',    hover: 'hover:bg-blue-600',    label: 'Open' },
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
    status:         normalizeLeadStatus(lead?.status),
    followUpDate:   lead?.followUpDate?.split('T')[0] || '',
    followUpTime:   lead?.followUpTime    || '',
    bookingAmount:  lead?.bookingAmount   || lead?.partialPayment || '',
    tokenAmount:    lead?.tokenAmount     || '',
    partialPayment: lead?.partialPayment  || '',
    paymentMode:    lead?.paymentMode     || 'Cash',
    unitNumber:     lead?.unitNumber      || '',
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
    toast({ title: 'Note Added', description: 'Note saved successfully.' });
  };

  const handleUpdate = async () => {
    const isFollowUp = statusForm.status === 'FollowUp';
    const isBooked   = statusForm.status === 'Booked';

    if (isFollowUp && !statusForm.followUpDate) {
      toast({ title: 'Follow-up date missing', description: 'Please select follow-up date first.', variant: 'destructive' });
      return;
    }

    try {
      await updateLead(lead.id, {
        status:        statusForm.status,
        followUpDate:  isFollowUp ? statusForm.followUpDate : '',
        followUpTime:  isFollowUp ? statusForm.followUpTime : '',
        ...(isBooked && {
          bookingAmount:  statusForm.bookingAmount,
          tokenAmount:    statusForm.tokenAmount,
          partialPayment: statusForm.partialPayment,
          paymentMode:    statusForm.paymentMode,
          unitNumber:     statusForm.unitNumber,
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
        } else {
          console.warn('[MobileLeadDetails] Missing employee assignment for booking log', lead.id);
        }
      }

      if (statusForm.notes) addLeadNote(lead.id, statusForm.notes, 'Sales (Mobile)');
      toast({ title: 'Success', description: 'Status updated.' });
      setIsUpdateOpen(false);
    } catch (error) {
      console.error('[MobileLeadDetails] Failed to update status:', error);
      toast({ title: 'Update failed', description: 'Please retry. If issue continues, contact admin.', variant: 'destructive' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-28">

      {/* Coloured hero header */}
      <div className={`${sc.bg} px-4 pt-10 pb-16 relative`}>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/20 rounded-full text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <div className="h-20 w-20 bg-white/20 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-2 border-2 border-white/40">
            {lead.name.charAt(0)}
          </div>
          <h1 className="text-xl font-bold text-white">{lead.name}</h1>
          <p className="text-white/80 text-sm mt-0.5">{lead.project}</p>
          <span className="mt-2 inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full border border-white/30">
            {sc.label}
          </span>
        </div>
      </div>

      {/* Call / WhatsApp floating above fold */}
      <div className="flex gap-3 justify-center -mt-6 mb-2 px-6">
        <button
          onClick={() => window.location.href = `tel:${lead.phone}`}
          className="flex-1 flex items-center justify-center gap-2 bg-white shadow-md rounded-xl py-3 text-blue-600 font-semibold text-sm border border-gray-100 active:scale-95 transition-transform"
        >
          <Phone size={16} /> Call
        </button>
        <WhatsAppButton
          leadName={lead.name}
          phoneNumber={lead.phone}
          projectName={lead.project}
          className="flex-1 flex items-center justify-center gap-2 bg-white shadow-md rounded-xl py-3 text-green-600 font-semibold text-sm border border-gray-100 active:scale-95 transition-transform"
          label="WhatsApp"
        />
      </div>

      <div className="px-4 space-y-4">

        {/* Booking details banner (shown only when Booked) */}
        {currentLeadStatus === 'Booked' && (lead.tokenAmount || lead.unitNumber) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h3 className="font-bold text-emerald-800 text-sm">Booking Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {lead.tokenAmount && (
                <div>
                  <p className="text-xs text-emerald-600">Token Amount</p>
                  <p className="font-bold text-emerald-900">₹{Number(lead.tokenAmount).toLocaleString('en-IN')}</p>
                </div>
              )}
              {lead.partialPayment && (
                <div>
                  <p className="text-xs text-emerald-600">Partial Payment</p>
                  <p className="font-bold text-emerald-900">₹{Number(lead.partialPayment).toLocaleString('en-IN')}</p>
                </div>
              )}
              {lead.paymentMode && (
                <div>
                  <p className="text-xs text-emerald-600">Payment Mode</p>
                  <p className="font-bold text-emerald-900">{lead.paymentMode}</p>
                </div>
              )}
              {lead.unitNumber && (
                <div>
                  <p className="text-xs text-emerald-600">Unit / Plot No.</p>
                  <p className="font-bold text-emerald-900">{lead.unitNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <IndianRupee size={13} />, label: 'Budget',   value: lead.budget ? `₹${lead.budget}` : 'N/A',     color: 'text-blue-600' },
            { icon: <Phone size={13} />,       label: 'Phone',    value: lead.phone,                                    color: 'text-gray-600' },
            { icon: <Tag size={13} />,         label: 'Source',   value: lead.source,                                   color: 'text-purple-600' },
            { icon: <MapPin size={13} />,      label: 'Interest', value: lead.interestLevel || 'Cold',                  color: 'text-orange-600' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className={`flex items-center gap-1 ${color} mb-1`}>
                {icon}
                <p className="text-xs font-medium">{label}</p>
              </div>
              <p className="font-semibold text-sm text-gray-900 truncate">{value}</p>
            </div>
          ))}

          {lead.followUpDate && (
            <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-1 text-amber-600 mb-1">
                <Calendar size={13} />
                <p className="text-xs font-medium">Follow-up Scheduled</p>
              </div>
              <p className="font-semibold text-sm text-amber-900">
                {new Date(lead.followUpDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                {lead.followUpTime && ` at ${lead.followUpTime}`}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Notes & History</h3>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                className="text-sm border-gray-200"
              />
              <Button size="sm" onClick={handleAddNote} className="shrink-0">Add</Button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {parsedNotes.length > 0 ? (
                parsedNotes.slice(0, 5).map((note, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {note.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-800 leading-snug">{note.text}</p>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>{note.author}</span>
                        <span>{note.timestamp ? new Date(note.timestamp).toLocaleDateString('en-IN') : ''}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-3">No notes yet. Add the first one!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20">
        <Button
          className={`w-full h-12 text-base font-bold ${sc.bg} ${sc.hover} text-white`}
          onClick={() => {
            setStatusForm({
              status:         normalizeLeadStatus(lead.status),
              followUpDate:   lead?.followUpDate?.split('T')[0] || '',
              followUpTime:   lead?.followUpTime    || '',
              bookingAmount:  lead?.bookingAmount   || lead?.partialPayment || '',
              tokenAmount:    lead?.tokenAmount     || '',
              partialPayment: lead?.partialPayment  || '',
              paymentMode:    lead?.paymentMode     || 'Cash',
              unitNumber:     lead?.unitNumber      || '',
              notes: '',
            });
            setIsUpdateOpen(true);
          }}
        >
          Update Status
        </Button>
      </div>

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="w-[92vw] max-w-md rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="border-b bg-slate-50 px-5 py-4 text-left rounded-t-2xl">
            <DialogTitle className="text-lg font-semibold text-slate-900">Update Lead Status</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Changes sync across all devices instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4 max-h-[72vh] overflow-y-auto">

            {/* Status select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Status</label>
              <Select value={statusForm.status} onValueChange={v => setStatusForm({ ...statusForm, status: v })}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="FollowUp">Follow Up</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Follow-up fields */}
            {statusForm.status === 'FollowUp' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Follow-up Date</label>
                  <Input
                    type="date"
                    value={statusForm.followUpDate}
                    onChange={e => setStatusForm({ ...statusForm, followUpDate: e.target.value })}
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Time</label>
                  <Input
                    type="time"
                    value={statusForm.followUpTime}
                    onChange={e => setStatusForm({ ...statusForm, followUpTime: e.target.value })}
                    className="h-10 border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Booking fields */}
            {statusForm.status === 'Booked' && (
              <div className="space-y-3 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Booking Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Booking Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 850000"
                      value={statusForm.bookingAmount}
                      onChange={e => setStatusForm({ ...statusForm, bookingAmount: e.target.value })}
                      className="h-9 border-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Token Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={statusForm.tokenAmount}
                      onChange={e => setStatusForm({ ...statusForm, tokenAmount: e.target.value })}
                      className="h-9 border-slate-200 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Partial Payment (₹)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 200000"
                      value={statusForm.partialPayment}
                      onChange={e => setStatusForm({ ...statusForm, partialPayment: e.target.value })}
                      className="h-9 border-slate-200 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Payment Mode</label>
                    <Select value={statusForm.paymentMode} onValueChange={v => setStatusForm({ ...statusForm, paymentMode: v })}>
                      <SelectTrigger className="h-9 border-slate-200 text-sm">
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Unit / Plot No.</label>
                    <Input
                      placeholder="e.g. A-204"
                      value={statusForm.unitNumber}
                      onChange={e => setStatusForm({ ...statusForm, unitNumber: e.target.value })}
                      className="h-9 border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason / Remarks</label>
              <Textarea
                placeholder="Why is the status changing?"
                value={statusForm.notes}
                onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="min-h-[80px] resize-none border-slate-200 text-sm"
              />
            </div>

            <Button onClick={handleUpdate} className="h-11 w-full text-sm font-semibold">
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileLeadDetails;
