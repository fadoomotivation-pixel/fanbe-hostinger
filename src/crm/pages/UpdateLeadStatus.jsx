import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Save, Flame, Wind, Snowflake, CheckCircle2,
  Calendar, IndianRupee, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LEAD_STATUS,
  INTEREST_LEVEL,
  normalizeLeadStatus,
  normalizeInterestLevel,
  validateStatusTransition,
  createStatusChangeNote
} from '@/crm/utils/statusUtils';
import {
  calculateLeadTemperature,
  getTemperatureExplanation,
  getFollowUpSuggestions
} from '@/crm/utils/leadScoringEngine';

const UpdateLeadStatus = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, calls, updateLead, addLeadNote } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transitionWarning, setTransitionWarning] = useState(null);
  const [autoCalculation, setAutoCalculation] = useState(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const lead = leads.find(l => l.id === leadId);
  const leadCalls = calls.filter(c => c.leadId === leadId || c.lead_id === leadId);
  const leadNotes = lead?.notes ? lead.notes.split('\n').filter(n => n.trim()).map((n, i) => ({
    id: i,
    leadId: lead.id,
    content: n,
    createdAt: new Date().toISOString()
  })) : [];

  const [formData, setFormData] = useState({
    status: LEAD_STATUS.OPEN,
    interestLevel: INTEREST_LEVEL.WARM,
    notes: '',
    followUpDate: '',
    followUpTime: '',
    tokenAmount: '',
    bookingAmount: '',
    temperatureOverrideReason: ''
  });

  // Calculate automatic temperature on load
  useEffect(() => {
    if (lead) {
      const calculation = calculateLeadTemperature(lead, leadCalls, leadNotes);
      setAutoCalculation(calculation);

      // Check if lead already had a manual override
      const wasOverridden = lead.temperatureOverridden || lead.temperature_overridden;
      const savedInterest = normalizeInterestLevel(lead.interestLevel || lead.interest_level);

      if (wasOverridden && savedInterest !== calculation.temperature) {
        setManualOverride(true);
      }

      setFormData(prev => ({
        ...prev,
        status: normalizeLeadStatus(lead.status),
        interestLevel: wasOverridden ? savedInterest : calculation.temperature,
        followUpDate: lead.followUpDate || lead.follow_up_date || '',
        followUpTime: lead.followUpTime || lead.follow_up_time || '',
        tokenAmount: lead.tokenAmount || lead.token_amount || '',
        bookingAmount: lead.bookingAmount || lead.booking_amount || '',
      }));
    }
  }, [lead, leadCalls.length]);

  // Check transition validity
  useEffect(() => {
    if (!lead) return;

    const validation = validateStatusTransition(
      lead.status,
      formData.status,
      lead,
      leadCalls
    );

    if (!validation.allowed) {
      setTransitionWarning({ type: 'error', message: validation.reason });
    } else if (validation.warning) {
      setTransitionWarning({ type: 'warning', message: validation.warning });
    } else {
      setTransitionWarning(null);
    }
  }, [formData.status, lead, leadCalls]);

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Lead not found</p>
        <Button onClick={() => navigate('/crm/my-leads')} className="mt-4">
          Back to Leads
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateStatusTransition(lead.status, formData.status, lead, leadCalls);
    if (!validation.allowed) {
      toast({
        title: 'Invalid Status Change',
        description: validation.reason,
        variant: 'destructive'
      });
      return;
    }

    if (!formData.notes.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please add update notes',
        variant: 'destructive'
      });
      return;
    }

    if (formData.status === LEAD_STATUS.FOLLOW_UP && !formData.followUpDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select follow-up date and time',
        variant: 'destructive'
      });
      return;
    }

    if (formData.status === LEAD_STATUS.BOOKED && (!formData.tokenAmount || !formData.bookingAmount)) {
      toast({
        title: 'Missing Information',
        description: 'Please enter token and booking amounts',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const isOverridden = manualOverride && formData.interestLevel !== autoCalculation?.temperature;

      const updateData = {
        status: formData.status,
        interestLevel: formData.interestLevel,
        interest_level: formData.interestLevel,
        temperatureOverridden: isOverridden,
        temperature_overridden: isOverridden,
        temperatureAutoScore: autoCalculation?.score || 0,
        temperature_auto_score: autoCalculation?.score || 0,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (formData.status === LEAD_STATUS.FOLLOW_UP) {
        updateData.followUpDate = formData.followUpDate;
        updateData.follow_up_date = formData.followUpDate;
        updateData.followUpTime = formData.followUpTime;
        updateData.follow_up_time = formData.followUpTime;
      }

      if (formData.status === LEAD_STATUS.BOOKED) {
        updateData.tokenAmount = parseFloat(formData.tokenAmount) || 0;
        updateData.token_amount = parseFloat(formData.tokenAmount) || 0;
        updateData.bookingAmount = parseFloat(formData.bookingAmount) || 0;
        updateData.booking_amount = parseFloat(formData.bookingAmount) || 0;
      }

      await updateLead(lead.id, updateData);

      let noteText = createStatusChangeNote(
        lead.status,
        formData.status,
        user?.name || 'Employee',
        {
          interest: formData.interestLevel,
          followUpDate: formData.followUpDate,
          followUpTime: formData.followUpTime,
          tokenAmount: formData.tokenAmount,
          bookingAmount: formData.bookingAmount,
          reason: formData.notes
        }
      );

      if (isOverridden) {
        noteText += `\n\nTemperature: ${formData.interestLevel} (System suggested: ${autoCalculation?.temperature})`;
        if (formData.temperatureOverrideReason) {
          noteText += `\nReason: ${formData.temperatureOverrideReason}`;
        }
      } else {
        noteText += `\n\nTemperature: ${formData.interestLevel} (Auto, Score: ${autoCalculation?.score}/100)`;
      }

      await addLeadNote(lead.id, noteText, user?.name || 'Employee');

      toast({
        title: 'Updated Successfully',
        description: 'Lead status and temperature updated'
      });

      navigate(`/crm/lead/${lead.id}`);
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const interestOptions = [
    { value: INTEREST_LEVEL.HOT, label: 'Hot', sublabel: 'Ready to Buy', icon: Flame, bgActive: 'bg-red-50 border-red-300', textActive: 'text-red-600' },
    { value: INTEREST_LEVEL.WARM, label: 'Warm', sublabel: 'Interested', icon: Wind, bgActive: 'bg-amber-50 border-amber-300', textActive: 'text-amber-600' },
    { value: INTEREST_LEVEL.COLD, label: 'Cold', sublabel: 'Just Inquiring', icon: Snowflake, bgActive: 'bg-blue-50 border-blue-300', textActive: 'text-blue-500' },
  ];

  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

  const suggestions = autoCalculation
    ? getFollowUpSuggestions(formData.interestLevel, autoCalculation.factors)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/crm/lead/${lead.id}`)}
            className="p-1.5 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">Update Lead</h1>
            <p className="text-xs text-gray-500 truncate">{lead.name}</p>
          </div>
        </div>
      </div>

      {transitionWarning && (
        <div className="mx-4 mt-3">
          <Alert className={`${transitionWarning.type === 'error' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <AlertTriangle className={`h-4 w-4 ${transitionWarning.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className={`text-xs ${transitionWarning.type === 'error' ? 'text-red-800' : 'text-yellow-800'}`}>
              {transitionWarning.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
        {/* Status */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Label className="text-sm font-semibold mb-2 block text-gray-700">Lead Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={LEAD_STATUS.OPEN}>Open</SelectItem>
              <SelectItem value={LEAD_STATUS.FOLLOW_UP}>Follow Up</SelectItem>
              <SelectItem value={LEAD_STATUS.BOOKED}>Booked</SelectItem>
              <SelectItem value={LEAD_STATUS.LOST}>Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Follow-up */}
        {formData.status === LEAD_STATUS.FOLLOW_UP && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-semibold text-blue-800">Schedule Follow-up</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block text-blue-700">Date *</Label>
                <Input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  min={getTodayDate()}
                  required={formData.status === LEAD_STATUS.FOLLOW_UP}
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-blue-700">Time</Label>
                <Input
                  type="time"
                  value={formData.followUpTime}
                  onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
            </div>
            {formData.followUpDate && (
              <p className="text-[11px] text-blue-600 mt-2">
                This lead will appear at top on {format(new Date(formData.followUpDate), 'dd MMM yyyy')}
              </p>
            )}
          </div>
        )}

        {/* Payment */}
        {formData.status === LEAD_STATUS.BOOKED && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-green-600" />
              <Label className="text-sm font-semibold text-green-800">Payment Details</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block text-green-700">Token Amount *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={formData.tokenAmount}
                  onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                  required={formData.status === LEAD_STATUS.BOOKED}
                  min="0"
                  step="1000"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block text-green-700">Booking Amount *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000000"
                  value={formData.bookingAmount}
                  onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                  required={formData.status === LEAD_STATUS.BOOKED}
                  min="0"
                  step="10000"
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Interest Temperature - Simplified */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-semibold text-gray-700">Interest Level</Label>
            {autoCalculation && !manualOverride && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Auto: {autoCalculation.temperature}
              </span>
            )}
          </div>

          {/* Temperature Buttons - always visible, clean design */}
          <div className="grid grid-cols-3 gap-2">
            {interestOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.interestLevel === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    const newLevel = option.value;
                    setFormData({ ...formData, interestLevel: newLevel });
                    // Auto-detect if user is overriding
                    if (autoCalculation && newLevel !== autoCalculation.temperature) {
                      setManualOverride(true);
                    } else {
                      setManualOverride(false);
                      setFormData(prev => ({ ...prev, temperatureOverrideReason: '' }));
                    }
                  }}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${option.bgActive} ring-1 ring-offset-1 ring-gray-200`
                      : 'bg-white border-gray-200 active:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon
                      size={22}
                      className={isSelected ? option.textActive : 'text-gray-300'}
                    />
                    <p className={`font-bold text-xs ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{option.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{option.sublabel}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={14} className="absolute top-1.5 right-1.5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Manual override note - only shows when employee picks differently */}
          {manualOverride && autoCalculation && formData.interestLevel !== autoCalculation.temperature && (
            <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-800 mb-2">
                System suggested <strong>{autoCalculation.temperature}</strong> — you selected <strong>{formData.interestLevel}</strong>.
                <br />
                <span className="text-amber-600">Quick note on why? (optional)</span>
              </p>
              <Textarea
                placeholder="e.g., Client sounded very interested on call..."
                value={formData.temperatureOverrideReason}
                onChange={(e) => setFormData({ ...formData, temperatureOverrideReason: e.target.value })}
                rows={2}
                className="text-sm bg-white"
              />
            </div>
          )}

          {/* Collapsible details */}
          {autoCalculation && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"
            >
              {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showDetails ? 'Hide' : 'How is this calculated?'}
            </button>
          )}

          {showDetails && autoCalculation && (
            <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1.5">
              <p className="text-gray-600 font-medium mb-1">
                Score: {autoCalculation.score}/100 — {getTemperatureExplanation(autoCalculation.factors, autoCalculation.score)}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between"><span>Calls</span><span className="font-medium text-gray-600">{autoCalculation.breakdown.calls}</span></div>
                <div className="flex justify-between"><span>Budget</span><span className="font-medium text-gray-600">{autoCalculation.breakdown.budget}</span></div>
                <div className="flex justify-between"><span>Timeline</span><span className="font-medium text-gray-600">{autoCalculation.breakdown.timeline}</span></div>
                <div className="flex justify-between"><span>Engagement</span><span className="font-medium text-gray-600">{autoCalculation.breakdown.engagement}</span></div>
                <div className="flex justify-between"><span>Recency</span><span className="font-medium text-gray-600">{autoCalculation.breakdown.recency}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Actions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Suggested Actions</Label>
            <div className="space-y-1.5">
              {suggestions.slice(0, 3).map((s, i) => (
                <p key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <Label className="text-sm font-semibold mb-2 block text-gray-700">Update Notes *</Label>
          <Textarea
            placeholder="What happened? Next steps?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            required
            className="text-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2 pb-4">
          <Button
            type="submit"
            disabled={loading || (transitionWarning && transitionWarning.type === 'error')}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
          >
            <Save size={16} className="mr-2" />
            {loading ? 'Updating...' : 'Update Lead'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/crm/lead/${lead.id}`)}
            className="h-12 px-5 text-sm"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateLeadStatus;
