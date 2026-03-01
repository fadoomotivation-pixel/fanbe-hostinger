import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Clock, DollarSign, MapPin } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

/**
 * Parse notes field: Supabase string OR legacy array of {text, timestamp, author}
 */
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
    if (statusForm.notes) addLeadNote(lead.id, statusForm.notes, 'Sales (Mobile)');
    toast({ title: 'Success', description: 'Status Updated' });
    setIsUpdateOpen(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 border-b sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
        <h1 className="font-bold text-lg truncate">{lead.name}</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Info */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
            {lead.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
          <p className="text-gray-500 mb-1">{lead.project}</p>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            lead.status === 'Booked'   ? 'bg-green-100 text-green-700' :
            lead.status === 'FollowUp' ? 'bg-yellow-100 text-yellow-700' :
            lead.status === 'Lost'     ? 'bg-red-100 text-red-700' :
                                         'bg-blue-100 text-blue-700'
          }`}>{lead.status}</span>

          <div className="flex gap-3 justify-center mt-4">
            <Button className="rounded-full w-12 h-12 p-0" onClick={() => window.location.href = `tel:${lead.phone}`}>
              <Phone size={20} />
            </Button>
            <WhatsAppButton
              leadName={lead.name}
              phoneNumber={lead.phone}
              projectName={lead.project}
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-xs text-gray-400">Budget</p>
            <p className="font-medium text-sm">{lead.budget ? `₹${lead.budget}` : 'N/A'}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-xs text-gray-400">Phone</p>
            <p className="font-medium text-sm">{lead.phone}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-xs text-gray-400">Source</p>
            <p className="font-medium text-sm">{lead.source}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-xs text-gray-400">Interest</p>
            <p className="font-medium text-sm">{lead.interestLevel || 'Cold'}</p>
          </div>
          {lead.followUpDate && (
            <div className="bg-white p-3 rounded-lg border col-span-2">
              <p className="text-xs text-gray-400">Follow-up Date</p>
              <p className="font-medium text-sm text-orange-600">
                {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Notes & History</h3>

          {/* Add Note */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              className="text-sm"
            />
            <Button size="sm" onClick={handleAddNote}>Add</Button>
          </div>

          {/* Notes List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {parsedNotes.length > 0 ? (
              parsedNotes.slice(0, 5).map((note, i) => (
                <div key={i} className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-gray-800">{note.text}</p>
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>{note.author}</span>
                    <span>{note.timestamp ? new Date(note.timestamp).toLocaleDateString('en-IN') : ''}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">No notes yet.</p>
            )}
          </div>
        </div>

        <Button
          className="w-full h-12 text-base font-bold"
          onClick={() => {
            setStatusForm({
              status: lead.status,
              followUpDate: lead?.followUpDate?.split('T')[0] || '',
              followUpTime: lead?.followUpTime || '',
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
          <DialogHeader className="border-b bg-slate-50 px-5 py-4 text-left">
            <DialogTitle className="text-lg font-semibold text-slate-900">Update Lead Status</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Keep status updates consistent across desktop and mobile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
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
                placeholder="Why is the status changing?"
                value={statusForm.notes}
                onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="min-h-[100px] resize-none border-slate-200"
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
