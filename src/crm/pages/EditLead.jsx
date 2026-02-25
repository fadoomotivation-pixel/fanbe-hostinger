import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import projects from '@/data/projects';

const EditLead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leads, updateLead } = useCRMData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lead = leads.find(l => l.id === id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'FollowUp',
    interestLevel: 'Cold',
    project: '',
    budget: '',
    source: '',
    notes: '',
    followUpDate: '',
  });

  useEffect(() => {
    if (!lead) {
      toast({ title: 'Lead not found', variant: 'destructive' });
      navigate('/crm/sales/my-leads');
      return;
    }

    // Check if this lead is assigned to current user
    if (lead.assignedTo !== user?.id) {
      toast({ title: 'Access denied', description: 'You can only edit your own leads', variant: 'destructive' });
      navigate('/crm/sales/my-leads');
      return;
    }

    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      status: lead.status || 'FollowUp',
      interestLevel: lead.interestLevel || 'Cold',
      project: lead.project || '',
      budget: lead.budget || '',
      source: lead.source || '',
      notes: lead.notes || '',
      followUpDate: lead.followUpDate || '',
    });
  }, [lead, user, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({ title: 'Error', description: 'Name and phone are required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateLead(id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
        interestLevel: formData.interestLevel,
        project: formData.project,
        budget: formData.budget,
        source: formData.source,
        notes: formData.notes,
        followUpDate: formData.followUpDate,
      });

      toast({ title: 'Success', description: 'Lead updated successfully' });
      navigate(`/crm/sales/lead/${id}`);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update lead', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Edit Lead</h1>
          <p className="text-gray-500 text-sm">Update lead information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <Input 
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    placeholder="e.g., Website, Referral, Walk-in"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lead Status & Details */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Status & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="FollowUp">Follow Up</SelectItem>
                        <SelectItem value="Booked">Booked</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interest Level</label>
                    <Select value={formData.interestLevel} onValueChange={(val) => setFormData({...formData, interestLevel: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hot">Hot</SelectItem>
                        <SelectItem value="Warm">Warm</SelectItem>
                        <SelectItem value="Cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project</label>
                    <Select value={formData.project} onValueChange={(val) => setFormData({...formData, project: val})}>
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        {projects.map(p => (
                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget</label>
                    <Input 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      placeholder="e.g., ₹50-70 Lakhs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Next Follow-up Date</label>
                  <Input 
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Add notes about this lead..."
                  rows={6}
                />
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lead ID:</span>
                  <span className="font-mono text-xs">{id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned To:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900">💡 Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-800 space-y-2">
                <p>• Update status after each interaction</p>
                <p>• Set follow-up dates to stay organized</p>
                <p>• Add detailed notes for better tracking</p>
                <p>• Mark "Hot" leads for priority follow-up</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </form>
    </div>
  );
};

export default EditLead;
