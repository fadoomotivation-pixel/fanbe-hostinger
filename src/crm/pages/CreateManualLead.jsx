import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

const CreateManualLead = () => {
  const navigate = useNavigate();
  const { addLead } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    project: '',
    budget: '',
    source: 'Direct Call',
    interestLevel: 'Warm',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Name and phone number are required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const newLead = {
        ...formData,
        status: 'Open',
        assignedTo: user.id,
        assigned_to: user.id,
        createdBy: user.id,
        created_by: user.id,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'Direct Call - Manual Entry',
        notes: `[${new Date().toLocaleString('en-IN')}] ${user.name}: Lead created manually. ${formData.notes || 'Customer called directly.'}`
      };

      const leadId = await addLead(newLead);
      
      toast({
        title: '✓ Lead Created',
        description: 'Manual lead added successfully'
      });
      
      navigate(`/crm/lead/${leadId}`);
    } catch (error) {
      console.error('Failed to create lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/crm/my-leads')}
            className="rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus size={28} className="text-blue-600" />
              Create Manual Lead
            </h1>
            <p className="text-sm text-gray-500 mt-1">Add a lead who called you directly</p>
          </div>
        </div>

        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b">
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name */}
              <div>
                <Label htmlFor="name" className="required">Customer Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-2"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="required">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  maxLength={10}
                  required
                  className="mt-2"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* Project */}
              <div>
                <Label htmlFor="project">Interested Project</Label>
                <Input
                  id="project"
                  placeholder="e.g., Fanbe Heights, Fanbe Residency"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* Budget */}
              <div>
                <Label htmlFor="budget">Budget Range</Label>
                <Input
                  id="budget"
                  placeholder="e.g., 50-60 Lakhs"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* Interest Level */}
              <div>
                <Label htmlFor="interest">Interest Level</Label>
                <Select
                  value={formData.interestLevel}
                  onValueChange={(value) => setFormData({ ...formData, interestLevel: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot">Hot - Ready to Buy</SelectItem>
                    <SelectItem value="Warm">Warm - Interested</SelectItem>
                    <SelectItem value="Cold">Cold - Just Inquiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Initial Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="What did the customer say? What are their requirements?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save size={18} className="mr-2" />
                  {loading ? 'Creating Lead...' : 'Create Lead'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/crm/my-leads')}
                  disabled={loading}
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

export default CreateManualLead;
