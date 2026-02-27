import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Bell } from 'lucide-react';
import { format } from 'date-fns';

const FollowUpScheduler = ({ isOpen, onClose, onSave, lead }) => {
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!followUpDate) {
      alert('Please select a follow-up date');
      return;
    }

    onSave({
      follow_up_date: followUpDate,
      follow_up_time: followUpTime,
      follow_up_notes: notes,
      follow_up_status: 'pending',
      last_contact_date: new Date().toISOString(),
      last_contact_method: 'call'
    });

    // Reset form
    setFollowUpDate('');
    setFollowUpTime('10:00');
    setNotes('');
    onClose();
  };

  const quickDateOptions = [
    { label: 'Tomorrow', days: 1 },
    { label: 'In 3 Days', days: 3 },
    { label: 'Next Week', days: 7 },
    { label: 'In 2 Weeks', days: 14 }
  ];

  const setQuickDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFollowUpDate(date.toISOString().split('T')[0]);
  };

  const getPriorityBadge = () => {
    if (!followUpDate) return null;

    const today = new Date().toISOString().split('T')[0];
    const selected = new Date(followUpDate);
    const now = new Date();
    const diffDays = Math.ceil((selected - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">⚠️ Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">🟡 Today</span>;
    } else if (diffDays === 1) {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">🔵 Tomorrow</span>;
    } else if (diffDays <= 7) {
      return <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">📅 This Week</span>;
    } else {
      return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">🗓️ Future</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Calendar size={20} /> Schedule Follow-up Call
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            {lead?.name} • {lead?.phone}
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Quick Date Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Quick Select</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickDateOptions.map((option) => (
                <Button
                  key={option.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDate(option.days)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                Follow-up Date <span className="text-red-500">*</span>
              </span>
              {getPriorityBadge()}
            </Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Clock size={14} /> Preferred Time
            </Label>
            <Input
              type="time"
              value={followUpTime}
              onChange={e => setFollowUpTime(e.target.value)}
            />
            <p className="text-xs text-gray-500">Time is optional and for your reference</p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Follow-up Notes</Label>
            <Textarea
              placeholder="What to discuss when you call back...\ne.g. Send brochure, Discuss pricing, Schedule site visit"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <Bell className="text-blue-600 shrink-0" size={16} />
              <div>
                <p className="text-xs text-blue-800 font-medium mb-1">
                  📌 This lead will appear at the top of your list on the scheduled date
                </p>
                <p className="text-xs text-blue-700">
                  You'll never miss important follow-ups!
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!followUpDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Calendar size={16} className="mr-1" />
            Schedule Follow-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpScheduler;
