
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export const FollowUpModal = ({ isOpen, onClose, onConfirm }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!date) return;
    onConfirm({ date, time, note });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Follow-Up</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note (Optional)</Label>
            <Textarea 
              placeholder="What to discuss next?" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600">Set Follow Up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const LostLeadModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!reason) return;
    onConfirm({ reason, note });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Lead as Lost</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason for Loss</Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Budget Issue">Budget Issue</SelectItem>
                <SelectItem value="Not Interested">Not Interested</SelectItem>
                <SelectItem value="Competitor">Bought Competitor Project</SelectItem>
                <SelectItem value="Location">Location Mismatch</SelectItem>
                <SelectItem value="No Response">Stopped Responding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea 
              placeholder="Any final feedback?" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="destructive">Mark Lost</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BookedModal = ({ isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState(''); // Could pass projects prop

  const handleSubmit = () => {
    if (!amount || !date) return;
    onConfirm({ amount, date, project });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎉 Close the Deal!</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
           <div className="space-y-2">
            <Label>Project Booked</Label>
            {/* Simple text input for demo, ideal is dropdown */}
            <Input placeholder="Enter Project Name" value={project} onChange={e => setProject(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Booking Amount (₹)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500000" />
            </div>
            <div className="space-y-2">
              <Label>Booking Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">Confirm Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
