import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Download, IndianRupee, TrendingUp, Target, Clock, Loader2,
  Building2, Users, CreditCard, ArrowUpRight
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, isWithinInterval
} from 'date-fns';

const formatINR = (val) => {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${n.toLocaleString('en-IN')}`;
  return `₹${n}`;
};

const formatINRShort = (val) => {
  const n = Number(val) || 0;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const RevenueAnalytics = () => {
  const { bookings, bookingsLoading, leads, employees } = useCRMData();
  const [dateRange, setDateRange] = useState('year');

  const now = new Date();
  const range = useMemo(() => {
    switch (dateRange) {
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
      default: return { start: startOfYear(now), end: endOfYear(now) };
    }
  }, [dateRange]);

  // Filter bookings by date range
  const filteredBookings = useMemo(() =>
    bookings.filter(b => {
      const d = new Date(b.bookingDate || b.timestamp);
      return isWithinInterval(d, range);
    }),
    [bookings, range]
  );

  // Booked leads for token/partial data
  const bookedLeads = useMemo(() =>
    leads.filter(l => l.status === 'Booked'),
    [leads]
  );

  // ── KPI Calculations ─────────────────────────────────────────────────
  const totalRevenue = filteredBookings.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalTokenCollected = bookedLeads.reduce((acc, l) => acc + Number(l.tokenAmount || 0), 0);
  const totalPartialPayment = bookedLeads.reduce((acc, l) => acc + Number(l.partialPayment || 0), 0);
  const totalPending = bookedLeads.reduce((acc, l) => {
    const booking = Number(l.bookingAmount || 0);
    const token = Number(l.tokenAmount || 0);
    const partial = Number(l.partialPayment || 0);
    return acc + Math.max(0, booking - token - partial);
  }, 0);
  const bookingCount = filteredBookings.length;

  // ── Monthly Revenue Trend ─────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = {};
    filteredBookings.forEach(b => {
      if (!b.amount || b.amount <= 0) return;
      const date = new Date(b.bookingDate || b.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { name: key, revenue: 0, token: 0, bookings: 0 };
      map[key].revenue += b.amount;
      map[key].bookings += 1;
    });
    // Add token data from leads
    bookedLeads.forEach(l => {
      const token = Number(l.tokenAmount || 0);
      if (token <= 0) return;
      const date = new Date(l.lastActivity || l.createdAt || Date.now());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { name: key, revenue: 0, token: 0, bookings: 0 };
      map[key].token += token;
    });
    return Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-6)
      .map(m => ({
        ...m,
        label: format(new Date(m.name + '-01'), 'MMM'),
      }));
  }, [filteredBookings, bookedLeads]);

  // ── Payment Status Breakdown ──────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const statusMap = {};
    filteredBookings.forEach(b => {
      const status = b.paymentStatus || 'Pending';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [filteredBookings]);

  // ── Per-Employee Revenue ──────────────────────────────────────────────
  const employeeRevenue = useMemo(() => {
    const map = {};
    filteredBookings.forEach(b => {
      const empId = b.employeeId;
      if (!map[empId]) map[empId] = { employeeId: empId, bookings: 0, totalValue: 0, tokenCollected: 0, pending: 0 };
      map[empId].bookings += 1;
      map[empId].totalValue += (b.amount || 0);
    });
    // Enrich with token data from leads
    bookedLeads.forEach(l => {
      const empId = l.assignedTo;
      if (map[empId]) {
        map[empId].tokenCollected += Number(l.tokenAmount || 0);
        const pending = Math.max(0, Number(l.bookingAmount || 0) - Number(l.tokenAmount || 0) - Number(l.partialPayment || 0));
        map[empId].pending += pending;
      }
    });
    return Object.values(map).map(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      return {
        ...item,
        name: emp?.name || 'Unknown',
        avgDeal: item.bookings > 0 ? Math.round(item.totalValue / item.bookings) : 0,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredBookings, bookedLeads, employees]);

  // ── Revenue by Project ────────────────────────────────────────────────
  const projectRevenue = useMemo(() => {
    const map = {};
    filteredBookings.forEach(b => {
      if (!b.amount || b.amount <= 0) return;
      const lead = leads.find(l => l.id === b.leadId);
      const proj = lead?.project || b.projectName || 'Unassigned';
      map[proj] = (map[proj] || 0) + b.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredBookings, leads]);

  if (bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F3A5F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F3A5F]">Revenue Analytics</h1>
          <p className="text-xs md:text-sm text-gray-500">Financial performance tracking — all data from Supabase</p>
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

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#0F3A5F]/20 bg-gradient-to-br from-[#0F3A5F]/5 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-[#0F3A5F]/10 flex items-center justify-center">
                <IndianRupee size={16} className="text-[#0F3A5F]" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Total Revenue</p>
            </div>
            <p className="text-2xl font-black text-[#0F3A5F]">{formatINR(totalRevenue)}</p>
            <p className="text-[10px] text-gray-400 mt-1">From {bookingCount} bookings</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard size={16} className="text-emerald-600" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Token Collected</p>
            </div>
            <p className="text-2xl font-black text-emerald-600">{formatINR(totalTokenCollected)}</p>
            <p className="text-[10px] text-gray-400 mt-1">From booked leads</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock size={16} className="text-red-600" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Pending Payments</p>
            </div>
            <p className="text-2xl font-black text-red-600">{formatINR(totalPending)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Booking - Token - Partial</p>
          </CardContent>
        </Card>
        <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Building2 size={16} className="text-[#D4AF37]" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Bookings Count</p>
            </div>
            <p className="text-2xl font-black text-[#D4AF37]">{bookingCount} <span className="text-sm font-medium text-gray-400">units</span></p>
            <p className="text-[10px] text-gray-400 mt-1">
              Avg deal: {formatINR(bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart (Bar + Line overlay) */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Revenue + Token Collection</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `₹${formatINRShort(v)}`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => formatINR(val)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Booking Amount" fill="#0F3A5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="token" name="Token Collected" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No revenue data available for this period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {paymentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="45%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {paymentBreakdown.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No payment data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue by Project ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Revenue by Project (Top 5)</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {projectRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectRevenue} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `₹${formatINRShort(v)}`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => formatINR(val)} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">No project data.</div>
          )}
        </CardContent>
      </Card>

      {/* ── Per-Employee Revenue Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users size={16} /> Per-Employee Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeRevenue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest">
                    <th className="text-left py-2 px-3">Employee</th>
                    <th className="text-right py-2 px-3">Bookings</th>
                    <th className="text-right py-2 px-3">Total Value</th>
                    <th className="text-right py-2 px-3">Token</th>
                    <th className="text-right py-2 px-3">Pending</th>
                    <th className="text-right py-2 px-3">Avg Deal</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRevenue.map((emp, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-[#0F3A5F]">{emp.name}</td>
                      <td className="py-2.5 px-3 text-right">{emp.bookings}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{formatINR(emp.totalValue)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatINR(emp.tokenCollected)}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">{formatINR(emp.pending)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-500">{formatINR(emp.avgDeal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No employee revenue data for this period.</div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Bookings Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target size={16} /> Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest">
                    <th className="text-left py-2 px-3">Lead</th>
                    <th className="text-left py-2 px-3">Project</th>
                    <th className="text-left py-2 px-3">Unit</th>
                    <th className="text-right py-2 px-3">Amount</th>
                    <th className="text-right py-2 px-3">Token</th>
                    <th className="text-left py-2 px-3">Employee</th>
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.slice(0, 20).map((b, i) => {
                    const emp = employees.find(e => e.id === b.employeeId);
                    const lead = bookedLeads.find(l => l.id === b.leadId);
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-2.5 px-3 font-semibold text-[#0F3A5F] whitespace-nowrap">{b.leadName || '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{b.projectName || '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{b.unitNumber || '—'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{formatINR(b.amount)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600">{formatINR(lead?.tokenAmount || 0)}</td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{emp?.name || '—'}</td>
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                          {b.bookingDate ? format(new Date(b.bookingDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge className={`text-[10px] ${
                            b.paymentStatus === 'Complete' || b.paymentStatus === 'Received'
                              ? 'bg-green-100 text-green-700'
                              : b.paymentStatus === 'Partial'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {b.paymentStatus || 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No bookings found for this period.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAnalytics;
