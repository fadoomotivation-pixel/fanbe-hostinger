import React, { useState } from 'react';
import { X, Phone, Clock, MessageSquare, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { format, addDays, addHours } from 'date-fns';

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected - Spoke with Client', icon: '✅', color: 'green', needsFollowUp: false },
  { value: 'not_answered', label: 'Not Answered - No Pickup', icon: '📵', color: 'amber', needsFollowUp: true },
  { value: 'callback_requested', label: 'Callback Requested - Call Back Later', icon: '📞', color: 'blue', needsFollowUp: true },
  { value: 'wrong_number', label: 'Wrong Number - Invalid Contact', icon: '❌', color: 'red', needsFollowUp: false },
  { value: 'busy', label: 'Busy - Line Was Busy', icon: '📶', color: 'amber', needsFollowUp: true },
  { value: 'switched_off', label: 'Switched Off - Phone Was Off', icon: '🔌', color: 'gray', needsFollowUp: true },
  { value: 'voicemail', label: 'Voicemail - Left Message', icon: '💬', color: 'purple', needsFollowUp: true },
];

const getSmartFollowUpSuggestion = (outcome) => {
  const now = new Date();
  
  switch (outcome) {
    case 'connected':
      return {
        date: format(addDays(now, 2), 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        suggestion: 'Follow up in 2 days to maintain engagement'
      };
    case 'not_answered':
      return {
        date: format(addHours(now, 4), 'yyyy-MM-dd'),
        time: format(addHours(now, 4), 'HH:mm'),
        suggestion: 'Retry in 4 hours - different time may work better'
      };
    case 'callback_requested':
      return {
        date: format(addHours(now, 2), 'yyyy-MM-dd'),
        time: format(addHours(now, 2), 'HH:mm'),
        suggestion: 'Call back in 2 hours as requested'
      };
    case 'busy':
      return {
        date: format(addHours(now, 2), 'yyyy-MM-dd'),
        time: format(addHours(now, 2), 'HH:mm'),
        suggestion: 'Retry in 2 hours when line may be free'
      };
    case 'switched_off':
      return {
        date: format(addHours(now, 6), 'yyyy-MM-dd'),
        time: format(addHours(now, 6), 'HH:mm'),
        suggestion: 'Try again in 6 hours - phone may be on'
      };
    case 'voicemail':
      return {
        date: format(addDays(now, 1), 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        suggestion: 'Follow up tomorrow - they may return call'
      };
    case 'wrong_number':
      return {
        date: '',
        time: '',
        suggestion: 'Update lead with correct phone number'
      };
    default:
      return {
        date: format(addDays(now, 1), 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        suggestion: 'Follow up tomorrow'
      };
  }
};

const LogCallModal = ({ lead, isOpen, onClose, onSuccess }) => {
  const { addCallLog, updateLead } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    outcome: '',
    duration: '',
    notes: '',
    followUpDate: '',
    followUpTime: '',
  });

  const selectedOutcome = CALL_OUTCOMES.find(o => o.value === formData.outcome);
  const followUpSuggestion = formData.outcome ? getSmartFollowUpSuggestion(formData.outcome) : null;

  const handleOutcomeChange = (outcome) => {
    const suggestion = getSmartFollowUpSuggestion(outcome);
    setFormData({
      ...formData,
      outcome,
      followUpDate: suggestion.date,
      followUpTime: suggestion.time,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.outcome) {
      toast({
        title: 'Select Outcome',
        description: 'Please select a call outcome',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Log the call — employeeName is required to save to calls.employee_name column
      const callLog = {
        employeeId:   user?.uid || user?.id,
        employeeName: user?.name || user?.username || '',
        leadId:       lead.id,
        leadName:     lead.name,
        projectName:  lead.project || 'Not specified',
        type:         'outbound',
        status:       formData.outcome,
        duration:     parseInt(formData.duration) || 0,
        notes:        formData.notes || `Call ${formData.outcome.replace('_', ' ')}`,
      };

      await addCallLog(callLog);

      // Update lead with follow-up if needed
      const outcomeData = CALL_OUTCOMES.find(o => o.value === formData.outcome);
      if (outcomeData?.needsFollowUp && formData.followUpDate) {
        await updateLead(lead.id, {
          status: 'FollowUp',
          followUpDate: formData.followUpDate,
          follow_up_date: formData.followUpDate,
          followUpTime: formData.followUpTime,
          follow_up_time: formData.followUpTime,
          lastActivity: new Date().toISOString(),
        });
      } else {
        await updateLead(lead.id, {
          lastActivity: new Date().toISOString(),
        });
      }

      toast({
        title: '✅ Call Logged',
        description: `Call outcome recorded${outcomeData?.needsFollowUp ? ' with follow-up reminder' : ''}`,
      });

      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        outcome: '',
        duration: '',
        notes: '',
        followUpDate: '',
        followUpTime: '',
      });
    } catch (error) {
      console.error('Failed to log call:', error);
      toast({
        title: 'Error',
        description: 'Failed to log call. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Phone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Log Call</h2>
              <p className="text-sm text-white/80">{lead?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          {/* Call Outcome */}
          <div>
            <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
              <Phone size={18} className="text-blue-600" />
              Call Outcome *
            </Label>
            <Select value={formData.outcome} onValueChange={handleOutcomeChange} required>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="What happened during the call?" />
              </SelectTrigger>
              <SelectContent>
                {CALL_OUTCOMES.map((outcome) => (
                  <SelectItem key={outcome.value} value={outcome.value}>
                    <div className="flex items-center gap-2">
                      <span>{outcome.icon}</span>
                      <span>{outcome.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Smart Follow-up Suggestion */}
          {followUpSuggestion && selectedOutcome?.needsFollowUp && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-200">
              <div className="flex items-start gap-2 mb-3">
                <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Smart Suggestion</p>
                  <p className="text-xs text-purple-700 mt-1">{followUpSuggestion.suggestion}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Follow-up Date</Label>
                  <Input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Time</Label>
                  <Input
                    type="time"
                    value={formData.followUpTime}
                    onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Clock size={16} className="text-gray-600" />
              Call Duration (seconds)
            </Label>
            <Input
              type="number"
              placeholder="e.g., 120 for 2 minutes"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              min="0"
              className="h-11"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-600" />
              Call Notes
            </Label>
            <Textarea
              placeholder="What was discussed? Any important points?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
            >
              {loading ? 'Logging Call...' : '✅ Log Call'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 px-6"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogCallModal;
