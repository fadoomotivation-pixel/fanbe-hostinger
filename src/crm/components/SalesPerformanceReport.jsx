import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, TrendingUp, Trophy, Users, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const SalesPerformanceReport = ({ leads, employees }) => {
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  // Calculate performance metrics
  const performanceData = useMemo(() => {
    let filteredLeads = leads || [];

    // Filter by date range
    const now = new Date();
    if (dateRange === 'today') {
      const today = now.toISOString().split('T')[0];
      filteredLeads = filteredLeads.filter(lead => 
        (lead.token_date && lead.token_date.split('T')[0] === today) ||
        (lead.booking_date && lead.booking_date.split('T')[0] === today)
      );
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filteredLeads = filteredLeads.filter(lead => 
        (lead.token_date && new Date(lead.token_date) >= weekAgo) ||
        (lead.booking_date && new Date(lead.booking_date) >= weekAgo)
      );
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filteredLeads = filteredLeads.filter(lead => 
        (lead.token_date && new Date(lead.token_date) >= monthAgo) ||
        (lead.booking_date && new Date(lead.booking_date) >= monthAgo)
      );
    } else if (dateRange === 'custom' && startDate && endDate) {
      filteredLeads = filteredLeads.filter(lead => {
        const tokenDate = lead.token_date ? new Date(lead.token_date) : null;
        const bookingDate = lead.booking_date ? new Date(lead.booking_date) : null;
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (tokenDate && tokenDate >= start && tokenDate <= end) ||
               (bookingDate && bookingDate >= start && bookingDate <= end);
      });
    }

    // Filter by employee
    if (selectedEmployee !== 'all') {
      filteredLeads = filteredLeads.filter(lead => lead.assigned_to === selectedEmployee);
    }

    // Group by employee
    const employeeStats = {};
    
    filteredLeads.forEach(lead => {
      const empId = lead.assigned_to;
      if (!empId) return;

      if (!employeeStats[empId]) {
        const emp = employees?.find(e => e.id === empId);
        employeeStats[empId] = {
          id: empId,
          name: emp?.name || 'Unknown',
          email: emp?.email || '',
          totalTokens: 0,
          tokenCount: 0,
          totalBookings: 0,
          bookingCount: 0,
          totalRevenue: 0
        };
      }

      if (lead.token_amount && lead.token_amount > 0) {
        employeeStats[empId].totalTokens += parseFloat(lead.token_amount);
        employeeStats[empId].tokenCount++;
      }

      if (lead.booking_amount && lead.booking_amount > 0) {
        employeeStats[empId].totalBookings += parseFloat(lead.booking_amount);
        employeeStats[empId].bookingCount++;
      }

      employeeStats[empId].totalRevenue = 
        employeeStats[empId].totalTokens + employeeStats[empId].totalBookings;
    });

    // Convert to array and sort by total revenue
    const statsArray = Object.values(employeeStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate totals
    const totals = statsArray.reduce((acc, emp) => ({
      totalTokens: acc.totalTokens + emp.totalTokens,
      totalBookings: acc.totalBookings + emp.totalBookings,
      totalRevenue: acc.totalRevenue + emp.totalRevenue,
      tokenCount: acc.tokenCount + emp.tokenCount,
      bookingCount: acc.bookingCount + emp.bookingCount
    }), { totalTokens: 0, totalBookings: 0, totalRevenue: 0, tokenCount: 0, bookingCount: 0 });

    return { statsArray, totals };
  }, [leads, employees, dateRange, startDate, endDate, selectedEmployee]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Token Count', 'Total Tokens (₹)', 'Booking Count', 'Total Bookings (₹)', 'Total Revenue (₹)'];
    const rows = performanceData.statsArray.map(emp => [
      emp.name,
      emp.tokenCount,
      emp.totalTokens,
      emp.bookingCount,
      emp.totalBookings,
      emp.totalRevenue
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Sales Performance Report
              </CardTitle>
              <CardDescription>Track token and booking amounts by salesperson</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Total Tokens</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatCurrency(performanceData.totals.totalTokens)}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {performanceData.totals.tokenCount} transactions
                </p>
              </div>
              <IndianRupee className="text-amber-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Bookings</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(performanceData.totals.totalBookings)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {performanceData.totals.bookingCount} bookings
                </p>
              </div>
              <IndianRupee className="text-green-600" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(performanceData.totals.totalRevenue)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {performanceData.statsArray.length} salespeople
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Salesperson Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Salesperson</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Tokens</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Token Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Bookings</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Booking Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.statsArray.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No sales data available for the selected filters
                    </td>
                  </tr>
                ) : (
                  performanceData.statsArray.map((emp, index) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {index === 0 && <Trophy className="text-yellow-500 inline" size={16} />}
                        {index === 1 && <Trophy className="text-gray-400 inline" size={16} />}
                        {index === 2 && <Trophy className="text-amber-600 inline" size={16} />}
                        {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {emp.tokenCount}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-amber-700">
                        {formatCurrency(emp.totalTokens)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {emp.bookingCount}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-green-700">
                        {formatCurrency(emp.totalBookings)}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-blue-700">
                        {formatCurrency(emp.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPerformanceReport;
