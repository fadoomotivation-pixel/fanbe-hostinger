import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { addDays, format } from 'date-fns';

const UpdateLeadStatus = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, leadsLoading, updateLead, addLeadNote, addCallLog } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const lead = leads.find(l => l.id === leadId);

  const [formData, setFormData] = useState({
    actionType: 'quick_update',
    status: 'Open',
    interestLevel: 'Warm',
    callOutcome: '',
    callDuration: '',
    followUpDate: '',
    followUpTime: '',
    tokenAmount: '',
    bookingAmount: '',
    visitDate: '',
    visitTime: '',
    notes: '',
    workStage: 'to_do',
  });

  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        status: lead.status || 'Open',
        interestLevel: lead.interestLevel || lead.interest_level || 'Warm',
        followUpDate: lead.followUpDate || lead.follow_up_date || '',
        followUpTime: lead.followUpTime || lead.follow_up_time || '',
        workStage: lead.callAttempt || lead.call_attempt || 'to_do',
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
        callAttempt: formData.workStage,
        callStatus: formData.callOutcome || 'pending_action',
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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

      // ✅ Pass employeeName so calls table employee_name column is populated
      if (formData.callOutcome) {
        await addCallLog({
          leadId:      lead.id,
          employeeId:  user.id,
          employeeName: user.name || user.username || '',
          leadName:    lead.name,
          projectName: lead.project || 'General',
          type:        'Outgoing',
          status:      formData.callOutcome,
          duration:    Number(formData.callDuration) || 0,
          notes:       formData.notes,
        });
      }

      let noteText = `Status: ${formData.status}\nInterest: ${formData.interestLevel}\nWork Stage: ${formData.workStage}`;
      if (formData.callOutcome) {
        const outcomeLabels = {
          connected:    '✅ Call Connected',
          not_answered: '📵 Not Answered',
          wrong_number: '❌ Wrong Number',
          switched_off: '📴 Switched Off',
          busy:         '📞 Busy'
        };
        noteText += `\nCall: ${outcomeLabels[formData.callOutcome]}`;
        if (formData.callDuration) noteText += ` (${formData.callDuration} min)`;
      }
      if (formData.followUpDate) {
        noteText += `\nFollow-up: ${format(new Date(formData.followUpDate), 'dd MMM yyyy')}${formData.followUpTime ? ' at ' + formData.followUpTime : ''}`;
      }
      if (formData.tokenAmount)   noteText += `\nToken: ₹${Number(formData.tokenAmount).toLocaleString('en-IN')}`;
      if (formData.bookingAmount) noteText += `\nBooking: ₹${Number(formData.bookingAmount).toLocaleString('en-IN')}`;
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
    { value: 'Hot',  label: 'Hot',  sublabel: 'Ready to Buy',   icon: Flame,    selectedClass: 'bg-red-50 border-red-300',    iconClass: 'text-red-600'    },
    { value: 'Warm', label: 'Warm', sublabel: 'Interested',      icon: Wind,     selectedClass: 'bg-amber-50 border-amber-300', iconClass: 'text-amber-600'  },
    { value: 'Cold', label: 'Cold', sublabel: 'Just Inquiring',  icon: Snowflake,selectedClass: 'bg-blue-50 border-blue-300',  iconClass: 'text-blue-600'   },
  ];

  const callOutcomes = [
    { value: 'connected',    label: 'Connected ✅',   icon: Phone,      selectedClass: 'bg-green-50 border-green-300 ring-1 ring-green-200',  iconClass: 'text-green-600'  },
    { value: 'not_answered', label: 'No Answer',     icon: PhoneMissed,selectedClass: 'bg-yellow-50 border-yellow-300 ring-1 ring-yellow-200',iconClass: 'text-yellow-600' },
    { value: 'wrong_number', label: 'Wrong Number',  icon: XCircle,    selectedClass: 'bg-red-50 border-red-300 ring-1 ring-red-200',        iconClass: 'text-red-600'    },
    { value: 'switched_off', label: 'Switched Off',  icon: PhoneOff,   selectedClass: 'bg-gray-100 border-gray-300 ring-1 ring-gray-200',    iconClass: 'text-gray-600'   },
    { value: 'busy',         label: 'Busy 📞',      icon: Phone,      selectedClass: 'bg-orange-50 border-orange-300 ring-1 ring-orange-200',iconClass: 'text-orange-600' },
  ];

  return (
    // ✅ pb-36 so sticky footer doesn't overlap last section
    <div className="min-h-screen bg-gray-50 pb-36">

      {/* Sticky Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">Update Lead</h1>
            <p className="text-xs text-gray-500 truncate">{lead.name} &middot; {lead.phone}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-3">

        {/* QUICK ACTION TABS */}
        <div className="bg-white rounded-xl p-3 border shadow-sm">
          <Label className="text-xs font-semibold mb-2 block text-gray-600">QUICK ACTION</Label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              onClick={() => setFormData(prev => ({ ...prev, actionType: 'quick_update', callOutcome: '', visitDate: '' }))}
              className={`p-2 rounded-lg text-xs font-medium transition ${
                formData.actionType === 'quick_update'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}>
              Quick Update
            </button>
            <button type="button"
              onClick={() => setFormData(prev => ({ ...prev, actionType: 'call_log', visitDate: '' }))}
              className={`p-2 rounded-lg text-xs font-medium transition ${
                formData.actionType === 'call_log'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}>
              Log Call
            </button>
            <button type="button"
              onClick={() => navigate(`/crm/sales/site-visits?leadId=${lead.id}`)}
              className="p-2 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
              Schedule Visit
            </button>
            <button type="button"
              onClick={() => {
                const tomorrow = addDays(new Date(), 1);
                setFormData(prev => ({
                  ...prev,
                  status: 'FollowUp',
                  actionType: 'call_log',
                  callOutcome: 'not_answered',
                  followUpDate: format(tomorrow, 'yyyy-MM-dd'),
                  followUpTime: prev.followUpTime || '10:00',
                  workStage: 'to_do',
                }));
              }}
              className="p-2 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
              Call Tomorrow
            </button>
          </div>
        </div>

        {/* CALL OUTCOME */}
        {formData.actionType === 'call_log' && (
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <Label className="text-sm font-semibold mb-3 block text-gray-700">1 — What happened on the call?</Label>
            <div className="grid grid-cols-2 gap-2">
              {callOutcomes.map(outcome => {
                const Icon = outcome.icon;
                const isSelected = formData.callOutcome === outcome.value;
                return (
                  <button key={outcome.value} type="button"
                    onClick={() => setFormData({ ...formData, callOutcome: outcome.value })}
                    className={`p-3 rounded-lg border-2 transition flex items-center gap-2 ${
                      isSelected ? outcome.selectedClass : 'bg-white border-gray-200'
                    }`}>
                    <Icon size={18} className={isSelected ? outcome.iconClass : 'text-gray-400'} />
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
                <Input type="number" placeholder="e.g., 5" value={formData.callDuration}
                  onChange={e => setFormData({ ...formData, callDuration: e.target.value })}
                  className="h-9 text-sm" />
              </div>
            )}
          </div>
        )}

        {/* STATUS */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-3 block text-gray-700">2 — Update Lead Status</Label>
          <div className="grid grid-cols-2 gap-2">
            {['Open', 'FollowUp', 'Booked', 'Lost', 'Not Interested', 'Call Back Later'].map(status => (
              <button key={status} type="button"
                onClick={() => setFormData({ ...formData, status: status === 'Not Interested' ? 'Lost' : status })}
                className={`p-2.5 rounded-lg text-xs font-semibold border-2 transition ${
                  formData.status === status ||
                  (status === 'Not Interested' && formData.status === 'Lost')
                    ? status === 'Booked'          ? 'bg-green-50 border-green-300 text-green-700' :
                      status === 'FollowUp'        ? 'bg-orange-50 border-orange-300 text-orange-700' :
                      status === 'Lost' || status === 'Not Interested' ? 'bg-gray-50 border-gray-300 text-gray-700' :
                      status === 'Call Back Later' ? 'bg-purple-50 border-purple-300 text-purple-700' :
                                                    'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}>
                {status === 'FollowUp' ? 'Follow Up' : status}
              </button>
            ))}
          </div>
        </div>

        {/* INTEREST LEVEL */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-3 block text-gray-700">3 — Interest Level</Label>
          <div className="grid grid-cols-3 gap-2">
            {interestOptions.map(option => {
              const Icon = option.icon;
              const isSelected = formData.interestLevel === option.value;
              return (
                <button key={option.value} type="button"
                  onClick={() => setFormData({ ...formData, interestLevel: option.value })}
                  className={`p-3 rounded-lg border-2 transition ${
                    isSelected ? option.selectedClass : 'bg-white border-gray-200'
                  }`}>
                  <div className="flex flex-col items-center gap-1">
                    <Icon size={20} className={isSelected ? option.iconClass : 'text-gray-300'} />
                    <p className={`font-bold text-xs ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{option.label}</p>
                    <p className="text-[10px] text-gray-400">{option.sublabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FOLLOW-UP DATE */}
        {(formData.status === 'FollowUp' || formData.status === 'Call Back Later') && (
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-semibold text-blue-800">3 — Follow-up Date (Optional)</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block text-blue-700">Date</Label>
                <Input type="date" value={formData.followUpDate}
                  onChange={e => setFormData({ ...formData, followUpDate: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-blue-700">Time</Label>
                <Input type="time" value={formData.followUpTime}
                  onChange={e => setFormData({ ...formData, followUpTime: e.target.value })}
                  className="h-9 text-sm" />
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
                <Input type="number" placeholder="50000" value={formData.tokenAmount}
                  onChange={e => setFormData({ ...formData, tokenAmount: e.target.value })}
                  required={formData.status === 'Booked'} min="0" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-green-700">Booking Amount</Label>
                <Input type="number" placeholder="5000000" value={formData.bookingAmount}
                  onChange={e => setFormData({ ...formData, bookingAmount: e.target.value })}
                  required={formData.status === 'Booked'} min="0" className="h-9 text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYEE WORK TRACKER */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-3 block text-gray-700">My Work Progress</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'to_do', label: 'To Do',  className: 'bg-slate-100 text-slate-700 border-slate-300' },
              { value: 'doing', label: 'Doing',  className: 'bg-blue-100 text-blue-700 border-blue-300'    },
              { value: 'did',   label: 'Done ✅', className: 'bg-green-100 text-green-700 border-green-300'  },
            ].map(stage => (
              <button key={stage.value} type="button"
                onClick={() => setFormData({ ...formData, workStage: stage.value })}
                className={`p-2.5 rounded-lg text-xs font-semibold border-2 transition ${
                  formData.workStage === stage.value ? stage.className : 'bg-white border-gray-200 text-gray-500'
                }`}>
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* NOTES */}
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <Label className="text-sm font-semibold mb-2 block text-gray-700">4 — Quick Note (optional)</Label>
          <Textarea
            placeholder="What did the lead say? Any remarks..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="text-sm"
          />
        </div>

      </form>

      {/* ✅ STICKY BOTTOM BUTTON — always visible above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3">
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Saving...' : '💾 Save & Update Lead'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-12 px-5 border-gray-300"
          >
            Back
          </Button>
        </div>
      </div>

    </div>
  );
};

export default UpdateLeadStatus;
