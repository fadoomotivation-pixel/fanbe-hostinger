import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Flame, Wind, Snowflake, CheckCircle2 } from 'lucide-react';

const UpdateLeadStatus = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addLeadNote } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const lead = leads.find(l => l.id === leadId);
  
  const [formData, setFormData] = useState({
    status: lead?.status || 'Open',
    interestLevel: lead?.interestLevel || lead?.interest_level || 'Warm',
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        status: lead.status || 'Open',
        interestLevel: lead.interestLevel || lead.interest_level || 'Warm'
      }));
    }
  }, [lead]);

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
    
    if (!formData.notes.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please add update notes',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await updateLead(lead.id, {
        status: formData.status,
        interestLevel: formData.interestLevel,
        interest_level: formData.interestLevel,
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const noteText = `Status: ${formData.status} | Interest: ${formData.interestLevel} | ${formData.notes}`;
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
    { value: 'Hot', label: 'Hot - Ready to Buy', icon: Flame, color: 'red' },
    { value: 'Warm', label: 'Warm - Interested', icon: Wind, color: 'amber' },
    { value: 'Cold', label: 'Cold - Just Inquiring', icon: Snowflake, color: 'blue' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6">
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
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="FollowUp">Follow Up</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Interest Level</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {interestOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.interestLevel === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setFormData({ ...formData, interestLevel: option.value })} className={`p-4 rounded-lg border-2 transition-all ${isSelected ? `bg-${option.color}-50 border-${option.color}-300 ring-2` : 'bg-white border-gray-200'}`}>
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
                <Button type="submit" disabled={loading} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
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
