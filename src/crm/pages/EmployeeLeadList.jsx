import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Phone, Calendar, IndianRupee, TrendingUp } from 'lucide-react';

const statusColors = {
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
  FollowUp: 'bg-amber-100 text-amber-700 border-amber-200',
  Booked: 'bg-green-100 text-green-700 border-green-200',
  Lost: 'bg-red-100 text-red-700 border-red-200',
};

const EmployeeLeadList = () => {
  const navigate = useNavigate();
  const { leads } = useCRMData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const userId = user?.uid || user?.id;

  // Filter and sort leads - newest first by updatedAt or createdAt
  const myLeads = useMemo(() => {
    return leads
      .filter(lead => lead.assignedTo === userId)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0);
        const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0);
        return dateB - dateA; // Newest first
      });
  }, [leads, userId]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return myLeads;
    const term = searchTerm.toLowerCase();
    return myLeads.filter(lead =>
      lead.name?.toLowerCase().includes(term) ||
      lead.phone?.includes(term) ||
      lead.project?.toLowerCase().includes(term)
    );
  }, [myLeads, searchTerm]);

  const stats = useMemo(() => ({
    total: myLeads.length,
    open: myLeads.filter(l => l.status === 'Open').length,
    followUp: myLeads.filter(l => l.status === 'FollowUp' || l.status === 'Follow Up').length,
    booked: myLeads.filter(l => l.status === 'Booked').length,
  }), [myLeads]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your assigned leads</p>
          </div>
          <Button
            onClick={() => navigate('/crm/lead/new')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Plus size={18} className="mr-2" />
            Add Manual Lead
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Open</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{stats.open}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Follow Up</p>
                <p className="text-3xl font-bold text-amber-700 mt-1">{stats.followUp}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Booked</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{stats.booked}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search by name, phone, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-gray-200"
            />
          </div>
        </div>

        {/* Leads List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => navigate(`/crm/lead/${lead.id}`)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{lead.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{lead.project}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[lead.status] || statusColors.Open}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      <span>{lead.phone}</span>
                    </div>

                    {lead.budget && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IndianRupee size={14} />
                        <span>₹{lead.budget}</span>
                      </div>
                    )}

                    {lead.followUpDate && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {new Date(lead.followUpDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {(lead.updatedAt || lead.updated_at) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Updated: {new Date(lead.updatedAt || lead.updated_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No leads found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeadList;
