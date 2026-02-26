// src/crm/pages/SubAdminDashboard.jsx
// ✅ Fanbe Admin: business ops dashboard — fully mobile-first
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, TrendingUp, Phone, Activity, ArrowUpRight,
  Award, AlertCircle, UserCheck, CalendarCheck, FileText,
  IndianRupee, ClipboardList, Layers, PhoneCall, PieChart as PieIcon,
  ChevronRight, BarChart2, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ── Quick Action Tile ─────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, sub, path, color }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm
        hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
        transition-all text-left w-full touch-manipulation"
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm leading-tight">{label}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </button>
  );
};

// ✅ Fanbe Admin quick actions — HR write pages removed (only HR overview allowed)
const QUICK_ACTIONS = [
  { icon: Users,         label: 'Leads',           sub: 'All leads, filters, assign',   path: '/crm/admin/leads',             color: 'bg-blue-500' },
  { icon: UserCheck,     label: 'Staff',           sub: 'Add, edit, view staff',         path: '/crm/admin/staff-management',  color: 'bg-purple-500' },
  { icon: TrendingUp,    label: 'Performance',     sub: 'Targets, conversions',          path: '/crm/admin/staff-performance', color: 'bg-indigo-500' },
  { icon: FileText,      label: 'Daily Reports',   sub: 'EOD summaries, work logs',      path: '/crm/admin/daily-reports',     color: 'bg-orange-500' },
  { icon: PieIcon,       label: 'Revenue',         sub: 'Bookings, revenue trend',       path: '/crm/admin/revenue-analytics', color: 'bg-green-500' },
  { icon: PhoneCall,     label: 'Call Logs',       sub: 'Call logs, connect rate',       path: '/crm/admin/call-analytics',    color: 'bg-pink-500' },
  { icon: CalendarCheck, label: 'Bookings',        sub: 'All bookings summary',          path: '/crm/admin/booking-analytics', color: 'bg-teal-500' },
  { icon: Layers,        label: 'Projects',        sub: 'Units, pricing, availability',  path: '/crm/admin/projects',          color: 'bg-yellow-600' },
  // HR Overview — read-only link
  { icon: BarChart2,     label: 'HR Overview',     sub: 'View HR summary (read-only)',   path: '/crm/admin/hr/dashboard',      color: 'bg-cyan-600' },
];

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

const SubAdminDashboard = () => {
  const { user }                                                 = useAuth();
  const { leads, employees, workLogs, siteVisits, bookings }     = useCRMData();
  const [dateRange, setDateRange]                                = useState('month');

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalLeads     = leads.length;
  const openLeads      = leads.filter(l => l.status === 'Open').length;
  const followUpLeads  = leads.filter(l => l.status === 'FollowUp').length;
  const bookedLeads    = leads.filter(l => l.status === 'Booked').length;
  const lostLeads      = leads.filter(l => l.status === 'Lost').length;
  const activeLeads    = openLeads + followUpLeads;

  const totalCalls     = workLogs.reduce((a, l) => a + (l.totalCalls     || 0), 0);
  const connectedCalls = workLogs.reduce((a, l) => a + (l.connectedCalls || 0), 0);
  const siteVisitsCnt  = siteVisits.length;
  const totalBookings  = bookings.length;
  const convRate       = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
  const activeStaff    = employees.filter(e =>
    ['sales_executive', 'employee', 'telecaller'].includes(e.role) && e.status === 'Active'
  ).length;

  // ── Chart data ──────────────────────────────────────────────────────────
  const funnelData = [
    { name: 'Total',      value: totalLeads,   fill: '#3b82f6' },
    { name: 'Active',     value: activeLeads,  fill: '#8b5cf6' },
    { name: 'Site Visit', value: siteVisitsCnt,fill: '#ec4899' },
    { name: 'Booked',     value: bookedLeads,  fill: '#10b981' },
  ];

  const sourceCounts = leads.reduce((acc, l) => {
    const s = l.source || 'Direct'; acc[s] = (acc[s] || 0) + 1; return acc;
  }, {});
  const sourceChartData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const pieData = [
    { name: 'Open',       value: openLeads },
    { name: 'Follow-up',  value: followUpLeads },
    { name: 'Booked',     value: bookedLeads },
    { name: 'Lost',       value: lostLeads },
  ].filter(d => d.value > 0);

  const salesStaff = employees
    .filter(e => ['sales_executive', 'employee', 'telecaller'].includes(e.role))
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F]">
            👋 Welcome, {user?.name?.split(' ')[0] || 'Executive'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Fanbe Admin Console — full overview</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px] text-xs h-9">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
          <CardContent className="p-4">
            <p className="text-blue-100 text-[10px] font-semibold uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-1 leading-none">{totalLeads}</h3>
            <p className="text-blue-200 text-[10px] mt-1.5">{bookedLeads} booked · {lostLeads} lost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-none shadow-lg">
          <CardContent className="p-4">
            <p className="text-purple-100 text-[10px] font-semibold uppercase tracking-wider">Pipeline</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-1 leading-none">{activeLeads}</h3>
            <p className="text-purple-200 text-[10px] mt-1.5">{followUpLeads} follow-ups</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-gray-400 text-[10px] uppercase font-semibold">Active Staff</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-1 leading-none text-gray-800">{activeStaff}</h3>
            <p className="text-[10px] text-green-600 mt-1.5">Visits: {siteVisitsCnt}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-orange-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-gray-400 text-[10px] uppercase font-semibold">Bookings</p>
            <h3 className="text-2xl sm:text-3xl font-bold mt-1 leading-none text-gray-800">{totalBookings}</h3>
            <p className="text-[10px] text-orange-600 mt-1.5">Conv: {convRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(qa => (
            <QuickAction key={qa.path} {...qa} />
          ))}
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Funnel */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Sales Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnelData} margin={{ top:4, right:16, left:0, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Lead Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No lead data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Lead Sources ────────────────────────────────────────────── */}
      {sourceChartData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Top Lead Sources</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChartData} margin={{ top:4, right:16, left:-10, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Staff Activity ──────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Staff Activity ({salesStaff.length})</CardTitle>
          <Button
            variant="outline" size="sm"
            className="text-xs h-8"
            onClick={() => window.location.href = '/crm/admin/staff-management'}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile cards view */}
          <div className="block sm:hidden divide-y">
            {salesStaff.length > 0 ? salesStaff.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-[#0F3A5F] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(emp.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
                  <p className="text-xs text-gray-400 truncate capitalize">{emp.role?.replace('_', ' ')}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 ${
                  emp.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>{emp.status || 'Active'}</span>
              </div>
            )) : (
              <p className="text-center text-gray-400 text-sm py-6">No staff found.</p>
            )}
          </div>
          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Staff Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesStaff.length > 0 ? salesStaff.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(emp.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-blue-600 capitalize">{emp.role?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>{emp.status || 'Active'}</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">No staff found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminDashboard;
