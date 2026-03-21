import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeLeads, updateEmployeeLead } from '@/lib/crmSupabase';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle, XCircle, Clock, RefreshCw, Search, Phone, MapPin, User,
  ChevronDown, ChevronUp, Calendar, Briefcase, MessageSquare, ArrowRight, Filter
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-800 border-red-300',       icon: XCircle },
  converted: { label: 'Converted', color: 'bg-blue-100 text-blue-800 border-blue-300',    icon: CheckCircle },
};

const INTEREST_COLORS = {
  hot:  'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TIMELINE_LABELS = {
  immediate: 'Immediate', '3_months': 'Within 3 Months', '6_months': 'Within 6 Months',
  '1_year': 'Within 1 Year', flexible: 'Flexible',
};
const PURPOSE_LABELS = { investment: 'Investment', self_use: 'Self Use', both: 'Both' };
const FINANCING_LABELS = { cash: 'Cash / Self-Funded', loan: 'Bank Loan', both: 'Both' };
const PROPERTY_LABELS = { plot: 'Plot', flat: 'Flat/Apartment', villa: 'Villa', commercial: 'Commercial', other: 'Other' };

const AdminEmployeeLeads = () => {
  const { user } = useAuth();
  const { addLead } = useCRMData();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch employee leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (lead, newStatus) => {
    setActionLoading(lead.id);
    try {
      const updates = {
        admin_status: newStatus,
        admin_notes: adminNotes[lead.id] || lead.admin_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      const result = await updateEmployeeLead(lead.id, updates);
      if (result.success) {
        toast({ title: `Lead ${newStatus}`, description: `"${lead.customer_name}" has been ${newStatus}.` });
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updates } : l));
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to update lead.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToLead = async (lead) => {
    setActionLoading(lead.id);
    try {
      const newLead = await addLead({
        name: lead.customer_name,
        phone: lead.phone,
        email: lead.email || '',
        source: `Employee Lead - ${lead.submitted_by_name}`,
        interestLevel: lead.interest_level || 'warm',
        budget: lead.budget_range || '',
        project: lead.project_interested || '',
        notes: `[Employee Lead] Submitted by ${lead.submitted_by_name}.\nCustomer Remarks: ${lead.customer_remarks || 'N/A'}\nEmployee Assessment: ${lead.employee_remarks || 'N/A'}\nOccupation: ${lead.occupation || 'N/A'}\nCity: ${lead.city || 'N/A'}\nProperty Type: ${PROPERTY_LABELS[lead.property_type] || lead.property_type || 'N/A'}\nPurpose: ${PURPOSE_LABELS[lead.purpose] || lead.purpose || 'N/A'}`,
      });

      if (newLead) {
        await updateEmployeeLead(lead.id, {
          admin_status: 'converted',
          admin_notes: adminNotes[lead.id] || lead.admin_notes || 'Converted to main lead.',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          converted_lead_id: newLead.id,
        });
        toast({ title: 'Lead Converted!', description: `"${lead.customer_name}" has been added to the main leads system.` });
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, admin_status: 'converted', converted_lead_id: newLead.id } : l));
      } else {
        throw new Error('Failed to create lead');
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to convert lead.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = leads
    .filter(l => filter === 'all' ? true : l.admin_status === filter)
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (l.customer_name || '').toLowerCase().includes(q)
        || (l.phone || '').includes(q)
        || (l.submitted_by_name || '').toLowerCase().includes(q)
        || (l.city || '').toLowerCase().includes(q);
    });

  const stats = {
    total: leads.length,
    pending: leads.filter(l => l.admin_status === 'pending').length,
    approved: leads.filter(l => l.admin_status === 'approved').length,
    converted: leads.filter(l => l.admin_status === 'converted').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employee Submitted Leads</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage leads submitted by your team</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'border-gray-300', bg: 'bg-gray-50' },
            { label: 'Pending', value: stats.pending, color: 'border-amber-400', bg: 'bg-amber-50' },
            { label: 'Approved', value: stats.approved, color: 'border-green-400', bg: 'bg-green-50' },
            { label: 'Converted', value: stats.converted, color: 'border-blue-400', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border-l-4 ${s.color} p-3 shadow-sm`}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search by name, phone, employee, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'converted'].map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-blue-600 text-white' : ''}
              >
                {f === 'all' ? `All (${leads.length})` : `${STATUS_CONFIG[f]?.label} (${leads.filter(l => l.admin_status === f).length})`}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw size={32} className="animate-spin mx-auto mb-2" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Filter size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-lg">No leads found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => {
              const status = STATUS_CONFIG[lead.admin_status] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedId === lead.id;
              const isActioning = actionLoading === lead.id;

              return (
                <Card key={lead.id} className={`border shadow-sm hover:shadow-md transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                  <CardContent className="p-4">
                    {/* Summary Row */}
                    <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : lead.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-lg">{lead.customer_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.color}`}>
                            <StatusIcon size={12} className="inline mr-1" />{status.label}
                          </span>
                          {lead.interest_level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${INTEREST_COLORS[lead.interest_level] || ''}`}>
                              {lead.interest_level.toUpperCase()}
                            </span>
                          )}
                          {lead.site_visit_interest && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                              Site Visit
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600 flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                          {lead.city && <span className="flex items-center gap-1"><MapPin size={14} /> {lead.city}</span>}
                          <span className="flex items-center gap-1"><User size={14} /> {lead.submitted_by_name}</span>
                          {lead.project_interested && <span className="flex items-center gap-1"><Briefcase size={14} /> {lead.project_interested}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          {lead.email && <Detail label="Email" value={lead.email} />}
                          {lead.alternate_phone && <Detail label="Alt. Phone" value={lead.alternate_phone} />}
                          {lead.occupation && <Detail label="Occupation" value={lead.occupation} />}
                          {lead.locality && <Detail label="Locality" value={lead.locality} />}
                          {lead.pincode && <Detail label="Pincode" value={lead.pincode} />}
                          {lead.budget_range && <Detail label="Budget" value={lead.budget_range} />}
                          {lead.property_type && <Detail label="Property Type" value={PROPERTY_LABELS[lead.property_type] || lead.property_type} />}
                          {lead.preferred_size && <Detail label="Preferred Size" value={lead.preferred_size} />}
                          {lead.purpose && <Detail label="Purpose" value={PURPOSE_LABELS[lead.purpose] || lead.purpose} />}
                          {lead.possession_timeline && <Detail label="Timeline" value={TIMELINE_LABELS[lead.possession_timeline] || lead.possession_timeline} />}
                          {lead.financing && <Detail label="Financing" value={FINANCING_LABELS[lead.financing] || lead.financing} />}
                          {lead.source && <Detail label="Source" value={lead.source} />}
                          {lead.how_they_know && <Detail label="How They Know Us" value={lead.how_they_know} />}
                          {lead.preferred_visit_date && <Detail label="Preferred Visit" value={new Date(lead.preferred_visit_date).toLocaleDateString('en-IN')} />}
                        </div>

                        {(lead.customer_remarks || lead.employee_remarks) && (
                          <div className="space-y-2">
                            {lead.customer_remarks && (
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-1"><MessageSquare size={12} className="inline mr-1" />Customer Remarks</p>
                                <p className="text-sm text-gray-700">{lead.customer_remarks}</p>
                              </div>
                            )}
                            {lead.employee_remarks && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-medium text-blue-600 uppercase mb-1"><User size={12} className="inline mr-1" />Employee Assessment</p>
                                <p className="text-sm text-gray-700">{lead.employee_remarks}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Admin Actions */}
                        {lead.admin_status === 'pending' && (
                          <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                            <Textarea
                              placeholder="Add notes for this lead (optional)..."
                              value={adminNotes[lead.id] || ''}
                              onChange={(e) => setAdminNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                              rows={2}
                              className="bg-white"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" onClick={() => handleConvertToLead(lead)} disabled={isActioning}
                                className="bg-blue-600 hover:bg-blue-700 text-white">
                                <ArrowRight size={14} className="mr-1" /> Convert to Lead
                              </Button>
                              <Button size="sm" onClick={() => handleStatusChange(lead, 'approved')} disabled={isActioning}
                                className="bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle size={14} className="mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(lead, 'rejected')} disabled={isActioning}
                                className="border-red-300 text-red-600 hover:bg-red-50">
                                <XCircle size={14} className="mr-1" /> Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {lead.admin_status !== 'pending' && lead.admin_notes && (
                          <div className="p-3 bg-slate-50 rounded-lg border">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Admin Notes</p>
                            <p className="text-sm text-gray-700">{lead.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-gray-800 font-medium">{value}</p>
  </div>
);

export default AdminEmployeeLeads;
