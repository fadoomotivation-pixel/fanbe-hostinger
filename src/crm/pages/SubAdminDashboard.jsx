import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, TrendingUp, Phone, Activity, ArrowUpRight, DollarSign, 
  Award, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SubAdminDashboard = () => {
  const { user } = useAuth();
  const { leads, employees, workLogs } = useCRMData();
  const [dateRange, setDateRange] = useState('month');

  // --- Live stats from Supabase ---
  const totalLeads     = leads.length;
  const openLeads      = leads.filter(l => l.status === 'Open').length;
  const followUpLeads  = leads.filter(l => l.status === 'FollowUp').length;
  const bookedLeads    = leads.filter(l => l.status === 'Booked').length;
  const lostLeads      = leads.filter(l => l.status === 'Lost').length;
  const activeLeads    = openLeads + followUpLeads;

  // workLogs from localStorage
  const totalCalls    = workLogs.reduce((acc, l) => acc + (l.totalCalls || 0), 0);
  const connectedCalls = workLogs.reduce((acc, l) => acc + (l.connectedCalls || 0), 0);
  const siteVisitsCount = workLogs.reduce((acc, l) => acc + (l.siteVisits || 0), 0);
  const conversionRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

  // Lead Funnel — real data
  const funnelData = [
    { name: 'Total Leads',   value: totalLeads,     fill: '#3b82f6' },
    { name: 'Active',        value: activeLeads,    fill: '#8b5cf6' },
    { name: 'Site Visits',   value: siteVisitsCount, fill: '#ec4899' },
    { name: 'Booked',        value: bookedLeads,    fill: '#10b981' },
  ];

  // Lead sources from real leads
  const sourceCounts = leads.reduce((acc, l) => {
    const src = l.source || 'Direct';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sourceChartData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Lead status pie
  const pieData = [
    { name: 'Open',      value: openLeads },
    { name: 'Follow-up', value: followUpLeads },
    { name: 'Booked',    value: bookedLeads },
    { name: 'Lost',      value: lostLeads },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

  // Staff from Supabase profiles
  const salesStaff = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'employee'
  ).slice(0, 6);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F3A5F]">Executive CRM Dashboard</h1>
          <p className="text-gray-500">Live performance overview from Supabase</p>
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Executive Summary Cards - Live from Supabase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Leads</p>
                <h3 className="text-3xl font-bold mt-2">{totalLeads}</h3>
                <div className="flex items-center mt-2 text-blue-100 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {bookedLeads} Booked
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Pipeline</p>
                <h3 className="text-3xl font-bold mt-2">{activeLeads}</h3>
                <div className="flex items-center mt-2 text-purple-100 text-xs">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> {followUpLeads} Follow-ups pending
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">Conversion Rate</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-800">{conversionRate}%</h3>
                <p className="text-xs text-green-600 mt-1">{connectedCalls} connected calls</p>
              </div>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-orange-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase">Lost Leads</p>
                <h3 className="text-3xl font-bold mt-2 text-gray-800">{lostLeads}</h3>
                <p className="text-xs text-orange-600 mt-1">Requiring review</p>
              </div>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel - real data */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader><CardTitle>Sales Funnel (Live)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
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
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Pie - real data */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Lead Status</CardTitle></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

      {/* Staff Activity Table from Supabase profiles */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staff Activity ({salesStaff.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {}}>View Full Report</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesStaff.length > 0 ? salesStaff.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {(emp.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      {emp.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{emp.email}</TableCell>
                  <TableCell className="text-xs text-blue-600 capitalize">{emp.role}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{emp.status || 'Active'}</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-6">No staff found in Supabase profiles</TableCell>
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
