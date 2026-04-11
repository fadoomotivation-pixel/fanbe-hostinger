import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Phone, IndianRupee, Mail,
  Edit2, Check, X, Plus, Trash2, MessageSquare,
  Flame, Wind, Snowflake, MapPin, Clock, Calendar, PhoneCall
} from 'lucide-react';
import FollowUpBadge from '@/crm/components/FollowUpBadge';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import LogCallModal from '@/crm/components/LogCallModal';
import { normalizeLeadStatus, normalizeInterestLevel, getStatusColor } from '@/crm/utils/statusUtils';

const TemperatureChip = ({ level }) => {
  const normalized = normalizeInterestLevel(level);
  const config = {
    Hot: { icon: Flame, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    Warm: { icon: Wind, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    Cold: { icon: Snowflake, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  };
  const c = config[normalized] || config.Warm;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
      <Icon size={12} />
      {normalized}
    </span>
  );
};

const MobileLeadDetails = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { leads, leadsLoading, updateLead, addLeadNote } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();

  const lead = leads.find(l => l.id === leadId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(lead?.name || '');
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [alternatePhone, setAlternatePhone] = useState('');
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);

  useEffect(() => {
    if (lead) setEditedName(lead.name);
  }, [lead]);

  // Smart back navigation
  const handleBack = () => {
    // Check if there's a referrer state from the previous page
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      // Try to go back if there's history
      navigate(-1);
    } else {
      // Default fallback to my-leads
      navigate('/crm/sales/my-leads');
    }
  };

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
        <Button onClick={() => navigate('/crm/sales/my-leads')} className="mt-4">
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

  const status = normalizeLeadStatus(lead.status);
  const followUpDate = lead.followUpDate || lead.follow_up_date;
  const followUpTime = lead.followUpTime || lead.follow_up_time;
  const interest = lead.interestLevel || lead.interest_level;
  const lastUpdated = lead.updatedAt || lead.updated_at;

  return (
    <div className="min-h-screen bg-[#F6F7F9] pb-24">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl font-bold text-[#1D222C] truncate">Lead Details</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-3">

            {/* Lead Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                {isEditingName ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 h-9 text-sm"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="p-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 active:scale-95 transition">
                      <Check size={16} />
                    </button>
                    <button onClick={() => { setEditedName(lead.name); setIsEditingName(false); }} className="p-1.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 active:scale-95 transition">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{lead.name}</h2>
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition"
                    >
                      <Edit2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Status + Interest Row */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(lead.status)}`}>
                  {status === 'FollowUp' ? 'Follow Up' : status}
                </span>
                <TemperatureChip level={interest} />
                {followUpDate && (
                  <FollowUpBadge followUpDate={followUpDate} followUpTime={followUpTime} size="small" />
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {lead.project && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    {lead.project}
                  </span>
                )}
                {lead.budget && (
                  <span className="flex items-center gap-1">
                    <IndianRupee size={12} className="text-gray-400" />
                    ₹{Number(lead.budget).toLocaleString('en-IN')}
                  </span>
                )}
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-gray-400" />
                    {lead.email}
                  </span>
                )}
                {lastUpdated && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" />
                    {new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                onClick={() => setIsLogCallModalOpen(true)}
                className="h-11 bg-[#155C52] hover:bg-[#11463E] text-sm font-semibold rounded-xl"
              >
                <PhoneCall size={16} className="mr-1.5" />
                Log Call
              </Button>
              <Button
                onClick={() => navigate(`/crm/lead/${lead.id}/update`)}
                className="h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl"
              >
                Update
              </Button>
              <Button
                onClick={() => navigate(`/crm/sales/site-visits?leadId=${lead.id}`)}
                className="h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl"
              >
                <MapPin size={16} className="mr-1.5" />
                Visit
              </Button>
              <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl">
                  <MessageSquare size={16} className="mr-1.5" />
                  WhatsApp
                </Button>
              </a>
            </div>

            {/* Additional Info */}
            {(lead.source || lead.notes) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Details</h3>
                {lead.source && (
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Source</p>
                    <p className="text-sm text-gray-700">{lead.source}</p>
                  </div>
                )}
                {lead.notes && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Last Notes</p>
                    <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-6">{lead.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Contact */}
          <div className="space-y-3">

            {/* Phone Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact</h3>

              {/* Primary Phone */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 mb-2">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Primary</p>
                  <p className="font-semibold text-gray-900 text-sm">{lead.phone}</p>
                </div>
                <div className="flex gap-1.5">
                  <a href={`tel:${lead.phone}`}>
                    <button className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 border border-green-200 active:bg-green-100 transition">
                      <Phone size={16} className="text-green-600" />
                    </button>
                  </a>
                  <a href={`https://wa.me/91${lead.phone}`} target="_blank" rel="noopener noreferrer">
                    <button className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 border border-green-200 active:bg-green-100 transition">
                      <MessageSquare size={16} className="text-green-600" />
                    </button>
                  </a>
                </div>
              </div>

              {/* Alternate Phones */}
              {alternatePhones.length > 0 && alternatePhones.map((phone, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100 mb-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Alternate</p>
                    <p className="font-medium text-gray-900 text-sm">{phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${phone}`}>
                      <button className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 border border-green-200 active:bg-green-100 transition">
                        <Phone size={14} className="text-green-600" />
                      </button>
                    </a>
                    <button
                      onClick={() => handleRemoveAlternatePhone(phone)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 border border-red-200 active:bg-red-100 transition"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setIsAddingPhone(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-1 px-1 hover:text-blue-700 active:scale-95 transition"
              >
                <Plus size={14} />
                Add alternate number
              </button>
            </div>
          </div>

        </div>
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

      {/* Log Call Modal */}
      <LogCallModal
        lead={lead}
        isOpen={isLogCallModalOpen}
        onClose={() => setIsLogCallModalOpen(false)}
        onSuccess={() => {
          toast({
            title: '✅ Call Logged',
            description: 'Call has been recorded successfully',
          });
        }}
      />
    </div>
  );
};

export default MobileLeadDetails;
