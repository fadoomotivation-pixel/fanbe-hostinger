import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  Users, Phone, MapPin, CheckCircle, ClipboardList, FileText,
  ArrowRight, Flame, Wind, Snowflake, AlertCircle, Clock,
  Calendar, TrendingUp, IndianRupee, Download, Target,
  PhoneOff, PhoneMissed, PhoneIncoming, X, LogOut,
  Settings, User, Home, BarChart2, BookOpen,
} from 'lucide-react';
import WhatsAppButton from '@/crm/components/WhatsAppButton';
import FollowUpBadge from '@/crm/components/FollowUpBadge';
import { useToast } from '@/components/ui/use-toast';
import { calculatePriority } from '@/crm/hooks/useLeadPriority';
import { normalizeLeadStatus, normalizeInterestLevel, LEAD_STATUS } from '@/crm/utils/statusUtils';
import { differenceInHours, parseISO } from 'date-fns';

/* ─── Bottom Nav items ─── */
const NAV_ITEMS = [
  { label: 'Home',    icon: Home,       path: '/crm/dashboard' },
  { label: 'Leads',   icon: Users,      path: '/crm/my-leads' },
  { label: 'Log',     icon: Phone,      path: '/crm/sales/daily-calling' },
  { label: 'Reports', icon: BarChart2,  path: '/crm/sales/eod-reports' },
  { label: 'More',    icon: BookOpen,   path: '/crm/sales/tools' },
];

const MobileEmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const { leads, workLogs, calls } = useCRMData();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  const myLeads = useMemo(() =>
    leads.filter(l => l.assignedTo === user.id || l.assigned_to === user.id),
    [leads, user]
  );

  const myCalls = useMemo(() =>
    calls?.filter(c => c.employeeId === user.id || c.employee_id === user.id) || [],
    [calls, user]
  );

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = workLogs.filter(l => l.employeeId === user.id && l.date === today);
  const callsToday    = todayLogs.reduce((a, l) => a + (l.totalCalls || 0), 0);
  const connectedToday = todayLogs.reduce((a, l) => a + (l.connectedCalls || 0), 0);
  const visitsToday   = todayLogs.reduce((a, l) => a + (l.siteVisits || 0), 0);
  const bookingsToday = todayLogs.reduce((a, l) => a + (l.bookings || 0), 0);
  const targets = { calls: 50, visits: 2, bookings: 1 };

  const leadStats = useMemo(() => {
    const stats = {
      total: myLeads.length,
      open: 0, followUp: 0, booked: 0, lost: 0,
      hot: 0, warm: 0, cold: 0,
      overdue: 0, today: 0, tomorrow: 0, thisWeek: 0,
      totalTokens: 0, tokenCount: 0,
      totalBookings: 0, bookingCount: 0,
      thisMonthTokens: 0, thisMonthBookings: 0,
      neverCalled: 0, unanswered: 0, needsRetry: 0,
    };
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    myLeads.forEach(l => {
      const s = normalizeLeadStatus(l.status);
      if (s === LEAD_STATUS.OPEN)      stats.open++;
      else if (s === LEAD_STATUS.FOLLOW_UP) stats.followUp++;
      else if (s === LEAD_STATUS.BOOKED)    stats.booked++;
      else if (s === LEAD_STATUS.LOST)      stats.lost++;

      const t = normalizeInterestLevel(l.interestLevel || l.interest_level);
      if (t === 'Hot')  stats.hot++;
      else if (t === 'Warm') stats.warm++;
      else stats.cold++;

      const p = calculatePriority(l.followUpDate || l.follow_up_date);
      if (p === 1) stats.overdue++;
      else if (p === 2) stats.today++;
      else if (p === 3) stats.tomorrow++;
      else if (p === 4) stats.thisWeek++;

      const leadCalls = myCalls.filter(c => c.leadId === l.id || c.lead_id === l.id);
      const lastCall  = leadCalls.sort((a, b) =>
        new Date(b.callTime || b.call_time) - new Date(a.callTime || a.call_time)
      )[0];

      if (leadCalls.length === 0) {
        stats.neverCalled++;
      } else if (lastCall) {
        const isConnected = lastCall.status === 'connected' || lastCall.status === 'answered';
        const hours = differenceInHours(now, parseISO(lastCall.callTime || lastCall.call_time));
        if (!isConnected) {
          stats.unanswered++;
          if (hours >= 2) stats.needsRetry++;
        }
      }

      if (l.token_amount && l.token_amount > 0) {
        stats.totalTokens += parseFloat(l.token_amount);
        stats.tokenCount++;
        if (l.token_date && new Date(l.token_date) >= firstDayOfMonth)
          stats.thisMonthTokens += parseFloat(l.token_amount);
      }
      if (l.booking_amount && l.booking_amount > 0) {
        stats.totalBookings += parseFloat(l.booking_amount);
        stats.bookingCount++;
        if (l.booking_date && new Date(l.booking_date) >= firstDayOfMonth)
          stats.thisMonthBookings += parseFloat(l.booking_amount);
      }
    });

    stats.totalRevenue = stats.totalTokens + stats.totalBookings;
    return stats;
  }, [myLeads, myCalls]);

  const priorityLeads = useMemo(() => {
    const now = new Date();
    return myLeads
      .map(l => {
        const leadCalls = myCalls.filter(c => c.leadId === l.id || c.lead_id === l.id);
        const lastCall  = leadCalls.sort((a, b) =>
          new Date(b.callTime || b.call_time) - new Date(a.callTime || a.call_time)
        )[0];
        let callStatus = 'never_called', callPriority = 100, hoursSinceCall = 0;
        if (leadCalls.length > 0 && lastCall) {
          hoursSinceCall = differenceInHours(now, parseISO(lastCall.callTime || lastCall.call_time));
          const isConnected = lastCall.status === 'connected' || lastCall.status === 'answered';
          if (!isConnected) {
            callStatus   = hoursSinceCall >= 2 ? 'needs_retry' : 'recently_unanswered';
            callPriority = hoursSinceCall >= 2 ? 80 : 40;
          } else {
            callStatus   = 'connected';
            callPriority = 20;
          }
        }
        const followUpPriority = calculatePriority(l.followUpDate || l.follow_up_date);
        const tempScore = normalizeInterestLevel(l.interestLevel || l.interest_level) === 'Hot' ? 30
          : normalizeInterestLevel(l.interestLevel || l.interest_level) === 'Warm' ? 20 : 10;
        return {
          ...l,
          _callStatus: callStatus, _callPriority: callPriority,
          _followUpPriority: followUpPriority, _hoursSinceCall: hoursSinceCall,
          _totalScore: callPriority + (followUpPriority <= 2 ? 50 : 0) + tempScore,
          _lastCall: lastCall,
        };
      })
      .sort((a, b) => b._totalScore - a._totalScore)
      .slice(0, 10);
  }, [myLeads, myCalls]);

  const formatShort = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)     return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const handleExportData = () => {
    try {
      const keys = [
        'crm_work_logs','crm_calls','crm_site_visits','crm_bookings_granular',
        'crm_tasks','crm_eod_reports','workLogs','calls','siteVisits',
        'bookings','tasks','eodReports',
      ];
      const exportData = {
        exportedBy: user.name, employeeId: user.id, username: user.username,
        exportedAt: new Date().toISOString(), data: {},
      };
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            exportData.data[k] = Array.isArray(parsed)
              ? parsed.filter(item => !item.employeeId || item.employeeId === user.id || !item.userId || item.userId === user.id)
              : parsed;
          } catch { exportData.data[k] = raw; }
        }
      });
      const totalRecords = Object.values(exportData.data).reduce((acc, val) =>
        acc + (Array.isArray(val) ? val.length : 1), 0);
      if (totalRecords === 0) {
        toast({ title: 'No Data', description: 'No local data to export.', variant: 'destructive' });
        return;
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${user.username}_crm_data_${today}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: `${totalRecords} records exported.`, duration: 4000 });
    } catch (err) {
      toast({ title: 'Export Failed', description: err.message, variant: 'destructive' });
    }
  };

  const getCallStatusBadge = (status, hoursSince) => {
    switch (status) {
      case 'never_called':
        return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Never Called 📵</span>;
      case 'needs_retry':
        return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Retry Now ⏰ ({Math.floor(hoursSince)}h)</span>;
      case 'recently_unanswered':
        return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Not Answered 📞</span>;
      default:
        return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Connected ✓</span>;
    }
  };

  const userInitial = (user.name || 'U').charAt(0).toUpperCase();

  /* ───────────────────────────── RENDER ───────────────────────────── */
  return (
    <div className="bg-gray-50 min-h-screen max-w-lg mx-auto relative">

      {/* ── PROFILE DRAWER (slide-down overlay) ── */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setProfileOpen(false)}
          />
          {/* Sheet */}
          <div className="bg-white rounded-t-2xl shadow-2xl px-5 pt-5 pb-10 animate-slide-up">
            {/* Close */}
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 active:bg-gray-200"
            >
              <X size={18} className="text-gray-600" />
            </button>

            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
                {userInitial}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.username || user.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                  {user.role || 'Sales Executive'}
                </span>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 mb-5 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{leadStats.total}</p>
                <p className="text-[10px] text-gray-500">My Leads</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-lg font-bold text-green-600">{leadStats.booked}</p>
                <p className="text-[10px] text-gray-500">Booked</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-500">{leadStats.overdue + leadStats.today}</p>
                <p className="text-[10px] text-gray-500">Due Today</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => { navigate('/crm/profile'); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition"
              >
                <User size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Edit Profile</span>
              </button>
              <button
                onClick={() => { navigate('/crm/settings'); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition"
              >
                <Settings size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Settings</span>
              </button>
              <button
                onClick={() => { handleExportData(); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 active:bg-blue-100 transition"
              >
                <Download size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Export My Data</span>
              </button>
              <button
                onClick={() => { logout?.(); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 active:bg-red-100 transition"
              >
                <LogOut size={18} className="text-red-500" />
                <span className="text-sm font-medium text-red-600">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY TOP HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        {/* Left: avatar button */}
        <button
          onClick={() => setProfileOpen(true)}
          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow active:opacity-80 transition flex-shrink-0"
          aria-label="Open profile"
        >
          {userInitial}
        </button>

        {/* Centre: greeting */}
        <div className="text-center flex-1 px-3">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            Hi, {user.name.split(' ')[0]}! 👋
          </p>
          <p className="text-[10px] text-gray-400 leading-tight">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>

        {/* Right: placeholder for future notification icon */}
        <div className="w-10" />
      </header>

      {/* ── MAIN SCROLL AREA ── */}
      <main className="px-4 pt-4 pb-28 space-y-4">

        {/* 📞 Call Priority Alert */}
        {(leadStats.neverCalled > 0 || leadStats.needsRetry > 0) && (
          <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                <Phone className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-900 text-sm mb-1">⚠️ Priority Calls Pending!</p>
                {leadStats.neverCalled > 0 && (
                  <p className="text-xs text-red-700 mb-0.5">
                    🔴 <strong>{leadStats.neverCalled} leads never called</strong>
                  </p>
                )}
                {leadStats.needsRetry > 0 && (
                  <p className="text-xs text-orange-700">
                    🟠 <strong>{leadStats.needsRetry} need retry</strong> (2 h+ since last attempt)
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate('/crm/my-leads')}
                className="flex-shrink-0 self-center bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl active:bg-red-700 transition"
              >
                Call Now
              </button>
            </div>
          </div>
        )}

        {/* Lead Status Tracker */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">My Lead Tracker</h2>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{leadStats.total} total</span>
          </div>

          {/* Status grid – 4 equal tiles */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Open',      value: leadStats.open,     bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700' },
              { label: 'Follow Up', value: leadStats.followUp, bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
              { label: 'Booked',    value: leadStats.booked,   bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700' },
              { label: 'Lost',      value: leadStats.lost,     bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600' },
            ].map(({ label, value, bg, border, text }) => (
              <button
                key={label}
                onClick={() => navigate('/crm/my-leads')}
                className={`py-3 rounded-xl border ${bg} ${border} active:opacity-70 transition text-center`}
              >
                <p className={`text-xl font-bold ${text}`}>{value}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</p>
              </button>
            ))}
          </div>

          {/* Temperature strip */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            {[
              { icon: <Flame size={14} className="text-red-500" />,    value: leadStats.hot,  label: 'Hot',  bg: 'bg-red-50 border-red-100',    text: 'text-red-600' },
              { icon: <Wind size={14} className="text-amber-500" />,   value: leadStats.warm, label: 'Warm', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
              { icon: <Snowflake size={14} className="text-blue-400" />, value: leadStats.cold, label: 'Cold', bg: 'bg-sky-50 border-sky-100',    text: 'text-blue-500' },
            ].map(({ icon, value, label, bg, text }) => (
              <div key={label} className={`flex items-center gap-1.5 flex-1 justify-center rounded-xl py-2 border ${bg}`}>
                {icon}
                <span className={`text-sm font-bold ${text}`}>{value}</span>
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Conversion bar */}
          {leadStats.total > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Conversion rate</span>
                <span className="font-bold text-green-600">
                  {Math.round((leadStats.booked / leadStats.total) * 100)}%
                </span>
              </div>
              <Progress value={(leadStats.booked / leadStats.total) * 100} className="h-1.5" />
            </div>
          )}
        </section>

        {/* Follow-up Tracker */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">Follow-up Tracker</h2>
            {(leadStats.overdue + leadStats.today) > 0 && (
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse font-medium">
                {leadStats.overdue + leadStats.today} urgent
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <AlertCircle size={16} />, value: leadStats.overdue,  label: 'Overdue',    active: leadStats.overdue > 0,  bg: 'bg-red-50 border-red-200',    text: 'text-red-600',    ico: 'text-red-600' },
              { icon: <Clock size={16} />,       value: leadStats.today,    label: 'Today',      active: leadStats.today > 0,    bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-600', ico: 'text-yellow-600' },
              { icon: <Calendar size={16} />,    value: leadStats.tomorrow, label: 'Tomorrow',   active: true,                   bg: 'bg-blue-50 border-blue-100',   text: 'text-blue-600',   ico: 'text-blue-600' },
              { icon: <Calendar size={16} />,    value: leadStats.thisWeek, label: 'This Week',  active: true,                   bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600', ico: 'text-indigo-600' },
            ].map(({ icon, value, label, bg, text, ico }) => (
              <button
                key={label}
                onClick={() => navigate('/crm/my-leads')}
                className={`flex items-center justify-between p-4 rounded-xl border ${bg} active:opacity-70 transition`}
              >
                <div className="flex items-center gap-2">
                  <span className={ico}>{icon}</span>
                  <span className="text-xs text-gray-600 font-medium">{label}</span>
                </div>
                <span className={`text-xl font-bold ${text}`}>{value}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Today's Progress */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Today's Progress</h2>
          <div className="space-y-4">
            {[
              {
                label: `Calls${connectedToday > 0 ? ` · ${connectedToday} connected` : ''}`,
                done: callsToday, target: targets.calls, color: 'text-blue-600',
                pct: Math.min((callsToday / targets.calls) * 100, 100),
              },
              {
                label: 'Site Visits',
                done: visitsToday, target: targets.visits, color: 'text-purple-600',
                pct: Math.min((visitsToday / targets.visits) * 100, 100),
              },
              {
                label: 'Bookings',
                done: bookingsToday, target: targets.bookings, color: 'text-green-600',
                pct: Math.min((bookingsToday / targets.bookings) * 100, 100),
              },
            ].map(({ label, done, target, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">{label} ({done}/{target})</span>
                  <span className={`font-bold ${color}`}>{Math.round(pct)}%</span>
                </div>
                <Progress value={pct} className="h-2.5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Totals summary row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 text-center">
            <div>
              <p className="text-xl font-bold text-blue-600">{callsToday}</p>
              <p className="text-[10px] text-gray-500">Calls</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">{visitsToday}</p>
              <p className="text-[10px] text-gray-500">Visits</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{bookingsToday}</p>
              <p className="text-[10px] text-gray-500">Bookings</p>
            </div>
          </div>
        </section>

        {/* Revenue Tracker */}
        {(leadStats.totalRevenue > 0 || leadStats.tokenCount > 0 || leadStats.bookingCount > 0) && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-bold text-gray-800 mb-3">My Revenue</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
                <TrendingUp size={18} className="text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-blue-900">{formatShort(leadStats.totalRevenue)}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">Total</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                <IndianRupee size={18} className="text-amber-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-amber-800">{formatShort(leadStats.totalTokens)}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">{leadStats.tokenCount} Tokens</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
                <Target size={18} className="text-green-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-green-800">{formatShort(leadStats.totalBookings)}</p>
                <p className="text-[10px] text-green-600 mt-0.5">{leadStats.bookingCount} Booked</p>
              </div>
            </div>
            {(leadStats.thisMonthTokens > 0 || leadStats.thisMonthBookings > 0) && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <span>This month</span>
                <div className="flex gap-3">
                  <span>Tokens: <strong className="text-amber-700">{formatShort(leadStats.thisMonthTokens)}</strong></span>
                  <span>Booked: <strong className="text-green-700">{formatShort(leadStats.thisMonthBookings)}</strong></span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Quick Actions – 2×3 grid, bigger touch targets */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'My Leads',    icon: Users,         path: '/crm/my-leads',                color: 'bg-blue-100 text-blue-600' },
              { label: 'Log Call',    icon: Phone,         path: '/crm/sales/daily-calling',      color: 'bg-green-100 text-green-600' },
              { label: 'Log Visit',   icon: MapPin,        path: '/crm/sales/site-visits',        color: 'bg-purple-100 text-purple-600' },
              { label: 'Log Booking', icon: CheckCircle,   path: '/crm/sales/bookings',           color: 'bg-yellow-100 text-yellow-600' },
              { label: 'EOD Report',  icon: ClipboardList, path: '/crm/sales/eod-reports',        color: 'bg-orange-100 text-orange-600' },
              { label: 'Materials',   icon: FileText,      path: '/crm/sales/tools',              color: 'bg-gray-100 text-gray-600' },
            ].map(({ label, icon: Icon, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center bg-white py-4 px-2 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform hover:shadow-md min-h-[80px]"
              >
                <div className={`p-2.5 rounded-full mb-2 ${color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 🎯 Top Priority Leads */}
        {priorityLeads.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-800">🎯 Priority Leads</h2>
              <button
                onClick={() => navigate('/crm/my-leads')}
                className="flex items-center gap-1 text-xs text-blue-600 font-medium active:opacity-70"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2.5">
              {priorityLeads.map((lead, idx) => {
                const followUpDate = lead.followUpDate || lead.follow_up_date;
                const followUpTime = lead.followUpTime || lead.follow_up_time;
                const isUrgent     = lead._followUpPriority <= 2;
                const leftBorder   =
                  lead._callStatus === 'never_called'          ? 'border-l-4 border-l-red-500 border-red-200'
                  : lead._callStatus === 'needs_retry'         ? 'border-l-4 border-l-orange-500 border-orange-200'
                  : isUrgent                                   ? 'border-l-4 border-l-yellow-500 border-yellow-200'
                  : 'border-gray-200';

                return (
                  <div
                    key={lead.id}
                    className={`bg-white rounded-2xl shadow-sm border p-4 cursor-pointer active:bg-gray-50 transition ${leftBorder}`}
                    onClick={() => navigate(`/crm/lead/${lead.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank badge */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white">{idx + 1}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {lead.project && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[100px]">{lead.project}</p>
                          )}
                          {getCallStatusBadge(lead._callStatus, lead._hoursSinceCall)}
                          {followUpDate && (
                            <FollowUpBadge followUpDate={followUpDate} followUpTime={followUpTime} size="small" />
                          )}
                        </div>
                      </div>

                      {/* Action buttons – large tap targets */}
                      <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 border border-green-200 hover:bg-green-100 active:scale-95 transition"
                          aria-label={`Call ${lead.name}`}
                        >
                          <Phone size={16} className="text-green-600" />
                        </a>
                        <WhatsAppButton
                          leadName={lead.name}
                          phoneNumber={lead.phone}
                          size="sm"
                          className="h-10 w-10 rounded-full flex items-center justify-center p-0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg flex items-center">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive = activeNav === label;
          return (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                navigate(path);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-3 gap-0.5 transition active:opacity-60 ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileEmployeeDashboard;
