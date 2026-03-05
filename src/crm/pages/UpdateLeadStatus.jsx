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
import { ArrowLeft, Save, Flame, Wind, Snowflake, CheckCircle2, Calendar, IndianRupee, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { 
  LEAD_STATUS, 
  INTEREST_LEVEL,
  normalizeLeadStatus,
  normalizeInterestLevel,
  validateStatusTransition,
  createStatusChangeNote
} from '@/crm/utils/statusUtils';

const UpdateLeadStatus = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, calls, updateLead, addLeadNote } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transitionWarning, setTransitionWarning] = useState(null);

  const lead = leads.find(l => l.id === leadId);
  
  const [formData, setFormData] = useState({
    status: LEAD_STATUS.OPEN,
    interestLevel: INTEREST_LEVEL.WARM,
    notes: '',
    followUpDate: '',
    followUpTime: '',
    tokenAmount: '',
    bookingAmount: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        status: normalizeLeadStatus(lead.status),
        interestLevel: normalizeInterestLevel(lead.interestLevel || lead.interest_level),
        followUpDate: lead.followUpDate || lead.follow_up_date || '',
        followUpTime: lead.followUpTime || lead.follow_up_time || '',
        tokenAmount: lead.tokenAmount || lead.token_amount || '',
        bookingAmount: lead.bookingAmount || lead.booking_amount || '',
      }));
    }
  }, [lead]);

  // Check transition validity when status changes
  useEffect(() => {
    if (!lead) return;
    
    const validation = validateStatusTransition(
      lead.status, 
      formData.status, 
      lead, 
      calls
    );
    
    if (!validation.allowed) {
      setTransitionWarning({ type: 'error', message: validation.reason });
    } else if (validation.warning) {
      setTransitionWarning({ type: 'warning', message: validation.warning });
    } else {
      setTransitionWarning(null);
    }
  }, [formData.status, lead, calls]);

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
    
    // Check transition validity
    const validation = validateStatusTransition(
      lead.status, 
      formData.status, 
      lead, 
      calls
    );
    
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

    // Validate follow-up date if status is FollowUp
    if (formData.status === LEAD_STATUS.FOLLOW_UP && !formData.followUpDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select follow-up date and time',
        variant: 'destructive'
      });
      return;
    }

    // Validate booking amount if status is Booked
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
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add follow-up date/time if status is FollowUp
      if (formData.status === LEAD_STATUS.FOLLOW_UP) {
        updateData.followUpDate = formData.followUpDate;
        updateData.follow_up_date = formData.followUpDate;
        updateData.followUpTime = formData.followUpTime;
        updateData.follow_up_time = formData.followUpTime;
      }

      // Add booking amounts if status is Booked
      if (formData.status === LEAD_STATUS.BOOKED) {
        updateData.tokenAmount = parseFloat(formData.tokenAmount) || 0;
        updateData.token_amount = parseFloat(formData.tokenAmount) || 0;
        updateData.bookingAmount = parseFloat(formData.bookingAmount) || 0;
        updateData.booking_amount = parseFloat(formData.bookingAmount) || 0;
      }

      await updateLead(lead.id, updateData);

      // Create comprehensive audit note
      const noteText = createStatusChangeNote(
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
      
      await addLeadNote(lead.id, noteText, user?.name || 'Employee');

      toast({
        title: 'Updated Successfully',
        description: 'Lead status updated'
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

  const getTodayDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

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

        {/* Transition Warning */}
        {transitionWarning && (
          <Alert className={`mb-4 ${
            transitionWarning.type === 'error' 
              ? 'bg-red-50 border-red-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              transitionWarning.type === 'error' ? 'text-red-600' : 'text-yellow-600'
            }`} />
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

              {/* Follow-up Date & Time - Show only when status is FollowUp */}
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

              {/* Booking Payment - Show only when status is Booked */}
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

              <div>
                <Label className="text-base font-semibold mb-3 block">Interest Level</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {interestOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.interestLevel === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setFormData({ ...formData, interestLevel: option.value })} className={`relative p-4 rounded-lg border-2 transition-all ${isSelected ? `bg-${option.color}-50 border-${option.color}-300 ring-2 ring-${option.color}-200` : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                        {isSelected && <div className="absolute top-2 right-2"><CheckCircle2 size={18} className="text-blue-600" /></div>}
                        <div className="flex flex-col items-center gap-2">
                          <Icon size={28} className={isSelected ? `text-${option.color}-600` : 'text-gray-400'} />
                          <p className="font-bold text-sm">{option.value}</p>
                          <p className="text-xs text-gray-500">{option.label.split(' - ')[1]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2 block">Update Notes *</Label>
                <Textarea placeholder="What happened? Next steps?" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} required className="text-base" />
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
                <Button type="button" variant="outline" onClick={() => navigate(`/crm/lead/${lead.id}`)} className="h-12 px-6">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateLeadStatus;
