import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, MessageCircle, Calendar, User, X, ArrowRight } from 'lucide-react';
import FollowUpBadge from '@/crm/components/FollowUpBadge';

const LeadSearch = () => {
  const { user } = useAuth();
  const { leads } = useCRMData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const myLeads = leads.filter(l => l.assignedTo === user?.id || l.assigned_to === user?.id);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return myLeads.filter(lead => {
      const name = (lead.name || '').toLowerCase();
      const phone = (lead.phone || '');
      return name.includes(q) || phone.includes(q);
    });
  }, [query, myLeads]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked': return 'bg-green-100 text-green-800';
      case 'FollowUp': return 'bg-yellow-100 text-yellow-800';
      case 'Lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getInterestColor = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'hot': return 'bg-red-100 text-red-700';
      case 'warm': return 'bg-orange-100 text-orange-700';
      default: return 'bg-sky-100 text-sky-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Search Leads</h1>
        <p className="text-gray-500">Quickly find any lead by name or phone number</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Type name or phone number..."
              className="pl-12 pr-10 h-12 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {query.trim() && (
            <p className="text-sm text-gray-500 mt-2">
              {results.length} {results.length === 1 ? 'lead' : 'leads'} found out of {myLeads.length} assigned leads
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Start typing a name or phone number to search</p>
          <p className="text-gray-300 text-sm mt-1">You have {myLeads.length} leads assigned to you</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <User className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No leads matching "{query}"</p>
          <p className="text-gray-300 text-sm mt-1">Try a different name or phone number</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(lead => (
            <Card
              key={lead.id}
              className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-[#0F3A5F]"
              onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#0F3A5F] text-lg">{lead.name}</h3>
                      <Badge className={`${getStatusColor(lead.status)} text-xs`}>{lead.status}</Badge>
                      {lead.interestLevel && (
                        <Badge className={`${getInterestColor(lead.interestLevel)} text-xs`}>
                          {lead.interestLevel}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </span>
                      {lead.project && (
                        <span className="text-gray-400">| {lead.project}</span>
                      )}
                      {lead.source && (
                        <span className="text-gray-400">| {lead.source}</span>
                      )}
                    </div>
                    {/* Follow-up badge */}
                    <div className="mt-2">
                      <FollowUpBadge
                        followUpDate={lead.follow_up_date}
                        followUpTime={lead.follow_up_time}
                        size="small"
                      />
                    </div>
                    {/* Last note preview */}
                    {lead.notes && (
                      <p className="text-xs text-gray-400 mt-2 truncate max-w-lg">
                        Last note: {lead.notes.split('\n').pop()}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Call"
                      onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
                    >
                      <Phone className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="WhatsApp"
                      onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank'); }}
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View Details"
                      onClick={(e) => { e.stopPropagation(); navigate(`/crm/sales/lead/${lead.id}`); }}
                    >
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadSearch;
