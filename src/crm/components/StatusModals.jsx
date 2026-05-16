import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, CheckCircle } from 'lucide-react';

// ── Follow Up Modal ───────────────────────────────────────────────────
export const FollowUpModal = ({ isOpen, onClose, onSave, lead }) => {
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!followUpDate) return;
    onSave({ followUpDate, notes });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" /> Schedule Follow Up
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="space-y-1">
            <Label>Follow Up Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="What to discuss..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!followUpDate}>Save Follow Up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Site Visit Modal ──────────────────────────────────────────────────
export const SiteVisitModal = ({ isOpen, onClose, onSave, lead }) => {
  const [visitDate, setVisitDate] = useState('');
  const [visitStatus, setVisitStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave({ visitDate, visitStatus, notes });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin size={18} className="text-purple-600" /> Log Site Visit
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="space-y-1">
            <Label>Visit Date</Label>
            <Input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Visit Status</Label>
            <Select value={visitStatus} onValueChange={setVisitStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                <SelectItem value="not_planned">Not Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Visit feedback..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Visit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Booking Modal ─────────────────────────────────────────────────────
export const BookingModal = ({ isOpen, onClose, onSave, lead }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave({ bookingDate, tokenAmount, unit, notes });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" /> Log Booking
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="space-y-1">
            <Label>Booking Date</Label>
            <Input
              type="date"
              value={bookingDate}
              onChange={e => setBookingDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Token Amount (₹)</Label>
            <Input
              type="number"
              placeholder="50000"
              value={tokenAmount}
              onChange={e => setTokenAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Unit / Plot No.</Label>
            <Input
              placeholder="e.g. B-204"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Booking details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Confirm Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
