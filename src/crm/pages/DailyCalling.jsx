
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Clock, User } from 'lucide-react';

const DailyCalling = () => {
  const { user } = useAuth();
  const { leads, addCallLog, calls } = useCRMData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'Outgoing',
    status: 'Connected',
    duration: '',
    notes: ''
  });

  const myLeads = leads.filter(l => l.assignedTo === user?.id);
  const myCalls = calls.filter(c => c.employeeId === user?.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.leadId) return toast({ title: "Error", description: "Select a lead", variant: "destructive" });

    const lead = myLeads.find(l => l.id === formData.leadId);
    
    addCallLog({
      ...formData,
      employeeId: user.id,
      leadName: lead?.name || 'Unknown',
      projectName: lead?.project || 'General',
      duration: parseInt(formData.duration) || 0
    });

    toast({ title: "Success", description: "Call logged successfully" });
    setFormData({ leadId: '', type: 'Outgoing', status: 'Connected', duration: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Daily Calling Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Log New Call</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Select Lead</label>
                  <Select value={formData.leadId} onValueChange={(val) => setFormData({...formData, leadId: val})}>
                     <SelectTrigger><SelectValue placeholder="Search Lead" /></SelectTrigger>
                     <SelectContent>
                        {myLeads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} - {l.project}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Type</label>
                     <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="Outgoing">Outgoing</SelectItem>
                           <SelectItem value="Incoming">Incoming</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Duration (min)</label>
                     <Input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Connected">Connected</SelectItem>
                        <SelectItem value="Not Connected">Not Connected</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                        <SelectItem value="Voicemail">Voicemail</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Call summary..." />
               </div>
               <Button type="submit" className="w-full">Save Call Log</Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Call History</CardTitle></CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Time</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {myCalls.slice(0, 10).map(call => (
                      <TableRow key={call.id}>
                         <TableCell className="font-medium">{call.leadName}</TableCell>
                         <TableCell>{call.type}</TableCell>
                         <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs ${call.status === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                               {call.status}
                            </span>
                         </TableCell>
                         <TableCell>{call.duration}m</TableCell>
                         <TableCell className="text-gray-500 text-xs">{new Date(call.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                   ))}
                   {myCalls.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No calls logged yet.</TableCell></TableRow>}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyCalling;
