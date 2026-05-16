import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Phone, Mail, MapPin, IndianRupee, Calendar,
  User, Edit2, Check, X, Plus, Trash2, MessageSquare
} from 'lucide-react';

const EmployeeLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { leads, leadsLoading, updateLead, addLeadNote } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const lead = leads.find(l => l.id === leadId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(lead?.name || '');
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [alternatePhone, setAlternatePhone] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (lead) setEditedName(lead.name);
  }, [lead]);
  
  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3A5F] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading lead details...</p>
        </div>
      </div>
    );
  }

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

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast({ title: 'Error', description: 'Name cannot be empty', variant: 'destructive' });
      return;
    }
    
    try {
      await updateLead(lead.id, { name: editedName.trim() });
      await addLeadNote(lead.id, `Name updated from "${lead.name}" to "${editedName.trim()}"`, 'Employee');
      toast({ title: 'Success', description: 'Lead name updated' });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update name:', error);
      toast({ title: 'Error', description: 'Failed to update name', variant: 'destructive' });
    }
  };

  const handleAddAlternatePhone = async () => {
    if (!alternatePhone.trim() || alternatePhone.length < 10) {
      toast({ title: 'Error', description: 'Please enter valid phone number', variant: 'destructive' });
      return;
    }

    try {
      const currentAlternate = lead.alternatePhone || lead.alternate_phone || [];
      const phones = Array.isArray(currentAlternate) ? currentAlternate : [currentAlternate].filter(Boolean);
      
      if (phones.includes(alternatePhone)) {
        toast({ title: 'Already exists', description: 'This number is already added', variant: 'destructive' });
        return;
      }

      phones.push(alternatePhone);
      await updateLead(lead.id, { alternatePhone: phones });
      await addLeadNote(lead.id, `Alternate phone added: ${alternatePhone}`, 'Employee');
      toast({ title: 'Success', description: 'Alternate phone number added' });
      setAlternatePhone('');
      setIsAddingPhone(false);
    } catch (error) {
      console.error('Failed to add phone:', error);
      toast({ title: 'Error', description: 'Failed to add phone number', variant: 'destructive' });
    }
  };

  const handleRemoveAlternatePhone = async (phoneToRemove) => {
    try {
      const currentAlternate = lead.alternatePhone || lead.alternate_phone || [];
      const phones = Array.isArray(currentAlternate) ? currentAlternate : [currentAlternate].filter(Boolean);
      const updatedPhones = phones.filter(p => p !== phoneToRemove);
      
      await updateLead(lead.id, { alternatePhone: updatedPhones });
      await addLeadNote(lead.id, `Alternate phone removed: ${phoneToRemove}`, 'Employee');
      toast({ title: 'Success', description: 'Phone number removed' });
    } catch (error) {
      console.error('Failed to remove phone:', error);
      toast({ title: 'Error', description: 'Failed to remove phone', variant: 'destructive' });
    }
  };

  const alternatePhones = Array.isArray(lead.alternatePhone || lead.alternate_phone) 
    ? (lead.alternatePhone || lead.alternate_phone)
    : [lead.alternatePhone || lead.alternate_phone].filter(Boolean);

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/crm/my-leads')}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Lead Details</h1>
              <p className="text-xs text-blue-100">View and manage lead</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          
          {/* Name Card - Editable */}
          <Card className="border-blue-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-700">Customer Name</h3>
              </div>
              
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName} className="bg-green-600 hover:bg-green-700 px-3">
                    <Check size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditedName(lead.name);
                    setIsEditingName(false);
                  }} className="px-3">
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border">
                  <span className="font-semibold text-gray-900">{lead.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                    className="text-blue-600 hover:text-blue-700 h-8 px-2"
                  >
                    <Edit2 size={14} className="mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Primary Phone Card */}
          <Card className="border-green-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone size={18} className="text-green-600" />
                <h3 className="font-semibold text-gray-700">Primary Phone</h3>
              </div>
              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2.5 border border-green-200">
                <span className="font-semibold text-gray-900">{lead.phone}</span>
                <a href={`tel:${lead.phone}`}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8">
                    <Phone size={14} className="mr-1" />
                    Call
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Alternate Phones Card */}
          <Card className="border-blue-200 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-700">Alternate Phones</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingPhone(true)}
                  className="text-blue-600 hover:text-blue-700 h-8"
                >
                  <Plus size={14} className="mr-1" />
                  Add
                </Button>
              </div>
              
              {alternatePhones.length > 0 ? (
                <div className="space-y-2">
                  {alternatePhones.map((phone, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2.5 border border-blue-200">
                      <span className="font-medium text-gray-900">{phone}</span>
                      <div className="flex gap-1">
                        <a href={`tel:${phone}`}>
                          <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 h-8 px-2">
                            <Phone size={14} />
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAlternatePhone(phone)}
                          className="text-red-600 hover:bg-red-50 h-8 px-2"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-2">No alternate numbers</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-green-500 hover:bg-green-600 h-12">
                <MessageSquare size={18} className="mr-2" />
                WhatsApp
              </Button>
            </a>
            <Button 
              onClick={() => navigate(`/crm/lead/${lead.id}/update`)}
              className="bg-blue-600 hover:bg-blue-700 h-12"
            >
              Update Status
            </Button>
          </div>

          {/* Other Info */}
          {lead.project && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Project</p>
                <p className="font-semibold text-gray-900">{lead.project}</p>
              </CardContent>
            </Card>
          )}

          {lead.budget && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 mb-1">Budget</p>
                <div className="flex items-center gap-1">
                  <IndianRupee size={16} className="text-gray-700" />
                  <p className="font-semibold text-gray-900">₹{lead.budget}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Phone Dialog */}
        <Dialog open={isAddingPhone} onOpenChange={setIsAddingPhone}>
          <DialogContent className="w-11/12 max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle>Add Alternate Phone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Enter 10-digit number"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="text-base"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddAlternatePhone} className="flex-1">
                  Add Number
                </Button>
                <Button variant="outline" onClick={() => {
                  setAlternatePhone('');
                  setIsAddingPhone(false);
                }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop View (your existing desktop layout)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        
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
            <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage lead information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {/* Editable Name */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Name</label>
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="icon" onClick={handleSaveName} className="bg-green-600 hover:bg-green-700">
                        <Check size={18} />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => {
                        setEditedName(lead.name);
                        setIsEditingName(false);
                      }}>
                        <X size={18} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <span className="font-semibold text-gray-900">{lead.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(true)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 size={16} className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Primary Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Primary Phone</label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <Phone size={18} className="text-blue-600" />
                    <span className="font-medium text-gray-900">{lead.phone}</span>
                    <a href={`tel:${lead.phone}`} className="ml-auto">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Call
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Alternate Phones */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Alternate Phone Numbers</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingPhone(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={16} className="mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {alternatePhones.length > 0 ? (
                    <div className="space-y-2">
                      {alternatePhones.map((phone, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                          <div className="flex items-center gap-3">
                            <Phone size={16} className="text-blue-600" />
                            <span className="font-medium text-gray-900">{phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <a href={`tel:${phone}`}>
                              <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50">
                                Call
                              </Button>
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveAlternatePhone(phone)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No alternate phone numbers added</p>
                  )}
                </div>

                {lead.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Email</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <Mail size={18} className="text-blue-600" />
                      <span className="text-gray-900">{lead.email}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Phone Dialog */}
      <Dialog open={isAddingPhone} onOpenChange={setIsAddingPhone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Alternate Phone Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Enter 10-digit phone number"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddAlternatePhone} className="flex-1">
                Add Number
              </Button>
              <Button variant="outline" onClick={() => {
                setAlternatePhone('');
                setIsAddingPhone(false);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeadDetails;
