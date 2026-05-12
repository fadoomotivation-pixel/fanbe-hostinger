
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

const SiteVisits = () => {
  const { user } = useAuth();
  const { leads, addSiteVisitLog, siteVisits } = useCRMData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    leadId: '',
    date: '',
    duration: '',
    interest: 'Medium',
    feedback: ''
  });

  const myLeads = leads.filter(l => l.assignedTo === user?.id);
  const myVisits = siteVisits.filter(v => v.employeeId === user?.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.leadId) return toast({ title: "Error", description: "Select a lead", variant: "destructive" });

    const lead = myLeads.find(l => l.id === formData.leadId);
    
    addSiteVisitLog({
      ...formData,
      employeeId: user.id,
      leadName: lead?.name || 'Unknown',
      projectName: lead?.project || 'General'
    });

    toast({ title: "Success", description: "Site visit logged" });
    setFormData({ leadId: '', date: '', duration: '', interest: 'Medium', feedback: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Site Visit Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Log Visit</CardTitle></CardHeader>
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
               <div className="space-y-2">
                  <label className="text-sm font-medium">Visit Date & Time</label>
                  <Input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Interest Level</label>
                  <Select value={formData.interest} onValueChange={(val) => setFormData({...formData, interest: val})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Feedback</label>
                  <Textarea value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} placeholder="Client feedback..." />
               </div>
               <Button type="submit" className="w-full">Save Visit Log</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Visit History</CardTitle></CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Feedback</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {myVisits.map(visit => (
                      <TableRow key={visit.id}>
                         <TableCell className="font-medium">{visit.leadName}</TableCell>
                         <TableCell>{new Date(visit.date).toLocaleString()}</TableCell>
                         <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs ${visit.interest === 'High' ? 'bg-green-100 text-green-800' : visit.interest === 'Low' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                               {visit.interest}
                            </span>
                         </TableCell>
                         <TableCell className="max-w-[200px] truncate">{visit.feedback}</TableCell>
                      </TableRow>
                   ))}
                   {myVisits.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No visits logged.</TableCell></TableRow>}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteVisits;
