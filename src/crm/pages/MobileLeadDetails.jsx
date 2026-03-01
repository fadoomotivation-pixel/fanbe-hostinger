import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Clock3, Phone } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const statusStyles = {
  Booked: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FollowUp: 'bg-amber-100 text-amber-700 border-amber-200',
  Lost: 'bg-rose-100 text-rose-700 border-rose-200',
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
};

/**
 * Parse notes field: Supabase string OR legacy array of {text, timestamp, author}
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

const MobileLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addLeadNote } = useCRMData();
  const { toast } = useToast();

  const lead = leads.find(l => l.id === leadId);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
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
    setIsUpdateOpen(true);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addLeadNote(lead.id, noteText, 'Sales (Mobile)');
    setNoteText('');
    toast({ title: 'Note Added', description: 'Note saved successfully.' });
  };

  const handleUpdate = () => {
    const isFollowUp = statusForm.status === 'FollowUp';
    updateLead(lead.id, {
      status: statusForm.status,
      followUpDate: isFollowUp ? statusForm.followUpDate : '',
      followUpTime: isFollowUp ? statusForm.followUpTime : '',
    });

    if (statusForm.notes.trim()) {
      addLeadNote(lead.id, statusForm.notes, 'Sales (Mobile)');
    }

    toast({ title: 'Success', description: 'Lead updated successfully.' });
    setIsUpdateOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-28">
      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{lead.name}</p>
            <p className="truncate text-xs text-slate-500">{lead.project}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900">{lead.name}</p>
              <p className="text-sm text-slate-500">{lead.source || 'Lead source unavailable'}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[lead.status] || statusStyles.Open}`}>
              {lead.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              className="h-11 rounded-xl bg-slate-900 text-sm font-semibold hover:bg-slate-800"
              onClick={() => window.location.href = `tel:${lead.phone}`}
            >
              <Phone className="mr-2 h-4 w-4" /> Call
            </Button>
            <WhatsAppButton
              leadName={lead.name}
              phoneNumber={lead.phone}
              projectName={lead.project}
              className="h-11 rounded-xl text-sm font-semibold"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Budget</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{lead.budget ? `₹${lead.budget}` : 'N/A'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800">{lead.phone}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Interest</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{lead.interestLevel || 'Cold'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Next task</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{lead.status === 'FollowUp' ? 'Follow-up' : 'Status update'}</p>
          </div>
          {lead.followUpDate && (
            <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
              <p className="text-xs font-medium text-amber-700">Follow-up scheduled</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-800">
                <CalendarDays className="h-4 w-4" /> {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
                {lead.followUpTime && (
                  <>
                    <Clock3 className="ml-2 h-4 w-4" /> {lead.followUpTime}
                  </>
                )}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Notes & History</h3>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Add quick note for team..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              className="h-10 border-slate-200"
            />
            <Button className="h-10 px-4" onClick={handleAddNote}>Add</Button>
          </div>

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {parsedNotes.length > 0 ? (
              parsedNotes.slice(0, 8).map((note, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs leading-relaxed text-slate-700">{note.text}</p>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                    <span>{note.author}</span>
                    <span>{note.timestamp ? new Date(note.timestamp).toLocaleDateString('en-IN') : ''}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-5 text-center text-xs text-slate-400">No notes yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <Button className="h-12 w-full rounded-xl text-base font-semibold" onClick={openUpdateModal}>
          Update Status
        </Button>
      </div>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="w-[94vw] max-w-md rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="border-b bg-slate-50 px-5 py-4 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-900">Update Lead Status</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quick update designed for fast field work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Status</label>
              <Select value={statusForm.status} onValueChange={v => setStatusForm({ ...statusForm, status: v })}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="Select status" />
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason / Remarks</label>
              <Textarea
                placeholder="Add context for manager and next caller..."
                value={statusForm.notes}
                onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="min-h-[110px] resize-none border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" onClick={() => setIsUpdateOpen(false)}>
                Cancel
              </Button>
              <Button className="h-11 font-semibold" onClick={handleUpdate}>
                Save Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileLeadDetails;
