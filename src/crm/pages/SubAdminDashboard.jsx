// src/crm/pages/SubAdminDashboard.jsx
// ✅ Sub-admin sees a full business-operations dashboard
// Quick-action cards link directly to key CRM sections
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
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Quick-action tile definition
const QuickAction = ({ icon: Icon, label, sub, path, color }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm
        hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full`}
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-400 truncate">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </button>
  );
};

const QUICK_ACTIONS = [
  { icon: Users,         label: 'Leads Management',   sub: 'All leads, filters, assign',         path: '/crm/admin/leads',             color: 'bg-blue-500' },
  { icon: UserCheck,     label: 'Staff Management',   sub: 'Add, edit, view staff',              path: '/crm/admin/staff-management',  color: 'bg-purple-500' },
  { icon: TrendingUp,    label: 'Staff Performance',  sub: 'Targets, conversions',               path: '/crm/admin/staff-performance', color: 'bg-indigo-500' },
  { icon: FileText,      label: 'Daily Reports',      sub: 'EOD summaries, work logs',           path: '/crm/admin/daily-reports',     color: 'bg-orange-500' },
  { icon: PieIcon,       label: 'Revenue Analytics',  sub: 'Bookings, revenue trend',            path: '/crm/admin/revenue-analytics', color: 'bg-green-500' },
  { icon: PhoneCall,     label: 'Call Analytics',     sub: 'Call logs, connect rate',            path: '/crm/admin/call-analytics',    color: 'bg-pink-500' },
  { icon: CalendarCheck, label: 'Booking Analytics',  sub: 'All bookings summary',               path: '/crm/admin/booking-analytics', color: 'bg-teal-500' },
  { icon: Layers,        label: 'Projects/Inventory', sub: 'Units, pricing, availability',       path: '/crm/admin/projects',          color: 'bg-yellow-600' },
  { icon: ClipboardList, label: 'HR Attendance',      sub: 'Mark & view attendance',             path: '/crm/admin/hr/attendance',     color: 'bg-cyan-600' },
  { icon: IndianRupee,   label: 'Payroll',            sub: 'Salary, deductions',                 path: '/crm/admin/hr/payroll',        color: 'bg-emerald-600' },
];

const SubAdminDashboard = () => {
  const { user }                           = useAuth();
  const { leads, employees, workLogs, siteVisits, bookings } = useCRMData();
  const [dateRange, setDateRange]          = useState('month');

  // ── KPI calculations ────────────────────────────────────────
  const totalLeads      = leads.length;
  const openLeads       = leads.filter(l => l.status === 'Open').length;
  const followUpLeads   = leads.filter(l => l.status === 'FollowUp').length;
  const bookedLeads     = leads.filter(l => l.status === 'Booked').length;
  const lostLeads       = leads.filter(l => l.status === 'Lost').length;
  const activeLeads     = openLeads + followUpLeads;

  const totalCalls      = workLogs.reduce((a, l) => a + (l.totalCalls     || 0), 0);
  const connectedCalls  = workLogs.reduce((a, l) => a + (l.connectedCalls || 0), 0);
  const siteVisitsCount = siteVisits.length;
  const totalBookings   = bookings.length;
  const conversionRate  = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

  const activeStaff     = employees.filter(e =>
    ['sales_executive', 'employee', 'telecaller'].includes(e.role) && e.status === 'Active'
  ).length;

  // ── Chart data ──────────────────────────────────────────────
  const funnelData = [
    { name: 'Total Leads',  value: totalLeads,      fill: '#3b82f6' },
    { name: 'Active',       value: activeLeads,     fill: '#8b5cf6' },
    { name: 'Site Visits',  value: siteVisitsCount, fill: '#ec4899' },
    { name: 'Booked',       value: bookedLeads,     fill: '#10b981' },
  ];

  const sourceCounts = leads.reduce((acc, l) => {
    const src = l.source || 'Direct';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sourceChartData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const pieData = [
    { name: 'Open',      value: openLeads },
    { name: 'Follow-up', value: followUpLeads },
    { name: 'Booked',    value: bookedLeads },
    { name: 'Lost',      value: lostLeads },
  ].filter(d => d.value > 0);
  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  const salesStaff = employees
    .filter(e => ['sales_executive', 'employee', 'telecaller'].includes(e.role))
    .slice(0, 6);

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3A5F]">
            👋 Welcome, {user?.name?.split(' ')[0] || 'Executive'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Executive CRM — full business overview</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-lg">
          <CardContent className="p-5">
            <p className="text-blue-100 text-xs font-medium uppercase">Total Leads</p>
            <h3 className="text-3xl font-bold mt-1">{totalLeads}</h3>
            <p className="text-blue-200 text-xs mt-1">{bookedLeads} booked • {lostLeads} lost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white border-none shadow-lg">
          <CardContent className="p-5">
            <p className="text-purple-100 text-xs font-medium uppercase">Active Pipeline</p>
            <h3 className="text-3xl font-bold mt-1">{activeLeads}</h3>
            <p className="text-purple-200 text-xs mt-1">{followUpLeads} follow-ups pending</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-5">
            <p className="text-gray-400 text-xs uppercase font-medium">Active Staff</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-800">{activeStaff}</h3>
            <p className="text-xs text-green-600 mt-1">Site visits: {siteVisitsCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-orange-500 shadow-sm">
          <CardContent className="p-5">
            <p className="text-gray-400 text-xs uppercase font-medium">Bookings</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-800">{totalBookings}</h3>
            <p className="text-xs text-orange-600 mt-1">Conversion: {conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-semibold text-[#0F3A5F] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map(qa => (
            <QuickAction key={qa.path} {...qa} />
          ))}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader><CardTitle>Sales Funnel (Live)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Pie */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Lead Status</CardTitle></CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
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

      {/* ── Source Chart ── */}
      {sourceChartData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Top Lead Sources</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Staff Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staff Activity ({salesStaff.length})</CardTitle>
          <Button
            variant="outline" size="sm"
            onClick={() => window.location.href = '/crm/admin/staff-management'}
          >
            View All Staff
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesStaff.length > 0 ? salesStaff.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-xs font-bold text-white">
                        {(emp.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      {emp.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-blue-600 capitalize">{emp.role.replace('_', ' ')}</TableCell>
                  <TableCell className="text-xs text-gray-400">{emp.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.status === 'Active' ? 'default' : 'destructive'}
                      className={emp.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                    >
                      {emp.status || 'Active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-6">
                    No staff found in Supabase.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminDashboard;
