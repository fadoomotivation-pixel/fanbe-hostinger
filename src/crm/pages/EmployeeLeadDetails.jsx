import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Phone, User, Mail, DollarSign, Clock, MapPin, ArrowLeft } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';

const normalizeLeadStatus = (status) => {
  if (!status) return 'Open';
  const cleaned = String(status).trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (cleaned === 'followup') return 'FollowUp';
  if (cleaned === 'booked') return 'Booked';
  if (cleaned === 'lost') return 'Lost';
  return 'Open';
};

/**
 * Parse notes field from Supabase (string) OR legacy format (array of {text,timestamp,author})
 * Returns array of { text, author, timestamp } for rendering.
 */
const parseNotes = (notes) => {
  if (!notes) return [];

  if (Array.isArray(notes)) {
    return notes.map(n => ({
      text:      n.text || String(n),
      author:    n.author || 'Team',
      timestamp: n.timestamp || null,
    }));
  }

  if (typeof notes === 'string' && notes.trim() !== '') {
    return notes
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const match = line.match(/^\[(.+?)\]\s*(.+?):\s*(.*)$/);
        if (match) {
          return { timestamp: match[1], author: match[2].trim(), text: match[3].trim() };
        }
        return { text: line.trim(), author: 'Team', timestamp: null };
      })
      .reverse();
  }

  return [];
};

const EmployeeLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addLeadNote, addBookingLog } = useCRMData();
  const { toast } = useToast();

  const lead = leads.find(l => l.id === leadId);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [statusForm, setStatusForm] = useState({
    status:         normalizeLeadStatus(lead?.status),
    followUpDate:   lead?.followUpDate?.split('T')[0] || '',
    followUpTime:   lead?.followUpTime || '',
    bookingAmount:  lead?.bookingAmount || lead?.partialPayment || '',
    tokenAmount:    lead?.tokenAmount || '',
    partialPayment: lead?.partialPayment || '',
    paymentMode:    lead?.paymentMode || 'Cash',
    unitNumber:     lead?.unitNumber || '',
    notes:          ''
  });

  if (!lead) return <div className="p-8 text-center">Lead not found</div>;

  const currentLeadStatus = normalizeLeadStatus(lead.status);
  const parsedNotes = parseNotes(lead.notes);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addLeadNote(lead.id, noteText, 'Sales Exec');
    setNoteText('');
    toast({ title: 'Note Added', description: 'Your note has been saved.' });
  };

  const handleUpdateStatus = async () => {
    const isFollowUp = statusForm.status === 'FollowUp';
    const isBooked = statusForm.status === 'Booked';
    const wasBooked = currentLeadStatus === 'Booked';

    if (isFollowUp && !statusForm.followUpDate) {
      toast({ title: 'Follow-up date missing', description: 'Please select a follow-up date.', variant: 'destructive' });
      return;
    }

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

    if (isBooked && !wasBooked) {
      const employeeId = lead.assignedTo || lead.assigned_to;
      if (employeeId) {
        const amount = Number(statusForm.bookingAmount || statusForm.partialPayment || statusForm.tokenAmount || 0);
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
        console.warn('[EmployeeLeadDetails] Missing employee assignment for booking log', lead.id);
      }
    }

    if (statusForm.notes) addLeadNote(lead.id, statusForm.notes, 'Sales Exec (Status Update)');
    setIsUpdateModalOpen(false);
    toast({ title: 'Status Updated', description: 'Lead status updated successfully!' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-[#0F3A5F]">{lead.name}</CardTitle>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" /> {lead.project}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold
                  ${ currentLeadStatus === 'Booked'   ? 'bg-green-100 text-green-700' :
                     currentLeadStatus === 'FollowUp' ? 'bg-yellow-100 text-yellow-700' :
                     currentLeadStatus === 'Lost'     ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700' }`}>
                  {currentLeadStatus}
                </span>
                {lead.followUpDate && (
                  <span className="text-xs text-red-500 font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Due: {new Date(lead.followUpDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium truncate">{lead.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded">
                <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="font-medium">{lead.budget ? `₹${lead.budget}` : 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="font-medium">{lead.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = `tel:${lead.phone}`}>
              <Phone className="mr-2 h-4 w-4" /> Call
            </Button>
            <WhatsAppButton leadName={lead.name} projectName={lead.project} phoneNumber={lead.phone} className="w-full" />
            <Button variant="outline" className="w-full border-blue-600 text-blue-600" onClick={() => setIsUpdateModalOpen(true)}>
              Update Status
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Notes & History</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a quick note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button onClick={handleAddNote}>Add</Button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {parsedNotes.length > 0 ? (
                  parsedNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-100 text-sm">
                      <p className="text-gray-800">{note.text}</p>
                      <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{note.author}</span>
                        <span>{note.timestamp ? new Date(note.timestamp).toLocaleString('en-IN') : ''}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No notes yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[620px] rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="border-b bg-slate-50 px-6 py-4 text-left">
            <DialogTitle className="text-xl font-semibold text-slate-900">Update Lead Status</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Use the same status flow on desktop and mobile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Status</label>
              <Select value={statusForm.status} onValueChange={(val) => setStatusForm({ ...statusForm, status: val })}>
                <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="FollowUp">Follow Up</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusForm.status === 'FollowUp' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Follow-up Date</label>
                  <Input
                    type="date"
                    value={statusForm.followUpDate}
                    onChange={(e) => setStatusForm({ ...statusForm, followUpDate: e.target.value })}
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Time</label>
                  <Input
                    type="time"
                    value={statusForm.followUpTime}
                    onChange={(e) => setStatusForm({ ...statusForm, followUpTime: e.target.value })}
                    className="h-10 border-slate-200"
                  />
                </div>
              </div>
            )}

            {statusForm.status === 'Booked' && (
              <div className="space-y-3 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Booking Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Booking Amount (₹)</label>
                    <Input type="number" value={statusForm.bookingAmount} onChange={(e) => setStatusForm({ ...statusForm, bookingAmount: e.target.value })} className="h-9 border-slate-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Token Amount (₹)</label>
                    <Input type="number" value={statusForm.tokenAmount} onChange={(e) => setStatusForm({ ...statusForm, tokenAmount: e.target.value })} className="h-9 border-slate-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Partial Payment (₹)</label>
                    <Input type="number" value={statusForm.partialPayment} onChange={(e) => setStatusForm({ ...statusForm, partialPayment: e.target.value })} className="h-9 border-slate-200 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Unit / Plot No.</label>
                    <Input value={statusForm.unitNumber} onChange={(e) => setStatusForm({ ...statusForm, unitNumber: e.target.value })} className="h-9 border-slate-200 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Payment Mode</label>
                  <Select value={statusForm.paymentMode} onValueChange={(val) => setStatusForm({ ...statusForm, paymentMode: val })}>
                    <SelectTrigger className="h-9 border-slate-200 text-sm"><SelectValue /></SelectTrigger>
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
              <label className="text-sm font-medium text-slate-700">Reason / Remarks</label>
              <Textarea
                placeholder="Why is the status changing?"
                value={statusForm.notes}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="min-h-[120px] resize-none border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="border-t bg-slate-50 px-6 py-4">
            <Button onClick={handleUpdateStatus} className="min-w-36">Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeadDetails;
