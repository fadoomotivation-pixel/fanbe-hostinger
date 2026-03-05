
import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Search, Phone, ChevronRight, Flame, Wind, Snowflake,
  AlertCircle, Filter, Users, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import FollowUpBadge from '@/crm/components/FollowUpBadge';
import { calculatePriority } from '@/crm/hooks/useLeadPriority';
import {
  normalizeLeadStatus, normalizeInterestLevel,
  getStatusColor, LEAD_STATUS
} from '@/crm/utils/statusUtils';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Status' },
  { key: LEAD_STATUS.OPEN, label: 'Open' },
  { key: LEAD_STATUS.FOLLOW_UP, label: 'Follow Up' },
  { key: LEAD_STATUS.BOOKED, label: 'Booked' },
  { key: LEAD_STATUS.LOST, label: 'Lost' },
];

const TemperatureDot = ({ level }) => {
  const normalized = normalizeInterestLevel(level);
  if (normalized === 'Hot') return <Flame size={14} className="text-red-500" />;
  if (normalized === 'Warm') return <Wind size={14} className="text-amber-500" />;
  return <Snowflake size={14} className="text-blue-400" />;
};

const MobileLeadList = () => {
  const { leads } = useCRMData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const myLeads = useMemo(() => {
    let result = leads.filter(l => l.assignedTo === user.id || l.assigned_to === user.id);

    result = result.map(l => ({
      ...l,
      _priority: calculatePriority(l.followUpDate || l.follow_up_date),
      _status: normalizeLeadStatus(l.status),
      _interest: normalizeInterestLevel(l.interestLevel || l.interest_level),
    }));

    result.sort((a, b) => {
      if (a._priority !== b._priority) return a._priority - b._priority;
      const da = new Date(a.followUpDate || a.follow_up_date || 0);
      const db = new Date(b.followUpDate || b.follow_up_date || 0);
      if (da.getTime() !== db.getTime()) return da - db;
      return new Date(b.updatedAt || b.updated_at || 0) - new Date(a.updatedAt || a.updated_at || 0);
    });

    return result;
  }, [leads, user]);

  const filtered = useMemo(() => {
    let result = myLeads;

    if (term) {
      const t = term.toLowerCase();
      result = result.filter(l =>
        l.name?.toLowerCase().includes(t) ||
        l.phone?.includes(t) ||
        l.project?.toLowerCase().includes(t)
      );
    }

    if (activeTab === 'overdue') result = result.filter(l => l._priority === 1);
    else if (activeTab === 'today') result = result.filter(l => l._priority === 2);
    else if (activeTab === 'upcoming') result = result.filter(l => l._priority >= 3 && l._priority <= 5);

    if (statusFilter !== 'all') {
      result = result.filter(l => l._status === statusFilter);
    }

    return result;
  }, [myLeads, term, activeTab, statusFilter]);

  const summary = useMemo(() => {
    const counts = { overdue: 0, today: 0, upcoming: 0 };
    myLeads.forEach(l => {
      if (l._priority === 1) counts.overdue++;
      else if (l._priority === 2) counts.today++;
      else if (l._priority >= 3 && l._priority <= 5) counts.upcoming++;
    });
    return counts;
  }, [myLeads]);

  const stats = useMemo(() => ({
    total: myLeads.length,
    open: myLeads.filter(l => l._status === LEAD_STATUS.OPEN).length,
    followUp: myLeads.filter(l => l._status === LEAD_STATUS.FOLLOW_UP).length,
    booked: myLeads.filter(l => l._status === LEAD_STATUS.BOOKED).length,
    lost: myLeads.filter(l => l._status === LEAD_STATUS.LOST).length,
    hot: myLeads.filter(l => l._interest === 'Hot').length,
    warm: myLeads.filter(l => l._interest === 'Warm').length,
    cold: myLeads.filter(l => l._interest === 'Cold').length,
  }), [myLeads]);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b px-4 pt-4 pb-2 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">My Leads</h1>
            <p className="text-xs text-gray-500">{myLeads.length} leads assigned</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/crm/lead/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
            >
              <Plus size={14} className="mr-1" />
              <span className="hidden sm:inline">Add Lead</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className={`p-2 rounded-lg border transition ${showStatusFilter ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <span className="text-[10px] text-blue-600 font-medium">Open</span>
            <span className="text-sm font-bold text-blue-700">{stats.open}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <span className="text-[10px] text-orange-600 font-medium">Follow Up</span>
            <span className="text-sm font-bold text-orange-700">{stats.followUp}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <span className="text-[10px] text-green-600 font-medium">Booked</span>
            <span className="text-sm font-bold text-green-700">{stats.booked}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <span className="text-[10px] text-gray-500 font-medium">Lost</span>
            <span className="text-sm font-bold text-gray-600">{stats.lost}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <Flame size={12} className="text-red-500" />
            <span className="text-[10px] text-red-600 font-medium">Hot</span>
            <span className="text-sm font-bold text-red-600">{stats.hot}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <Wind size={12} className="text-amber-500" />
            <span className="text-[10px] text-amber-600 font-medium">Warm</span>
            <span className="text-sm font-bold text-amber-600">{stats.warm}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5 shrink-0">
            <Snowflake size={12} className="text-blue-400" />
            <span className="text-[10px] text-blue-500 font-medium">Cold</span>
            <span className="text-sm font-bold text-blue-500">{stats.cold}</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-100 rounded-lg flex items-center px-3 py-2 mb-3">
          <Search size={16} className="text-gray-400 mr-2 shrink-0" />
          <input
            placeholder="Search name, phone, project..."
            className="flex-1 outline-none text-sm bg-transparent"
            value={term}
            onChange={e => setTerm(e.target.value)}
          />
          {term && (
            <button onClick={() => setTerm('')} className="text-gray-400 text-xs ml-1">Clear</button>
          )}
        </div>

        {/* Priority Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? myLeads.length : summary[tab.key] || 0;
            const isActive = activeTab === tab.key;
            const isUrgent = tab.key === 'overdue' && count > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? isUrgent ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    : isUrgent ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.key === 'overdue' && <AlertCircle size={12} />}
                {tab.label}
                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Row */}
        {showStatusFilter && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar mt-2 -mx-1 px-1 pb-1">
            {STATUS_FILTERS.map(sf => (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(sf.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                  statusFilter === sf.key
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Urgent Alert */}
      {summary.overdue > 0 && activeTab === 'all' && (
        <div
          className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer active:bg-red-100"
          onClick={() => setActiveTab('overdue')}
        >
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <p className="text-xs text-red-700 font-medium">
            {summary.overdue} overdue follow-up{summary.overdue > 1 ? 's' : ''} need attention
          </p>
          <ChevronRight size={14} className="text-red-400 ml-auto shrink-0" />
        </div>
      )}

      {/* Lead Cards */}
      <div className="px-4 pt-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No leads found</p>
            <p className="text-gray-400 text-xs mt-1">
              {term ? 'Try a different search' : activeTab !== 'all' ? 'No leads in this category' : 'No leads assigned yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
            {filtered.map(lead => {
              const followUpDate = lead.followUpDate || lead.follow_up_date;
              const followUpTime = lead.followUpTime || lead.follow_up_time;
              const isOverdue = lead._priority === 1;
              const isToday = lead._priority === 2;
              const lastUpdated = lead.updatedAt || lead.updated_at;

              return (
                <div
                  key={lead.id}
                  className={`bg-white rounded-xl shadow-sm border active:scale-[0.99] transition-transform cursor-pointer ${
                    isOverdue ? 'border-red-200 border-l-4 border-l-red-500' :
                    isToday ? 'border-yellow-200 border-l-4 border-l-yellow-500' :
                    'border-gray-100 hover:border-gray-200 hover:shadow-md'
                  }`}
                  onClick={() => navigate(`/crm/lead/${lead.id}`)}
                >
                  <div className="px-3 pt-3 pb-1 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TemperatureDot level={lead.interestLevel || lead.interest_level} />
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{lead.name}</h3>
                      </div>
                      {lead.project && (
                        <p className="text-[11px] text-gray-400 mt-0.5 ml-5 truncate">{lead.project}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(lead.status)}`}>
                        {lead._status === 'FollowUp' ? 'Follow Up' : lead._status}
                      </span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>

                  {followUpDate && (
                    <div className="px-3 pb-1">
                      <FollowUpBadge followUpDate={followUpDate} followUpTime={followUpTime} size="small" />
                    </div>
                  )}

                  <div className="px-3 pb-2.5 pt-1.5 flex justify-between items-center border-t border-gray-50 mt-1">
                    <div className="text-[11px] text-gray-400 truncate">
                      <span>{lead.phone}</span>
                      {lead.budget ? <span> · ₹{Number(lead.budget).toLocaleString('en-IN')}</span> : null}
                      {lastUpdated && (
                        <span className="hidden sm:inline"> · {new Date(lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      )}
                    </div>
                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 border border-green-200 active:bg-green-100"
                      >
                        <Phone size={14} className="text-green-600" />
                      </a>
                      <WhatsAppButton
                        leadName={lead.name}
                        phoneNumber={lead.phone}
                        size="sm"
                        className="h-8 px-2 rounded-full text-xs"
                      />
                      <button
                        onClick={() => navigate(`/crm/lead/${lead.id}/update`)}
                        className="h-8 px-2.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-medium active:bg-blue-100"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
};

export default MobileLeadList;
