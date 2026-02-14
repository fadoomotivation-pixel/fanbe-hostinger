
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

const Bookings = () => {
  const { user } = useAuth();
  const { leads, addBookingLog, bookings } = useCRMData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    leadId: '',
    date: '',
    amount: '',
    status: 'Pending',
    notes: ''
  });

  const myLeads = leads.filter(l => l.assignedTo === user?.id);
  const myBookings = bookings.filter(b => b.employeeId === user?.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.leadId) return toast({ title: "Error", description: "Select a lead", variant: "destructive" });

    const lead = myLeads.find(l => l.id === formData.leadId);
    
    addBookingLog({
      ...formData,
      employeeId: user.id,
      leadName: lead?.name || 'Unknown',
      projectName: lead?.project || 'General'
    });

    toast({ title: "Success", description: "Booking logged successfully!" });
    setFormData({ leadId: '', date: '', amount: '', status: 'Pending', notes: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Booking Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>New Booking</CardTitle></CardHeader>
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
                  <label className="text-sm font-medium">Booking Date</label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (₹)</label>
                  <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
               </div>
               <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Submit Booking</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {myBookings.map(b => (
                      <TableRow key={b.id}>
                         <TableCell className="font-medium">{b.leadName}</TableCell>
                         <TableCell>{b.projectName}</TableCell>
                         <TableCell>₹{b.amount}</TableCell>
                         <TableCell>
                            <span className={`px-2 py-0.5 rounded text-xs ${b.status === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100'}`}>
                               {b.status}
                            </span>
                         </TableCell>
                         <TableCell>{b.date}</TableCell>
                      </TableRow>
                   ))}
                   {myBookings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No bookings yet.</TableCell></TableRow>}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bookings;
