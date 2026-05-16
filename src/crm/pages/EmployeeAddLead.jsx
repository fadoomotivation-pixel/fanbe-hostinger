import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { addEmployeeLead } from '@/lib/crmSupabase';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, UserPlus, Phone, MapPin, Briefcase, MessageSquare, Calendar, User, ShieldCheck } from 'lucide-react';

const EmployeeAddLead = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addLead } = useCRMData();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    alternate_phone: '',
    occupation: '',
    city: '',
    locality: '',
    pincode: '',
    source: 'Employee Referral',
    interest_level: 'warm',
    project_interested: '',
    budget_range: '',
    property_type: '',
    preferred_size: '',
    purpose: '',
    possession_timeline: '',
    financing: '',
    follow_up_date: '',
    how_they_know: '',
    customer_remarks: '',
    employee_remarks: '',
    site_visit_interest: false,
    preferred_visit_date: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name.trim() || !formData.phone.trim()) {
      toast({ title: 'Missing Information', description: 'Customer name and phone number are required.', variant: 'destructive' });
      return;
    }
    if (formData.phone.length < 10) {
      toast({ title: 'Invalid Phone', description: 'Please enter a valid 10-digit phone number.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const mainLead = await addLead({
        name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || '',
        source: formData.source || 'Employee Referral',
        interestLevel: formData.interest_level || 'warm',
        budget: formData.budget_range || '',
        project: formData.project_interested || '',
        status: 'FollowUp',
        followUpDate: formData.follow_up_date || null,
        assignedTo: user.id,
        assignedToName: user.name || user.username || user.email || 'Employee',
        createdBy: user.id,
        notes: [
          '[Employee Lead Submission]',
          formData.customer_remarks ? `Customer Remarks: ${formData.customer_remarks}` : null,
          formData.employee_remarks ? `Employee Remarks: ${formData.employee_remarks}` : null,
        ].filter(Boolean).join('\n'),
      });

      if (!mainLead) {
        throw new Error('Failed to create lead in My Leads.');
      }

      const result = await addEmployeeLead({
        ...formData,
        submitted_by: user.id,
        submitted_by_name: user.name || user.username,
        preferred_visit_date: formData.preferred_visit_date || null,
        follow_up_date: formData.follow_up_date || null,
        admin_status: 'pending',
      });


    } catch (error) {
      console.error('Failed to submit lead:', error);
      toast({ title: 'Error', description: error.message || 'Failed to submit lead. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/crm/sales/my-leads')} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus size={28} className="text-emerald-600" />
              Add New Lead
            </h1>
            <p className="text-sm text-gray-500 mt-1">Submit a new lead and continue in My Leads</p>
          </div>
        </div>

        {/* Review notice */}
        <div className="flex items-center gap-3 p-3 mb-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
          <ShieldCheck size={18} className="text-indigo-600 shrink-0" />
          <span>
            Leads you submit are marked <strong>Pending Review</strong> and are visible to superadmin/admin in Employee Submitted Leads.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Customer Basic Info */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone size={18} className="text-emerald-600" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Submitter stamp */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                <User size={16} className="text-emerald-600 shrink-0" />
                <span>Submitting as <strong>{user?.name || user?.username}</strong> &middot; {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input placeholder="Full name" value={formData.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input placeholder="10-digit mobile" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} required className="mt-1" />
                </div>
                <div>
                  <Label>Alternate Phone</Label>
                  <Input placeholder="Alternate number" value={formData.alternate_phone} onChange={(e) => handleChange('alternate_phone', e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="customer@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Input placeholder="e.g., Business, IT Professional" value={formData.occupation} onChange={(e) => handleChange('occupation', e.target.value)} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Location */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input placeholder="City" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Locality / Area</Label>
                  <Input placeholder="Locality" value={formData.locality} onChange={(e) => handleChange('locality', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input placeholder="6-digit pincode" value={formData.pincode} onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Lead / Property Interest */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase size={18} className="text-amber-600" /> Property Interest
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Lead Source</Label>
                  <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee Referral">Employee Referral</SelectItem>
                      <SelectItem value="Direct Call">Direct Call</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Reference">Reference</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interest Level</Label>
                  <Select value={formData.interest_level} onValueChange={(v) => handleChange('interest_level', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Hot - Ready to Buy</SelectItem>
                      <SelectItem value="warm">Warm - Interested</SelectItem>
                      <SelectItem value="cold">Cold - Just Inquiring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project Interested In</Label>
                  <Input placeholder="e.g., Fanbe Heights" value={formData.project_interested} onChange={(e) => handleChange('project_interested', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Budget Range</Label>
                  <Input placeholder="e.g., 50-60 Lakhs" value={formData.budget_range} onChange={(e) => handleChange('budget_range', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(v) => handleChange('property_type', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="flat">Flat / Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred Size</Label>
                  <Input placeholder="e.g., 1000 sq ft, 2 BHK" value={formData.preferred_size} onChange={(e) => handleChange('preferred_size', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Select value={formData.purpose} onValueChange={(v) => handleChange('purpose', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="self_use">Self Use</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Possession Timeline</Label>
                  <Select value={formData.possession_timeline} onValueChange={(v) => handleChange('possession_timeline', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="3_months">Within 3 Months</SelectItem>
                      <SelectItem value="6_months">Within 6 Months</SelectItem>
                      <SelectItem value="1_year">Within 1 Year</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Financing</Label>
                  <Select value={formData.financing} onValueChange={(v) => handleChange('financing', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select financing" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash / Self-Funded</SelectItem>
                      <SelectItem value="loan">Bank Loan</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Follow-up Date</Label>
                  <Input type="date" value={formData.follow_up_date} onChange={(e) => handleChange('follow_up_date', e.target.value)} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Conversation Details */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-600" /> Conversation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div>
                <Label>How did the customer learn about us?</Label>
                <Input placeholder="e.g., Saw hoarding, friend told them, online ad" value={formData.how_they_know} onChange={(e) => handleChange('how_they_know', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Customer Remarks</Label>
                <Textarea placeholder="What did the customer say? Their requirements, concerns..." value={formData.customer_remarks} onChange={(e) => handleChange('customer_remarks', e.target.value)} rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Your Assessment / Remarks</Label>
                <Textarea placeholder="Your personal assessment of this lead — how serious, any red flags, etc." value={formData.employee_remarks} onChange={(e) => handleChange('employee_remarks', e.target.value)} rows={3} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Site Visit */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar size={18} className="text-rose-600" /> Site Visit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="site_visit_interest"
                  checked={formData.site_visit_interest}
                  onChange={(e) => handleChange('site_visit_interest', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="site_visit_interest" className="cursor-pointer">Customer is interested in a site visit</Label>
              </div>
              {formData.site_visit_interest && (
                <div className="max-w-xs">
                  <Label>Preferred Visit Date</Label>
                  <Input type="date" value={formData.preferred_visit_date} onChange={(e) => handleChange('preferred_visit_date', e.target.value)} className="mt-1" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3">
              <Save size={18} className="mr-2" />
              {loading ? 'Submitting...' : 'Submit Lead'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/crm/sales/my-leads')} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeAddLead;
