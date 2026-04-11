import React, { useState, useMemo, useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Search, Phone, ChevronRight, Flame, Wind, Snowflake,
  AlertCircle, Filter, Users, Plus, PhoneCall, X, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import FollowUpBadge from '@/crm/components/FollowUpBadge';
import LogCallModal from '@/crm/components/LogCallModal';
import { calculatePriority } from '@/crm/hooks/useLeadPriority';
import {
  normalizeLeadStatus, normalizeInterestLevel,
  getStatusColor, LEAD_STATUS
} from '@/crm/utils/statusUtils';

const FILTER_TABS = [
  { key: 'new', label: 'New' },
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
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('mobileLeads_activeTab') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [temperatureFilter, setTemperatureFilter] = useState('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedLeadForCallLog, setSelectedLeadForCallLog] = useState(null);

  useEffect(() => { sessionStorage.setItem('mobileLeads_activeTab', activeTab); }, [activeTab]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('mobileLeads_scrollPos');
    if (savedScroll) {
      requestAnimationFrame(() => { window.scrollTo(0, parseInt(savedScroll, 10)); });
    }
    let scrollTimer;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        sessionStorage.setItem('mobileLeads_scrollPos', String(window.scrollY));
      }, 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimer); };
  }, []);

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

    if (activeTab === 'new') {
      result = result.filter(l => l._status === 'Open' || l._status === 'New' || !l._status);
      result = [...result].sort((a, b) => {
        const aTime = new Date(a.assignedAt || a.assigned_at || a.createdAt || a.created_at || 0);
        const bTime = new Date(b.assignedAt || b.assigned_at || b.createdAt || b.created_at || 0);
        return bTime - aTime;
      });
    } else if (activeTab === 'overdue') result = result.filter(l => l._priority === 1);
    else if (activeTab === 'today') result = result.filter(l => l._priority === 2);
    else if (activeTab === 'upcoming') result = result.filter(l => l._priority >= 3 && l._priority <= 5);

    if (statusFilter !== 'all') {
      result = result.filter(l => l._status === statusFilter);
    }

    if (temperatureFilter !== 'all') {
      result = result.filter(l => l._interest === temperatureFilter);
    }

    return result;
  }, [myLeads, term, activeTab, statusFilter, temperatureFilter]);

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

  const handleStatusFilterClick = (status) => {
    setStatusFilter(statusFilter === status ? 'all' : status);
  };

  const handleTemperatureFilterClick = (temp) => {
    setTemperatureFilter(temperatureFilter === temp ? 'all' : temp);
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTemperatureFilter('all');
    setActiveTab('all');
    setTerm('');
  };

  const hasActiveFilters = statusFilter !== 'all' || temperatureFilter !== 'all' || activeTab !== 'all' || term !== '';

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b px-4 pt-4 pb-3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">My Leads</h1>
            <p className="text-xs text-gray-500 mt-0.5">{myLeads.length} leads assigned</p>
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
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                title="Clear all filters"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Smart Follow-up Info Banner */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-purple-900 font-medium flex items-center gap-1.5">
            <PhoneCall size={12} className="text-purple-600" />
            💡 Quick Tip: Use "Log" button after calls - system auto-creates follow-ups!
          </p>
        </div>

        {/* Clickable Stats Row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
          <button
            onClick={() => handleStatusFilterClick(LEAD_STATUS.OPEN)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              statusFilter === LEAD_STATUS.OPEN
                ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300 active:scale-95'
            }`}
          >
            <span className="text-[11px] font-medium">Open</span>
            <span className="text-sm font-bold">{stats.open}</span>
          </button>
          
          <button
            onClick={() => handleStatusFilterClick(LEAD_STATUS.FOLLOW_UP)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              statusFilter === LEAD_STATUS.FOLLOW_UP
                ? 'bg-orange-600 border-orange-600 text-white shadow-md scale-105'
                : 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-300 active:scale-95'
            }`}
          >
            <span className="text-[11px] font-medium">Follow Up</span>
            <span className="text-sm font-bold">{stats.followUp}</span>
          </button>
          
          <button
            onClick={() => handleStatusFilterClick(LEAD_STATUS.BOOKED)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              statusFilter === LEAD_STATUS.BOOKED
                ? 'bg-green-600 border-green-600 text-white shadow-md scale-105'
                : 'bg-green-50 border-green-200 text-green-700 hover:border-green-300 active:scale-95'
            }`}
          >
            <span className="text-[11px] font-medium">Booked</span>
            <span className="text-sm font-bold">{stats.booked}</span>
          </button>
          
          <button
            onClick={() => handleStatusFilterClick(LEAD_STATUS.LOST)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              statusFilter === LEAD_STATUS.LOST
                ? 'bg-gray-700 border-gray-700 text-white shadow-md scale-105'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 active:scale-95'
            }`}
          >
            <span className="text-[11px] font-medium">Lost</span>
            <span className="text-sm font-bold">{stats.lost}</span>
          </button>

          <div className="w-px h-8 bg-gray-200 mx-1" />
          
          <button
            onClick={() => handleTemperatureFilterClick('Hot')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              temperatureFilter === 'Hot'
                ? 'bg-red-600 border-red-600 text-white shadow-md scale-105'
                : 'bg-red-50 border-red-200 hover:border-red-300 active:scale-95'
            }`}
          >
            <Flame size={12} className={temperatureFilter === 'Hot' ? 'text-white' : 'text-red-500'} />
            <span className={`text-[11px] font-medium ${temperatureFilter === 'Hot' ? 'text-white' : 'text-red-600'}`}>Hot</span>
            <span className={`text-sm font-bold ${temperatureFilter === 'Hot' ? 'text-white' : 'text-red-600'}`}>{stats.hot}</span>
          </button>
          
          <button
            onClick={() => handleTemperatureFilterClick('Warm')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              temperatureFilter === 'Warm'
                ? 'bg-amber-600 border-amber-600 text-white shadow-md scale-105'
                : 'bg-amber-50 border-amber-200 hover:border-amber-300 active:scale-95'
            }`}
          >
            <Wind size={12} className={temperatureFilter === 'Warm' ? 'text-white' : 'text-amber-500'} />
            <span className={`text-[11px] font-medium ${temperatureFilter === 'Warm' ? 'text-white' : 'text-amber-600'}`}>Warm</span>
            <span className={`text-sm font-bold ${temperatureFilter === 'Warm' ? 'text-white' : 'text-amber-600'}`}>{stats.warm}</span>
          </button>
          
          <button
            onClick={() => handleTemperatureFilterClick('Cold')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 shrink-0 transition border-2 ${
              temperatureFilter === 'Cold'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                : 'bg-sky-50 border-sky-200 hover:border-sky-300 active:scale-95'
            }`}
          >
            <Snowflake size={12} className={temperatureFilter === 'Cold' ? 'text-white' : 'text-blue-400'} />
            <span className={`text-[11px] font-medium ${temperatureFilter === 'Cold' ? 'text-white' : 'text-blue-500'}`}>Cold</span>
            <span className={`text-sm font-bold ${temperatureFilter === 'Cold' ? 'text-white' : 'text-blue-500'}`}>{stats.cold}</span>
          </button>
        </div>

        {/* Active Filter Badge */}
        {hasActiveFilters && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Filtering:</span>
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                Status: {statusFilter === 'FollowUp' ? 'Follow Up' : statusFilter}
                <button onClick={() => setStatusFilter('all')} className="hover:bg-blue-200 rounded-full p-0.5 touch-manipulation">
                  <X size={13} />
                </button>
              </span>
            )}
            {temperatureFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                Temperature: {temperatureFilter}
                <button onClick={() => setTemperatureFilter('all')} className="hover:bg-purple-200 rounded-full p-0.5 touch-manipulation">
                  <X size={13} />
                </button>
              </span>
            )}
            {activeTab !== 'all' && (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                Priority: {activeTab}
                <button onClick={() => setActiveTab('all')} className="hover:bg-gray-200 rounded-full p-0.5 touch-manipulation">
                  <X size={13} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Search */}
        <div className="bg-gray-100 rounded-xl flex items-center px-3 py-2.5 mb-3">
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
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? myLeads.length : summary[tab.key] || 0;
            const isActive = activeTab === tab.key;
            const isUrgent = tab.key === 'overdue' && count > 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition touch-manipulation ${
                  isActive
                    ? isUrgent ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    : isUrgent ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.key === 'overdue' && <AlertCircle size={13} />}
                {tab.label}
                <span className={`text-[11px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
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
              {term ? 'Try a different search' : hasActiveFilters ? 'Try different filters' : 'No leads assigned yet'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="outline" size="sm" className="mt-3">
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(lead => {
              const followUpDate = lead.followUpDate || lead.follow_up_date;
              const followUpTime = lead.followUpTime || lead.follow_up_time;
              const isOverdue = lead._priority === 1;
              const isToday = lead._priority === 2;
              const lastActivity = lead.lastCallNote || lead.last_call_note || lead.notes;

              return (
                <div
                  key={lead.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                    isOverdue ? 'border-red-200' :
                    isToday  ? 'border-yellow-200' :
                    'border-gray-100'
                  }`}
                >
                  {/* Card body — tappable to open lead detail */}
                  <div
                    className="px-4 pt-4 pb-3 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/crm/lead/${lead.id}`)}
                  >
                    {/* Name row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TemperatureDot level={lead.interestLevel || lead.interest_level} />
                        <h3 className="font-bold text-gray-900 text-base truncate">{lead.name}</h3>
                      </div>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ml-2 ${getStatusColor(lead.status)}`}>
                        {lead._status === 'FollowUp' ? 'Follow Up' : lead._status}
                      </span>
                    </div>

                    {/* Overdue / Today badge */}
                    {(isOverdue || isToday) && (
                      <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md mb-2 ${
                        isOverdue ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <AlertCircle size={11} />
                        {isOverdue ? 'Overdue' : 'Due Today'}
                      </div>
                    )}

                    {/* Follow-up badge */}
                    {followUpDate && (
                      <div className="mb-2">
                        <FollowUpBadge followUpDate={followUpDate} followUpTime={followUpTime} size="small" />
                      </div>
                    )}

                    {/* Phone row */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-700 font-medium">{lead.phone}</span>
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 active:bg-gray-200 touch-manipulation"
                        aria-label="Call"
                      >
                        <Phone size={15} className="text-gray-500" />
                      </a>
                    </div>

                    {/* Last activity */}
                    {lastActivity && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 truncate">
                        <span className="shrink-0">↝</span>
                        <span className="truncate">Last Activity: {lastActivity}</span>
                      </p>
                    )}
                  </div>

                  {/* ── Action buttons — full-width, matching the reference image ── */}
                  <div
                    className="grid grid-cols-2 gap-2 px-4 pb-4"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Call Lead */}
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a5c3a] active:bg-[#143f28] text-white text-sm font-semibold touch-manipulation transition-colors"
                      aria-label={`Call ${lead.name}`}
                    >
                      <Phone size={16} />
                      Call Lead
                    </a>

                    {/* Quick Log */}
                    <button
                      onClick={() => setSelectedLeadForCallLog(lead)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a5c3a] active:bg-[#143f28] text-white text-sm font-semibold touch-manipulation transition-colors"
                      aria-label={`Log call for ${lead.name}`}
                    >
                      <ClipboardList size={16} />
                      Quick Log
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-4" />

      {/* Log Call Modal */}
      {selectedLeadForCallLog && (
        <LogCallModal
          lead={selectedLeadForCallLog}
          isOpen={true}
          onClose={() => setSelectedLeadForCallLog(null)}
          onSuccess={() => setSelectedLeadForCallLog(null)}
        />
      )}
    </div>
  );
};

export default MobileLeadList;
