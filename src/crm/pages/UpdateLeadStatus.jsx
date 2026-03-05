import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Save, Flame, Wind, Snowflake, CheckCircle2, 
  Calendar, IndianRupee, AlertTriangle, Zap, TrendingUp, Info 
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
  const [useAutoTemperature, setUseAutoTemperature] = useState(true);
  const [autoCalculation, setAutoCalculation] = useState(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const lead = leads.find(l => l.id === leadId);
  const leadCalls = calls.filter(c => c.leadId === leadId || c.lead_id === leadId);
  // Parse notes from lead.notes string into array for scoring engine
  const leadNotes = lead?.notes ? lead.notes.split('\n').filter(n => n.trim()).map((n, i) => ({
    id: i,
    leadId: lead.id,
    content: n,
    createdAt: new Date().toISOString() // Approximate
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

  // Calculate automatic temperature on load and when data changes
  useEffect(() => {
    if (lead) {
      const calculation = calculateLeadTemperature(lead, leadCalls, leadNotes);
      setAutoCalculation(calculation);
      
      setFormData(prev => ({
        ...prev,
        status: normalizeLeadStatus(lead.status),
        interestLevel: useAutoTemperature ? calculation.temperature : normalizeInterestLevel(lead.interestLevel || lead.interest_level),
        followUpDate: lead.followUpDate || lead.follow_up_date || '',
        followUpTime: lead.followUpTime || lead.follow_up_time || '',
        tokenAmount: lead.tokenAmount || lead.token_amount || '',
        bookingAmount: lead.bookingAmount || lead.booking_amount || '',
      }));
    }
  }, [lead, leadCalls.length, useAutoTemperature]);

  // Update interest level when toggle changes
  useEffect(() => {
    if (autoCalculation) {
      if (useAutoTemperature) {
        setFormData(prev => ({
          ...prev,
          interestLevel: autoCalculation.temperature,
          temperatureOverrideReason: ''
        }));
      } else {
        // Restore saved manual override or keep current
        const savedLevel = normalizeInterestLevel(lead?.interestLevel || lead?.interest_level);
        setFormData(prev => ({
          ...prev,
          interestLevel: savedLevel
        }));
      }
    }
  }, [useAutoTemperature, autoCalculation]);

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

    // Validate override reason if manual temperature is used
    if (!useAutoTemperature && !formData.temperatureOverrideReason.trim()) {
      toast({
        title: 'Override Reason Required',
        description: 'Please explain why you are overriding the automatic temperature',
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
      const updateData = {
        status: formData.status,
        interestLevel: formData.interestLevel,
        interest_level: formData.interestLevel,
        temperatureOverridden: !useAutoTemperature,
        temperature_overridden: !useAutoTemperature,
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

      // Create comprehensive note including temperature info
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

      // Add temperature override info to note
      if (!useAutoTemperature) {
        noteText += `\n\n🎯 Temperature Override: ${formData.interestLevel} (Auto-calculated: ${autoCalculation?.temperature})\nReason: ${formData.temperatureOverrideReason}\nAuto Score: ${autoCalculation?.score}/100`;
      } else {
        noteText += `\n\n🤖 Auto Temperature: ${formData.interestLevel} (Score: ${autoCalculation?.score}/100)`;
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
    { value: INTEREST_LEVEL.HOT, label: 'Hot - Ready to Buy', icon: Flame, color: 'red' },
    { value: INTEREST_LEVEL.WARM, label: 'Warm - Interested', icon: Wind, color: 'amber' },
    { value: INTEREST_LEVEL.COLD, label: 'Cold - Just Inquiring', icon: Snowflake, color: 'blue' },
  ];

  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(`/crm/lead/${lead.id}`)} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Update Lead Status</h1>
            <p className="text-sm text-gray-500 mt-1">{lead.name}</p>
          </div>
        </div>

        {transitionWarning && (
          <Alert className={`mb-4 ${transitionWarning.type === 'error' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <AlertTriangle className={`h-4 w-4 ${transitionWarning.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
            <AlertDescription className={transitionWarning.type === 'error' ? 'text-red-800' : 'text-yellow-800'}>
              {transitionWarning.message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-600" />
              Update Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Lead Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LEAD_STATUS.OPEN}>Open</SelectItem>
                    <SelectItem value={LEAD_STATUS.FOLLOW_UP}>Follow Up</SelectItem>
                    <SelectItem value={LEAD_STATUS.BOOKED}>Booked</SelectItem>
                    <SelectItem value={LEAD_STATUS.LOST}>Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === LEAD_STATUS.FOLLOW_UP && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-semibold">Schedule Follow-up Reminder</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-2 block">Date *</Label>
                      <Input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                        min={getTodayDate()}
                        required={formData.status === LEAD_STATUS.FOLLOW_UP}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Time</Label>
                      <Input
                        type="time"
                        value={formData.followUpTime}
                        onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 This lead will appear at the top on {formData.followUpDate ? format(new Date(formData.followUpDate), 'dd MMM yyyy') : 'the selected date'}
                  </p>
                </div>
              )}

              {formData.status === LEAD_STATUS.BOOKED && (
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                    <Label className="text-base font-semibold">Payment Details</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-2 block">Token Amount (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 50000"
                        value={formData.tokenAmount}
                        onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                        required={formData.status === LEAD_STATUS.BOOKED}
                        min="0"
                        step="1000"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Total Booking Amount (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5000000"
                        value={formData.bookingAmount}
                        onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                        required={formData.status === LEAD_STATUS.BOOKED}
                        min="0"
                        step="10000"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    💰 This will be tracked in Employee Intelligence & Revenue Analytics
                  </p>
                </div>
              )}

              {/* Temperature Calculation Section */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <Label className="text-base font-semibold">Interest Temperature</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">
                      {useAutoTemperature ? 'Auto' : 'Manual'}
                    </Label>
                    <Switch
                      checked={useAutoTemperature}
                      onCheckedChange={setUseAutoTemperature}
                    />
                  </div>
                </div>

                {/* Auto-calculated insights */}
                {autoCalculation && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-gray-700">
                            Auto Score: {autoCalculation.score}/100
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            autoCalculation.temperature === INTEREST_LEVEL.HOT
                              ? 'bg-red-100 text-red-700'
                              : autoCalculation.temperature === INTEREST_LEVEL.WARM
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            → {autoCalculation.temperature}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {getTemperatureExplanation(autoCalculation.factors, autoCalculation.score)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                          className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <Info size={12} />
                          {showScoreBreakdown ? 'Hide' : 'Show'} Score Breakdown
                        </button>
                      </div>
                    </div>

                    {showScoreBreakdown && (
                      <div className="mt-3 pt-3 border-t border-purple-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">📞 Calls:</span>
                          <span className="font-semibold">{autoCalculation.breakdown.calls}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">💰 Budget:</span>
                          <span className="font-semibold">{autoCalculation.breakdown.budget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">⏰ Timeline:</span>
                          <span className="font-semibold">{autoCalculation.breakdown.timeline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">💬 Engagement:</span>
                          <span className="font-semibold">{autoCalculation.breakdown.engagement}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-gray-600">🕐 Recency:</span>
                          <span className="font-semibold">{autoCalculation.breakdown.recency}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Temperature Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {interestOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.interestLevel === option.value;
                    const isAutoRecommended = autoCalculation?.temperature === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (!useAutoTemperature) {
                            setFormData({ ...formData, interestLevel: option.value });
                          }
                        }}
                        disabled={useAutoTemperature}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          useAutoTemperature
                            ? 'opacity-70 cursor-not-allowed'
                            : 'cursor-pointer'
                        } ${
                          isSelected
                            ? `bg-${option.color}-50 border-${option.color}-300 ring-2 ring-${option.color}-200`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {isAutoRecommended && (
                          <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap size={10} />
                            Auto
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 size={18} className="text-blue-600" />
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-2">
                          <Icon
                            size={28}
                            className={isSelected ? `text-${option.color}-600` : 'text-gray-400'}
                          />
                          <p className="font-bold text-sm">{option.value}</p>
                          <p className="text-xs text-gray-500">{option.label.split(' - ')[1]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual Override Reason */}
                {!useAutoTemperature && (
                  <div className="mt-4">
                    <Label className="text-sm mb-2 block text-gray-700">
                      Why override automatic calculation? *
                    </Label>
                    <Textarea
                      placeholder="E.g., Client mentioned urgent requirement in call, Personal rapport suggests higher interest, etc."
                      value={formData.temperatureOverrideReason}
                      onChange={(e) => setFormData({ ...formData, temperatureOverrideReason: e.target.value })}
                      rows={2}
                      required={!useAutoTemperature}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Follow-up Suggestions */}
                {autoCalculation && (
                  <div className="mt-3 p-3 bg-white rounded border border-purple-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">💡 Suggested Actions:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {getFollowUpSuggestions(formData.interestLevel, autoCalculation.factors).map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Update Notes *</Label>
                <Textarea
                  placeholder="What happened? Next steps?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  required
                  className="text-base"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || (transitionWarning && transitionWarning.type === 'error')}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <Save size={18} className="mr-2" />
                  {loading ? 'Updating...' : 'Update Lead'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/crm/lead/${lead.id}`)}
                  className="h-12 px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateLeadStatus;
