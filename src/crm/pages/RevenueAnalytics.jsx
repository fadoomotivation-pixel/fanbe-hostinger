import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';

const RevenueAnalytics = () => {
  const { customers, projects } = useCRMData();
  const [dateRange, setDateRange] = useState('year');

  // ─── Calculate Real Stats ────────────────────────────────────────────────────────────────────────────────
  const totalRevenue = customers.reduce((acc, c) => acc + (c.bookingAmount || 0), 0);
  const bookingCount = customers.filter(c => c.status === 'Booked').length;
  const avgRevenuePerBooking = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;
  const projectedMonthlyRevenue = totalRevenue > 0 ? Math.round(totalRevenue / 12) : 0; // Rough yearly projection / 12

  // ─── Monthly Revenue Trend (from customers' createdAt or updatedAt) ──────────────────────────────────────
  const monthlyDataMap = {};
  customers.forEach(c => {
    if (!c.bookingAmount || c.bookingAmount <= 0) return;
    const date = new Date(c.updatedAt || c.createdAt || Date.now());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { name: monthKey, revenue: 0, bookings: 0 };
    }
    monthlyDataMap[monthKey].revenue += c.bookingAmount;
    monthlyDataMap[monthKey].bookings += 1;
  });
  const monthlyData = Object.values(monthlyDataMap).sort((a, b) => a.name.localeCompare(b.name)).slice(-6); // Last 6 months
  const formattedMonthlyData = monthlyData.map(m => ({
    name: new Date(m.name + '-01').toLocaleDateString('en-US', { month: 'short' }),
    revenue: m.revenue,
    bookings: m.bookings
  }));

  // ─── Revenue by Project ───────────────────────────────────────────────────────────────────────────────────
  const projectRevenueMap = {};
  customers.forEach(c => {
    if (!c.bookingAmount || c.bookingAmount <= 0) return;
    const projId = c.projectId || 'Unassigned';
    if (!projectRevenueMap[projId]) {
      projectRevenueMap[projId] = 0;
    }
    projectRevenueMap[projId] += c.bookingAmount;
  });
  const projectRevenueData = Object.entries(projectRevenueMap).map(([projId, value]) => {
    const proj = projects.find(p => p.id === projId);
    return { name: proj?.name || projId, value };
  }).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

  // ─── Render ───────────────────────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#0F3A5F]">Revenue Analytics</h1>
            <p className="text-xs md:text-sm text-gray-500">Financial performance tracking</p>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="text-xs h-9 gap-1.5 shrink-0">
              <Download size={14} /> Export
            </Button>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium uppercase">Total Revenue (YTD)</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F] mt-1">₹{(totalRevenue/100000).toFixed(2)} Lakhs</h3>
            <div className="flex items-center text-xs text-gray-400 mt-2">
              <DollarSign size={12} className="mr-1" /> From {bookingCount} bookings
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium uppercase">Avg. Booking Value</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F] mt-1">₹{(avgRevenuePerBooking/100000).toFixed(2)} Lakhs</h3>
            <div className="flex items-center text-xs text-gray-400 mt-2">
              <TrendingUp size={12} className="mr-1" /> Per customer
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 font-medium uppercase">Proj. Monthly Revenue</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F] mt-1">₹{(projectedMonthlyRevenue/100000).toFixed(2)} Lakhs</h3>
            <div className="flex items-center text-xs text-gray-400 mt-2">
              Based on YTD average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {formattedMonthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedMonthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                   <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F3A5F" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0F3A5F" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                   <YAxis tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} tick={{ fontSize: 10 }} />
                   <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                   <Area type="monotone" dataKey="revenue" stroke="#0F3A5F" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No revenue data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue by Project (Top 5)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {projectRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectRevenueData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No project revenue data available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
