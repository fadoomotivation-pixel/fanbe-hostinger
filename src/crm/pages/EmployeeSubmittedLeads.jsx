import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getEmployeeLeads } from '@/lib/crmSupabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Phone, AlertCircle, RefreshCw, MapPin, Calendar, Briefcase } from 'lucide-react';

const INTEREST_COLORS = {
  hot:  'bg-red-100 text-red-700',
  warm: 'bg-amber-100 text-amber-700',
  cold: 'bg-blue-100 text-blue-700',
};

const EmployeeSubmittedLeads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeLeads(user.id);
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch submitted leads:', err);
      toast({ title: 'Error', description: 'Failed to load submitted leads.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Submitted Leads</h1>
            <p className="text-sm text-gray-500 mt-1">Leads you&apos;ve submitted to admin</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={() => navigate('/crm/sales/add-lead')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus size={18} className="mr-1" /> Add Lead
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Submitted', value: leads.length, color: 'border-emerald-400' },
            { label: 'This Month', value: leads.filter(l => { const d = new Date(l.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: 'border-blue-400' },
            { label: 'Site Visit Requested', value: leads.filter(l => l.site_visit_interest).length, color: 'border-purple-400' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} p-3 shadow-sm`}>
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <RefreshCw size={32} className="animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-lg">No leads submitted yet</p>
            <Button onClick={() => navigate('/crm/sales/add-lead')} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus size={18} className="mr-1" /> Submit Your First Lead
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <Card key={lead.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-lg">{lead.customer_name}</h3>
                        {lead.interest_level && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INTEREST_COLORS[lead.interest_level] || ''}`}>
                            {lead.interest_level.toUpperCase()}
                          </span>
                        )}
                        {lead.site_visit_interest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Site Visit
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                          {lead.city && <span className="flex items-center gap-1"><MapPin size={14} /> {lead.city}{lead.locality ? `, ${lead.locality}` : ''}</span>}
                          {lead.project_interested && <span className="flex items-center gap-1"><Briefcase size={14} /> {lead.project_interested}</span>}
                        </div>
                        {lead.budget_range && <p><strong>Budget:</strong> {lead.budget_range}</p>}
                        {lead.employee_remarks && <p className="text-gray-500 italic truncate">&quot;{lead.employee_remarks}&quot;</p>}
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSubmittedLeads;
