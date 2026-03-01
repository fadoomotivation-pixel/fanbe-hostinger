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
import { ArrowLeft, CalendarDays, Clock, DollarSign, Mail, MapPin, Phone, User } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';

const statusStyles = {
  Booked: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FollowUp: 'bg-amber-100 text-amber-700 border-amber-200',
  Lost: 'bg-rose-100 text-rose-700 border-rose-200',
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
};

/**
 * Parse notes field from Supabase (string) OR legacy format (array of {text,timestamp,author})
 * Returns array of { text, author, timestamp } for rendering.
 */
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
  const { leads, updateLead, addLeadNote } = useCRMData();
  const { toast } = useToast();

  const lead = leads.find(l => l.id === leadId);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [statusForm, setStatusForm] = useState({
    status: lead?.status || 'Open',
    followUpDate: lead?.followUpDate?.split('T')[0] || '',
    followUpTime: lead?.followUpTime || '',
    notes: '',
  });

  if (!lead) return <div className="p-8 text-center">Lead not found</div>;

  const parsedNotes = parseNotes(lead.notes);

  const openUpdateModal = () => {
    setStatusForm({
      status: lead.status,
      followUpDate: lead?.followUpDate?.split('T')[0] || '',
      followUpTime: lead?.followUpTime || '',
      notes: '',
    });
    setIsUpdateModalOpen(true);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addLeadNote(lead.id, noteText, 'Sales Exec');
    setNoteText('');
    toast({ title: 'Note Added', description: 'Your note has been saved.' });
  };

  const handleUpdateStatus = () => {
    const isFollowUp = statusForm.status === 'FollowUp';
    updateLead(lead.id, {
      status: statusForm.status,
      followUpDate: isFollowUp ? statusForm.followUpDate : '',
      followUpTime: isFollowUp ? statusForm.followUpTime : '',
    });

    if (statusForm.notes.trim()) {
      addLeadNote(lead.id, statusForm.notes, 'Sales Exec (Status Update)');
    }

    setIsUpdateModalOpen(false);
    toast({ title: 'Status Updated', description: 'Lead status updated successfully.' });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-2 pb-6 md:px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-1 pl-0 text-slate-600 hover:bg-transparent hover:pl-1">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
      </Button>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-blue-100">
                <MapPin className="h-4 w-4" /> {lead.project}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[lead.status] || statusStyles.Open}`}>
                {lead.status}
              </span>
              {lead.followUpDate && (
                <span className="flex items-center gap-1 text-xs text-blue-100">
                  <CalendarDays className="h-3 w-3" /> Due {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button className="h-11 bg-white/15 text-white backdrop-blur hover:bg-white/25" onClick={() => window.location.href = `tel:${lead.phone}`}>
              <Phone className="mr-2 h-4 w-4" /> Call now
            </Button>
            <WhatsAppButton
              leadName={lead.name}
              projectName={lead.project}
              phoneNumber={lead.phone}
              className="h-11 border border-white/20 bg-white/10 text-white hover:bg-white/20"
            />
            <Button className="h-11 bg-white text-slate-900 hover:bg-slate-100" onClick={openUpdateModal}>
              Update Status
            </Button>
          </div>
        </div>

        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Phone</p>
            <p className="flex items-center text-sm font-semibold text-slate-800"><Phone className="mr-2 h-4 w-4 text-slate-400" />{lead.phone}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Email</p>
            <p className="flex items-center truncate text-sm font-semibold text-slate-800"><Mail className="mr-2 h-4 w-4 text-slate-400" />{lead.email || 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Budget</p>
            <p className="flex items-center text-sm font-semibold text-slate-800"><DollarSign className="mr-2 h-4 w-4 text-slate-400" />{lead.budget ? `₹${lead.budget}` : 'Not specified'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Source</p>
            <p className="flex items-center text-sm font-semibold text-slate-800"><User className="mr-2 h-4 w-4 text-slate-400" />{lead.source || 'N/A'}</p>
          </div>
          {lead.followUpDate && (
            <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-700">Follow-up Schedule</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <CalendarDays className="h-4 w-4" /> {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
                {lead.followUpTime && (
                  <>
                    <Clock className="ml-1 h-4 w-4" /> {lead.followUpTime}
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Notes & History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Add quick note for team handoff..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              className="h-11 border-slate-200"
            />
            <Button className="h-11 sm:px-5" onClick={handleAddNote}>Add Note</Button>
          </div>

          <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
            {parsedNotes.length > 0 ? (
              parsedNotes.map((note, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-slate-700">{note.text}</p>
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>{note.author}</span>
                    <span>{note.timestamp ? new Date(note.timestamp).toLocaleString('en-IN') : ''}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400">No notes yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[640px] rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="border-b bg-slate-50 px-6 py-4 text-left">
            <DialogTitle className="text-xl font-semibold text-slate-900">Update Lead Status</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Premium quick form for sub-admin and employee workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Status</label>
              <Select value={statusForm.status} onValueChange={(val) => setStatusForm({ ...statusForm, status: val })}>
                <SelectTrigger className="h-11 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="FollowUp">Follow Up</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusForm.status === 'FollowUp' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Follow-up Date</label>
                  <Input
                    type="date"
                    value={statusForm.followUpDate}
                    onChange={(e) => setStatusForm({ ...statusForm, followUpDate: e.target.value })}
                    className="h-11 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Time</label>
                  <Input
                    type="time"
                    value={statusForm.followUpTime}
                    onChange={(e) => setStatusForm({ ...statusForm, followUpTime: e.target.value })}
                    className="h-11 border-slate-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason / Remarks</label>
              <Textarea
                placeholder="Why is the status changing? Add clear action points for the team."
                value={statusForm.notes}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="min-h-[130px] resize-none border-slate-200"
              />
            </div>
          </div>

          <DialogFooter className="border-t bg-slate-50 px-6 py-4">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} className="min-w-36">Update Status</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeadDetails;
