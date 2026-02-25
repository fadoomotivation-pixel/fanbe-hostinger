import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, Phone, MessageCircle, Mail, MapPin, Calendar, 
  DollarSign, Tag, User, Clock, Edit, Plus, FileText 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leads, calls, siteVisits, addLeadNote, updateLead } = useCRMData();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const lead = leads.find(l => l.id === id);
  const leadCalls = calls.filter(c => c.leadId === id);
  const leadVisits = siteVisits.filter(v => v.leadId === id);

  useEffect(() => {
    if (!lead) {
      toast({ title: 'Lead not found', variant: 'destructive' });
      navigate('/crm/sales/my-leads');
    }
  }, [lead, navigate, toast]);

  if (!lead) return null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    await addLeadNote(id, newNote, user?.name || 'User');
    setNewNote('');
    toast({ title: 'Note added successfully' });
    setIsAddingNote(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Booked': return 'bg-green-100 text-green-800';
      case 'FollowUp': return 'bg-yellow-100 text-yellow-800';
      case 'Lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getInterestColor = (level) => {
    switch(level) {
      case 'Hot': return 'bg-red-100 text-red-800';
      case 'Warm': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Combine activity timeline
  const timeline = [
    ...leadCalls.map(c => ({ ...c, type: 'call', timestamp: c.timestamp || c.created_at })),
    ...leadVisits.map(v => ({ ...v, type: 'visit', timestamp: v.timestamp || v.created_at })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#0F3A5F]">{lead.name}</h1>
            <p className="text-gray-500 text-sm">Lead Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/crm/sales/edit-lead/${id}`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Contact & Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline font-medium">
                      {lead.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{lead.email || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Interest Level</p>
                  <Badge className={getInterestColor(lead.interestLevel)}>{lead.interestLevel}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Project</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{lead.project || 'Not specified'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Budget</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{lead.budget || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Source</p>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span>{lead.source}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Assigned Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{lead.createdAt ? format(parseISO(lead.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {lead.followUpDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Follow-up scheduled: {format(parseISO(lead.followUpDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${lead.phone}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
                <Link to="/crm/sales/daily-calling">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Log Call
                  </Button>
                </Link>
                <Link to="/crm/sales/site-visits">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Schedule Visit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes & Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.notes ? (
                <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {lead.notes}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No notes added yet.</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Add New Note</label>
                <Textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add your notes here..."
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim() || isAddingNote} size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((activity, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === 'call' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {activity.type === 'call' ? 
                          <Phone className="h-4 w-4 text-blue-600" /> : 
                          <User className="h-4 w-4 text-purple-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {activity.type === 'call' ? 'Call Logged' : 'Site Visit'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.timestamp ? format(parseISO(activity.timestamp), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>
                        )}
                        {activity.type === 'call' && (
                          <p className="text-xs text-gray-500 mt-1">Duration: {activity.duration} min</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">No activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Calls</span>
                <span className="font-bold text-lg">{leadCalls.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Connected Calls</span>
                <span className="font-bold text-lg text-green-600">
                  {leadCalls.filter(c => c.status === 'Connected').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Site Visits</span>
                <span className="font-bold text-lg">{leadVisits.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Contact</span>
                <span className="text-sm font-medium">
                  {lead.lastActivity ? format(parseISO(lead.lastActivity), 'MMM dd') : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{lead.assignedToName || user?.name || 'You'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Created On</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{lead.createdAt ? format(parseISO(lead.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
