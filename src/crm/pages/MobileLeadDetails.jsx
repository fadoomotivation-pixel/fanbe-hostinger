
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Calendar, Clock, DollarSign, MapPin, Edit2 } from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const MobileLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addLeadNote } = useCRMData();
  const { toast } = useToast();
  
  const lead = leads.find(l => l.id === leadId);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });

  if(!lead) return <div className="p-8 text-center">Lead not found</div>;

  const handleUpdate = () => {
      updateLead(lead.id, { status: statusForm.status });
      if(statusForm.notes) addLeadNote(lead.id, statusForm.notes, 'Sales (Mobile)');
      toast({ title: "Success", description: "Status Updated" });
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
                <p className="text-gray-500 mb-4">{lead.project}</p>
                
                <div className="flex gap-3 justify-center">
                    <Button className="rounded-full w-12 h-12 p-0" onClick={() => window.location.href=`tel:${lead.phone}`}>
                        <Phone size={20} />
                    </Button>
                    <WhatsAppButton 
                        leadName={lead.name}
                        phoneNumber={lead.phone}
                        className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
                    >
                    </WhatsAppButton>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="font-medium text-sm">{lead.status}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-400">Budget</p>
                    <p className="font-medium text-sm">₹{lead.budget}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium text-sm">{lead.phone}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-400">Source</p>
                    <p className="font-medium text-sm">{lead.source}</p>
                </div>
            </div>

            {/* Notes */}
            <div className="bg-white p-4 rounded-xl border">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Recent Notes</h3>
                <div className="space-y-3">
                    {lead.notes?.slice(0, 3).map((note, i) => (
                        <div key={i} className="text-xs bg-gray-50 p-2 rounded">
                            <p>{note.text}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(note.timestamp).toLocaleDateString()}</p>
                        </div>
                    ))}
                    {(!lead.notes || lead.notes.length === 0) && <p className="text-xs text-gray-400">No notes yet.</p>}
                </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold" onClick={() => { setStatusForm({ status: lead.status, notes: '' }); setIsUpdateOpen(true); }}>
                Update Status
            </Button>
        </div>

        {/* Update Dialog */}
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
            <DialogContent className="max-w-[90%] rounded-xl">
                <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <Select value={statusForm.status} onValueChange={v => setStatusForm({...statusForm, status: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="FollowUp">Follow Up</SelectItem>
                            <SelectItem value="Booked">Booked</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                    </Select>
                    <Textarea 
                        placeholder="Add a note..." 
                        value={statusForm.notes} 
                        onChange={e => setStatusForm({...statusForm, notes: e.target.value})} 
                    />
                    <Button onClick={handleUpdate} className="w-full">Save Update</Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default MobileLeadDetails;
