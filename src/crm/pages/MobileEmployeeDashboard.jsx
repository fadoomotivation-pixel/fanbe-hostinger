
import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Users, Phone, MapPin, CheckCircle, ClipboardList, FileText,
  ArrowRight, Flame, Wind, Snowflake, AlertCircle, Clock,
  Calendar, TrendingUp, IndianRupee, Download, Target
} from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import FollowUpBadge from '@/crm/components/FollowUpBadge';
import { useToast } from '@/components/ui/use-toast';
import { calculatePriority } from '@/crm/hooks/useLeadPriority';
import { normalizeLeadStatus, normalizeInterestLevel, LEAD_STATUS } from '@/crm/utils/statusUtils';

const MobileEmployeeDashboard = () => {
  const { user } = useAuth();
  const { leads, workLogs } = useCRMData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const myLeads = useMemo(() =>
    leads.filter(l => l.assignedTo === user.id || l.assigned_to === user.id),
    [leads, user]
  );

  // Today's work logs
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = workLogs.filter(l => l.employeeId === user.id && l.date === today);
  const callsToday = todayLogs.reduce((acc, l) => acc + (l.totalCalls || 0), 0);
  const connectedToday = todayLogs.reduce((acc, l) => acc + (l.connectedCalls || 0), 0);
  const visitsToday = todayLogs.reduce((acc, l) => acc + (l.siteVisits || 0), 0);
  const bookingsToday = todayLogs.reduce((acc, l) => acc + (l.bookings || 0), 0);

  // Targets
  const targets = { calls: 50, visits: 2, bookings: 1 };

  // Lead breakdown
  const leadStats = useMemo(() => {
    const stats = {
      total: myLeads.length,
      open: 0, followUp: 0, booked: 0, lost: 0,
      hot: 0, warm: 0, cold: 0,
      overdue: 0, today: 0, tomorrow: 0, thisWeek: 0,
      totalTokens: 0, tokenCount: 0,
      totalBookings: 0, bookingCount: 0,
      thisMonthTokens: 0, thisMonthBookings: 0,
    };

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    myLeads.forEach(l => {
      // Status
      const s = normalizeLeadStatus(l.status);
      if (s === LEAD_STATUS.OPEN) stats.open++;
      else if (s === LEAD_STATUS.FOLLOW_UP) stats.followUp++;
      else if (s === LEAD_STATUS.BOOKED) stats.booked++;
      else if (s === LEAD_STATUS.LOST) stats.lost++;

      // Temperature
      const t = normalizeInterestLevel(l.interestLevel || l.interest_level);
      if (t === 'Hot') stats.hot++;
      else if (t === 'Warm') stats.warm++;
      else stats.cold++;

      // Follow-up priority
      const p = calculatePriority(l.followUpDate || l.follow_up_date);
      if (p === 1) stats.overdue++;
      else if (p === 2) stats.today++;
      else if (p === 3) stats.tomorrow++;
      else if (p === 4) stats.thisWeek++;

      // Revenue
      if (l.token_amount && l.token_amount > 0) {
        stats.totalTokens += parseFloat(l.token_amount);
        stats.tokenCount++;
        if (l.token_date && new Date(l.token_date) >= firstDayOfMonth) {
          stats.thisMonthTokens += parseFloat(l.token_amount);
        }
      }
      if (l.booking_amount && l.booking_amount > 0) {
        stats.totalBookings += parseFloat(l.booking_amount);
        stats.bookingCount++;
        if (l.booking_date && new Date(l.booking_date) >= firstDayOfMonth) {
          stats.thisMonthBookings += parseFloat(l.booking_amount);
        }
      }
    });

    stats.totalRevenue = stats.totalTokens + stats.totalBookings;
    return stats;
  }, [myLeads]);

  // Overdue + today leads for quick action
  const urgentLeads = useMemo(() => {
    return myLeads
      .map(l => ({
        ...l,
        _priority: calculatePriority(l.followUpDate || l.follow_up_date)
      }))
      .filter(l => l._priority <= 2) // overdue + today
      .sort((a, b) => a._priority - b._priority)
      .slice(0, 5);
  }, [myLeads]);

  const formatShort = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  // Export
  const handleExportData = () => {
    try {
      const keys = [
        'crm_work_logs', 'crm_calls', 'crm_site_visits', 'crm_bookings_granular',
        'crm_tasks', 'crm_eod_reports', 'workLogs', 'calls', 'siteVisits',
        'bookings', 'tasks', 'eodReports',
      ];
      const exportData = {
        exportedBy: user.name, employeeId: user.id, username: user.username,
        exportedAt: new Date().toISOString(), data: {}
      };
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              exportData.data[k] = parsed.filter(item =>
                !item.employeeId || item.employeeId === user.id ||
                !item.userId || item.userId === user.id
              );
            } else { exportData.data[k] = parsed; }
          } catch { exportData.data[k] = raw; }
        }
      });
      const totalRecords = Object.values(exportData.data).reduce((acc, val) =>
        acc + (Array.isArray(val) ? val.length : 1), 0
      );
      if (totalRecords === 0) {
        toast({ title: 'No Data', description: 'No local data to export.', variant: 'destructive' });
        return;
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_crm_data_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: `${totalRecords} records exported.`, duration: 4000 });
    } catch (err) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    }
  };

  const quickActions = [
    { label: "My Leads", icon: Users, path: "/crm/my-leads", color: "bg-blue-100 text-blue-600" },
    { label: "Log Call", icon: Phone, path: "/crm/sales/daily-calling", color: "bg-green-100 text-green-600" },
    { label: "Log Visit", icon: MapPin, path: "/crm/sales/site-visits", color: "bg-purple-100 text-purple-600" },
    { label: "Log Booking", icon: CheckCircle, path: "/crm/sales/bookings", color: "bg-yellow-100 text-yellow-600" },
    { label: "EOD Report", icon: ClipboardList, path: "/crm/sales/eod-reports", color: "bg-orange-100 text-orange-600" },
    { label: "Materials", icon: FileText, path: "/crm/sales/tools", color: "bg-gray-100 text-gray-600" },
  ];

  return (
    <div className="pb-24 pt-4 px-4 space-y-4 bg-gray-50 min-h-screen max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Hi, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-gray-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Download size={14} className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* ═══ MY TRACKER ═══ */}
      {/* Lead Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700">My Lead Tracker</h2>
          <span className="text-xs text-gray-400">{leadStats.total} total</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => navigate('/crm/my-leads')} className="text-center p-2 rounded-lg bg-blue-50 border border-blue-100 active:bg-blue-100">
            <p className="text-lg md:text-xl font-bold text-blue-700">{leadStats.open}</p>
            <p className="text-[10px] text-blue-600 font-medium">Open</p>
          </button>
          <button onClick={() => navigate('/crm/my-leads')} className="text-center p-2 rounded-lg bg-orange-50 border border-orange-100 active:bg-orange-100">
            <p className="text-lg md:text-xl font-bold text-orange-700">{leadStats.followUp}</p>
            <p className="text-[10px] text-orange-600 font-medium">Follow Up</p>
          </button>
          <button onClick={() => navigate('/crm/my-leads')} className="text-center p-2 rounded-lg bg-green-50 border border-green-100 active:bg-green-100">
            <p className="text-lg md:text-xl font-bold text-green-700">{leadStats.booked}</p>
            <p className="text-[10px] text-green-600 font-medium">Booked</p>
          </button>
          <button onClick={() => navigate('/crm/my-leads')} className="text-center p-2 rounded-lg bg-gray-50 border border-gray-200 active:bg-gray-100">
            <p className="text-lg md:text-xl font-bold text-gray-600">{leadStats.lost}</p>
            <p className="text-[10px] text-gray-500 font-medium">Lost</p>
          </button>
        </div>

        {/* Temperature Breakdown */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 flex-1 justify-center bg-red-50 rounded-lg py-1.5 border border-red-100">
            <Flame size={14} className="text-red-500" />
            <span className="text-sm font-bold text-red-600">{leadStats.hot}</span>
            <span className="text-[10px] text-red-500">Hot</span>
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-center bg-amber-50 rounded-lg py-1.5 border border-amber-100">
            <Wind size={14} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-600">{leadStats.warm}</span>
            <span className="text-[10px] text-amber-500">Warm</span>
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-center bg-sky-50 rounded-lg py-1.5 border border-sky-100">
            <Snowflake size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-blue-500">{leadStats.cold}</span>
            <span className="text-[10px] text-blue-400">Cold</span>
          </div>
        </div>

        {/* Conversion indicator */}
        {leadStats.total > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Conversion (Booked / Total)</span>
              <span className="font-bold text-green-600">
                {leadStats.total > 0 ? Math.round((leadStats.booked / leadStats.total) * 100) : 0}%
              </span>
            </div>
            <Progress value={leadStats.total > 0 ? (leadStats.booked / leadStats.total) * 100 : 0} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Two column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Follow-up Tracker */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Follow-up Tracker</h2>
            {(leadStats.overdue + leadStats.today) > 0 && (
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                {leadStats.overdue + leadStats.today} urgent
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 rounded-lg border ${leadStats.overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <AlertCircle size={16} className={leadStats.overdue > 0 ? 'text-red-600' : 'text-gray-400'} />
                <span className={`text-xl font-bold ${leadStats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{leadStats.overdue}</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">Overdue</p>
            </div>
            <div className={`p-3 rounded-lg border ${leadStats.today > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <Clock size={16} className={leadStats.today > 0 ? 'text-yellow-600' : 'text-gray-400'} />
                <span className={`text-xl font-bold ${leadStats.today > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{leadStats.today}</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">Today</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-xl font-bold text-blue-600">{leadStats.tomorrow}</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">Tomorrow</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <div className="flex items-center justify-between mb-1">
                <Calendar size={16} className="text-indigo-600" />
                <span className="text-xl font-bold text-indigo-600">{leadStats.thisWeek}</span>
              </div>
              <p className="text-[10px] font-medium text-gray-600">This Week</p>
            </div>
          </div>
        </div>

        {/* Daily Targets */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Today's Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Calls ({callsToday}/{targets.calls}){connectedToday > 0 ? ` · ${connectedToday} connected` : ''}</span>
                <span className="font-bold text-blue-600">{Math.min(Math.round((callsToday / targets.calls) * 100), 100)}%</span>
              </div>
              <Progress value={Math.min((callsToday / targets.calls) * 100, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Site Visits ({visitsToday}/{targets.visits})</span>
                <span className="font-bold text-purple-600">{Math.min(Math.round((visitsToday / targets.visits) * 100), 100)}%</span>
              </div>
              <Progress value={Math.min((visitsToday / targets.visits) * 100, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Bookings ({bookingsToday}/{targets.bookings})</span>
                <span className="font-bold text-green-600">{Math.min(Math.round((bookingsToday / targets.bookings) * 100), 100)}%</span>
              </div>
              <Progress value={Math.min((bookingsToday / targets.bookings) * 100, 100)} className="h-2" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{callsToday}</p>
              <p className="text-[10px] text-gray-500">Calls</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{visitsToday}</p>
              <p className="text-[10px] text-gray-500">Visits</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{bookingsToday}</p>
              <p className="text-[10px] text-gray-500">Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Tracker */}
      {(leadStats.totalRevenue > 0 || leadStats.tokenCount > 0 || leadStats.bookingCount > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3">My Revenue</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-center">
              <TrendingUp size={18} className="text-blue-600 mx-auto mb-1" />
              <p className="text-sm md:text-base font-bold text-blue-900">{formatShort(leadStats.totalRevenue)}</p>
              <p className="text-[10px] text-blue-600">Total Revenue</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-center">
              <IndianRupee size={18} className="text-amber-600 mx-auto mb-1" />
              <p className="text-sm md:text-base font-bold text-amber-800">{formatShort(leadStats.totalTokens)}</p>
              <p className="text-[10px] text-amber-600">{leadStats.tokenCount} Tokens</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-center">
              <Target size={18} className="text-green-600 mx-auto mb-1" />
              <p className="text-sm md:text-base font-bold text-green-800">{formatShort(leadStats.totalBookings)}</p>
              <p className="text-[10px] text-green-600">{leadStats.bookingCount} Bookings</p>
            </div>
          </div>
          {(leadStats.thisMonthTokens > 0 || leadStats.thisMonthBookings > 0) && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>This Month</span>
              <div className="flex gap-3">
                <span>Tokens: <strong className="text-amber-700">{formatShort(leadStats.thisMonthTokens)}</strong></span>
                <span>Bookings: <strong className="text-green-700">{formatShort(leadStats.thisMonthBookings)}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform hover:shadow-md"
            >
              <div className={`p-2 rounded-full mb-2 ${action.color}`}>
                <action.icon size={20} />
              </div>
              <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Urgent Follow-ups */}
      {urgentLeads.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-gray-700">Urgent Follow-ups</h2>
            <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 text-xs" onClick={() => navigate('/crm/my-leads')}>
              View All <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {urgentLeads.map(lead => {
              const followUpDate = lead.followUpDate || lead.follow_up_date;
              const followUpTime = lead.followUpTime || lead.follow_up_time;
              const isOverdue = lead._priority === 1;
              return (
                <div
                  key={lead.id}
                  className={`bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between cursor-pointer active:bg-gray-50 ${
                    isOverdue ? 'border-l-4 border-l-red-500 border-red-200' : 'border-l-4 border-l-yellow-500 border-yellow-200'
                  }`}
                  onClick={() => navigate(`/crm/lead/${lead.id}`)}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {lead.project && <p className="text-[10px] text-gray-400 truncate">{lead.project}</p>}
                      {followUpDate && <FollowUpBadge followUpDate={followUpDate} followUpTime={followUpTime} size="small" />}
                    </div>
                  </div>
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <a href={`tel:${lead.phone}`} className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 border border-green-200">
                      <Phone size={14} className="text-green-600" />
                    </a>
                    <WhatsAppButton
                      leadName={lead.name}
                      phoneNumber={lead.phone}
                      size="sm"
                      className="h-8 px-2 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileEmployeeDashboard;
