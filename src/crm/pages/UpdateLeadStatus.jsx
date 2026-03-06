import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Save, Flame, Wind, Snowflake, Phone, PhoneOff, PhoneMissed,
  Calendar, IndianRupee, MapPin, CheckCircle2, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const UpdateLeadStatus = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { leads, leadsLoading, updateLead, addLeadNote, logCall } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const lead = leads.find(l => l.id === leadId);

  const [formData, setFormData] = useState({
    // Main action type
    actionType: 'quick_update', // quick_update, call_log, site_visit
    
    // Lead status
    status: 'Open',
    interestLevel: 'Warm',
    
    // Call outcomes
    callOutcome: '', // connected, not_answered, wrong_number, switched_off, busy
    callDuration: '',
    
    // Follow-up
    followUpDate: '',
    followUpTime: '',
    
    // Booking
    tokenAmount: '',
    bookingAmount: '',
    
    // Site visit
    visitDate: '',
    visitTime: '',
    
    // Notes
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        status: lead.status || 'Open',
        interestLevel: lead.interestLevel || lead.interest_level || 'Warm',
        followUpDate: lead.followUpDate || lead.follow_up_date || '',
        followUpTime: lead.followUpTime || lead.follow_up_time || '',
      }));
    }
  }, [lead]);

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Lead not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.notes.trim()) {
      toast({ title: 'Missing Info', description: 'Please add notes', variant: 'destructive' });
      return;
    }

    // Validation based on status
    if (formData.status === 'FollowUp' && !formData.followUpDate) {
      toast({ title: 'Missing Info', description: 'Select follow-up date', variant: 'destructive' });
      return;
    }

    if (formData.status === 'Booked' && (!formData.tokenAmount || !formData.bookingAmount)) {
      toast({ title: 'Missing Info', description: 'Enter payment details', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        status: formData.status,
        interestLevel: formData.interestLevel,
        interest_level: formData.interestLevel,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add call outcome if provided
      if (formData.callOutcome) {
        updateData.lastCallOutcome = formData.callOutcome;
        updateData.last_call_outcome = formData.callOutcome;
        updateData.lastCallTime = new Date().toISOString();
        updateData.last_call_time = new Date().toISOString();
      }

      if (formData.status === 'FollowUp') {
        updateData.followUpDate = formData.followUpDate;
        updateData.follow_up_date = formData.followUpDate;
        updateData.followUpTime = formData.followUpTime;
        updateData.follow_up_time = formData.followUpTime;
      }

      if (formData.status === 'Booked') {
        updateData.tokenAmount = parseFloat(formData.tokenAmount) || 0;
        updateData.token_amount = parseFloat(formData.tokenAmount) || 0;
        updateData.bookingAmount = parseFloat(formData.bookingAmount) || 0;
        updateData.booking_amount = parseFloat(formData.bookingAmount) || 0;
        updateData.bookedAt = new Date().toISOString();
        updateData.booked_at = new Date().toISOString();
      }

      await updateLead(lead.id, updateData);

      // Log call if outcome provided
      if (formData.callOutcome && logCall) {
        await logCall({
          leadId: lead.id,
          lead_id: lead.id,
          employeeId: user.id,
          employee_id: user.id,
          callTime: new Date().toISOString(),
          call_time: new Date().toISOString(),
          status: formData.callOutcome,
          duration: formData.callDuration || 0,
          notes: formData.notes,
        });
      }

      // Create note
      let noteText = `Status: ${formData.status}\nInterest: ${formData.interestLevel}`;
      
      if (formData.callOutcome) {
        const outcomeLabels = {
          connected: '✅ Call Connected',
          not_answered: '📵 Not Answered',
          wrong_number: '❌ Wrong Number',
          switched_off: '📴 Switched Off',
          busy: '📞 Busy'
        };
        noteText += `\nCall: ${outcomeLabels[formData.callOutcome]}`;
        if (formData.callDuration) noteText += ` (${formData.callDuration} min)`;
      }
      
      if (formData.followUpDate) {
        noteText += `\nFollow-up: ${format(new Date(formData.followUpDate), 'dd MMM yyyy')}${formData.followUpTime ? ' at ' + formData.followUpTime : ''}`;
      }
      
      if (formData.tokenAmount) {
        noteText += `\nToken: ₹${Number(formData.tokenAmount).toLocaleString('en-IN')}`;
      }
      
      if (formData.bookingAmount) {
        noteText += `\nBooking: ₹${Number(formData.bookingAmount).toLocaleString('en-IN')}`;
      }
      
      noteText += `\n\nNotes: ${formData.notes}`;

      await addLeadNote(lead.id, noteText, user?.name || 'Employee');

      toast({ title: '✅ Updated', description: 'Lead updated successfully' });
      navigate(`/crm/lead/${lead.id}`);
    } catch (error) {
      console.error('Failed to update:', error);
      toast({ title: 'Error', description: 'Failed to update lead', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const interestOptions = [
    { value: 'Hot', label: 'Hot', sublabel: 'Ready to Buy', icon: Flame, color: 'red' },
    { value: 'Warm', label: 'Warm', sublabel: 'Interested', icon: Wind, color: 'amber' },
    { value: 'Cold', label: 'Cold', sublabel: 'Just Inquiring', icon: Snowflake, color: 'blue' },
  ];

  const callOutcomes = [
    { value: 'connected', label: 'Connected', icon: Phone, color: 'green' },
    { value: 'not_answered', label: 'Not Answered', icon: PhoneMissed, color: 'yellow' },
    { value: 'wrong_number', label: 'Wrong Number', icon: XCircle, color: 'red' },
    { value: 'switched_off', label: 'Switched Off', icon: PhoneOff, color: 'gray' },
    { value: 'busy', label: 'Busy', icon: Phone, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">Update Lead</h1>
            <p className="text-xs text-gray-500 truncate">{lead.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-3">
        
        {/* QUICK ACTION TABS */}
        <div className="bg-white rounded-xl p-3 border shadow-sm">
          <Label className="text-xs font-semibold mb-2 block text-gray-600">QUICK ACTION</Label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, actionType: 'quick_update', callOutcome: '', visitDate: '' }));
              }}
              className={`p-2 rounded-lg text-xs font-medium transition ${
                formData.actionType === 'quick_update'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              Quick Update
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, actionType: 'call_log', visitDate: '' }));
              }}
              className={`p-2 rounded-lg text-xs font-medium transition ${
                formData.actionType === 'call_log'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              Log Call
            </button>
            <button
              type="button"
              onClick={() => {
                navigate(`/crm/sales/site-visits?leadId=${lead.id}`);
              }}
              className="p-2 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
            >
              Schedule Visit
            </button>
          </div>
        </div>

        {/* CALL OUTCOME - Only show if call_log selected */}
        {formData.actionType === 'call_log' && (
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <Label className="text-sm font-semibold mb-3 block text-gray-700">Call Outcome</Label>
            <div className="grid grid-cols-2 gap-2">
              {callOutcomes.map(outcome => {
                const Icon = outcome.icon;
                const isSelected = formData.callOutcome === outcome.value;
                return (
                  <button
                    key={outcome.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, callOutcome: outcome.value })}
                    className={`p-3 rounded-lg border-2 transition flex items-center gap-2 ${
                      isSelected
                        ? `bg-${outcome.color}-50 border-${outcome.color}-300 ring-1 ring-${outcome.color}-200`
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? `text-${outcome.color}-600` : 'text-gray-400'} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                      {outcome.label}
                    </span>
                    {isSelected && <CheckCircle2 size={14} className="ml-auto text-blue-600" />}
                  </button>
                );
              })}
            </div>
            
            {formData.callOutcome === 'connected' && (
              <div className="mt-3">
                <Label className="text-xs mb-1 block text-gray-600">Call Duration (minutes)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.callDuration}
                  onChange={e => setFormData({ ...formData, callDuration: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* STATUS */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-3 block text-gray-700">Lead Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {['Open', 'FollowUp', 'Booked', 'Lost'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={`p-2.5 rounded-lg text-xs font-semibold border-2 transition ${
                  formData.status === status
                    ? status === 'Booked' ? 'bg-green-50 border-green-300 text-green-700' :
                      status === 'FollowUp' ? 'bg-orange-50 border-orange-300 text-orange-700' :
                      status === 'Lost' ? 'bg-gray-50 border-gray-300 text-gray-700' :
                      'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                {status === 'FollowUp' ? 'Follow Up' : status}
              </button>
            ))}
          </div>
        </div>

        {/* INTEREST LEVEL */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-3 block text-gray-700">Interest Level</Label>
          <div className="grid grid-cols-3 gap-2">
            {interestOptions.map(option => {
              const Icon = option.icon;
              const isSelected = formData.interestLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, interestLevel: option.value })}
                  className={`p-3 rounded-lg border-2 transition ${
                    isSelected
                      ? `bg-${option.color}-50 border-${option.color}-300`
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon size={20} className={isSelected ? `text-${option.color}-600` : 'text-gray-300'} />
                    <p className={`font-bold text-xs ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{option.label}</p>
                    <p className="text-[10px] text-gray-400">{option.sublabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FOLLOW-UP */}
        {formData.status === 'FollowUp' && (
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-semibold text-blue-800">Schedule Follow-up *</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block text-blue-700">Date</Label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required={formData.status === 'FollowUp'}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-blue-700">Time</Label>
                <Input
                  type="time"
                  value={formData.followUpTime}
                  onChange={e => setFormData({ ...formData, followUpTime: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* BOOKING */}
        {formData.status === 'Booked' && (
          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-green-600" />
              <Label className="text-sm font-semibold text-green-800">Payment Details *</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block text-green-700">Token Amount</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.tokenAmount}
                  onChange={e => setFormData({ ...formData, tokenAmount: e.target.value })}
                  required={formData.status === 'Booked'}
                  min="0"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-green-700">Booking Amount</Label>
                <Input
                  type="number"
                  placeholder="5000000"
                  value={formData.bookingAmount}
                  onChange={e => setFormData({ ...formData, bookingAmount: e.target.value })}
                  required={formData.status === 'Booked'}
                  min="0"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* NOTES */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-2 block text-gray-700">Update Notes *</Label>
          <Textarea
            placeholder="What happened? What's the next step?"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            required
            className="text-sm"
          />
        </div>

        {/* SUBMIT */}
        <div className="flex gap-3 pt-2 pb-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            <Save size={16} className="mr-2" />
            {loading ? 'Saving...' : 'Update Lead'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-12 px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateLeadStatus;
