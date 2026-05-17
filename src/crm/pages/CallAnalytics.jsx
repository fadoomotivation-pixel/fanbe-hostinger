// src/crm/pages/CallAnalytics.jsx
// Rewritten to use real calls data from Supabase instead of aggregated workLogs
import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Phone, PhoneIncoming, PhoneOff, Clock, Download, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import * as XLSX from 'xlsx';

const STATUS_COLORS = {
  Connected: '#22c55e',
  'Not Answered': '#ef4444',
  Busy: '#f59e0b',
  'Switched Off': '#6b7280',
  'Not Reachable': '#8b5cf6',
  interested: '#3b82f6',
  'follow_up': '#0ea5e9',
};

const normalizeStatus = (raw) => {
  if (!raw) return 'Unknown';
  const s = raw.trim().toLowerCase().replace(/[\s_-]+/g, '_');
  if (s === 'connected' || s === 'interested') return 'Connected';
  if (s === 'not_answered' || s === 'no_answer' || s === 'not_picked') return 'Not Answered';
  if (s === 'busy') return 'Busy';
  if (s === 'switched_off' || s === 'switch_off') return 'Switched Off';
  if (s === 'not_reachable' || s === 'unreachable') return 'Not Reachable';
  if (s === 'follow_up' || s === 'callback') return 'Follow Up';
  return raw;
};

const CallAnalytics = () => {
  const { calls, callsLoading, employees } = useCRMData();

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);

  // ── Filter calls by date range ──────────────────────────────────
  const filteredCalls = useMemo(() => {
    return calls.filter(c => {
      const d = c.timestamp?.split('T')[0];
      return d >= startDate && d <= endDate;
    });
  }, [calls, startDate, endDate]);

  // ── KPI Metrics ─────────────────────────────────────────────────
  const totalCalls = filteredCalls.length;
  const connectedCalls = filteredCalls.filter(c => {
    const ns = normalizeStatus(c.status);
    return ns === 'Connected';
  }).length;
  const connectionRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

  const callsWithDuration = filteredCalls.filter(c => c.duration && Number(c.duration) > 0);
  const avgDurationSec = callsWithDuration.length > 0
    ? Math.round(callsWithDuration.reduce((sum, c) => sum + Number(c.duration), 0) / callsWithDuration.length)
    : 0;
  const avgDurationDisplay = avgDurationSec > 0
    ? `${Math.floor(avgDurationSec / 60)}m ${avgDurationSec % 60}s`
    : 'N/A';

  // ── Status Breakdown (Pie chart) ────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const counts = {};
    filteredCalls.forEach(c => {
      const ns = normalizeStatus(c.status);
      counts[ns] = (counts[ns] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCalls]);

  // ── Per-Employee Breakdown ──────────────────────────────────────
  const employeeBreakdown = useMemo(() => {
    const map = {};
    filteredCalls.forEach(c => {
      const eid = c.employeeId || 'unknown';
      if (!map[eid]) {
        const emp = employees.find(e => e.id === eid);
        map[eid] = {
          employeeId: eid,
          name: c.employee_name || emp?.name || 'Unknown',
          total: 0,
          connected: 0,
          notAnswered: 0,
          busy: 0,
          other: 0,
          totalDuration: 0,
          durationCount: 0,
        };
      }
      map[eid].total += 1;
      const ns = normalizeStatus(c.status);
      if (ns === 'Connected') map[eid].connected += 1;
      else if (ns === 'Not Answered') map[eid].notAnswered += 1;
      else if (ns === 'Busy') map[eid].busy += 1;
      else map[eid].other += 1;
      if (c.duration && Number(c.duration) > 0) {
        map[eid].totalDuration += Number(c.duration);
        map[eid].durationCount += 1;
      }
    });
    return Object.values(map)
      .map(e => ({
        ...e,
        connectRate: e.total > 0 ? Math.round((e.connected / e.total) * 100) : 0,
        avgDuration: e.durationCount > 0 ? Math.round(e.totalDuration / e.durationCount) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredCalls, employees]);

  // ── Daily Trends (Bar chart) ────────────────────────────────────
  const dailyTrends = useMemo(() => {
    const map = {};
    filteredCalls.forEach(c => {
      const d = c.timestamp?.split('T')[0];
      if (!d) return;
      if (!map[d]) map[d] = { date: d, calls: 0, connected: 0 };
      map[d].calls += 1;
      if (normalizeStatus(c.status) === 'Connected') map[d].connected += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      label: new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
    }));
  }, [filteredCalls]);

  // ── Export CSV ──────────────────────────────────────────────────
  const handleExport = () => {
    const data = filteredCalls.map(c => ({
      Date: c.timestamp?.split('T')[0] || '',
      Time: c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : '',
      Employee: c.employee_name || '',
      Lead: c.leadName || '',
      Project: c.projectName || '',
      'Call Type': c.type || '',
      Status: normalizeStatus(c.status),
      'Duration (sec)': c.duration || 0,
      Notes: c.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Call Analytics');
    XLSX.writeFile(wb, `Call_Analytics_${startDate}_to_${endDate}.xlsx`);
  };

  // ── Loading State ───────────────────────────────────────────────
  if (callsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Loading call data from Supabase…</p>
      </div>
    );
  }

  const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280', '#8b5cf6', '#0ea5e9', '#ec4899'];

  return (
    <div className="space-y-6 pb-10">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F]">Call Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Tele-calling performance from Supabase calls table
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36 bg-white text-xs h-9" />
          <span className="text-gray-400 text-xs">to</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36 bg-white text-xs h-9" />
          <Button variant="outline" className="text-xs h-9 gap-1.5" onClick={handleExport}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Total Calls</p>
              <h3 className="text-2xl font-bold text-blue-900 leading-none mt-1">{totalCalls}</h3>
            </div>
            <Phone className="text-blue-400 h-5 w-5" />
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Connected</p>
              <h3 className="text-2xl font-bold text-green-900 leading-none mt-1">{connectedCalls}</h3>
            </div>
            <PhoneIncoming className="text-green-400 h-5 w-5" />
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wide">Connect Rate</p>
              <h3 className="text-2xl font-bold text-purple-900 leading-none mt-1">{connectionRate}%</h3>
            </div>
            <PhoneOff className="text-purple-400 h-5 w-5" />
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wide">Avg Duration</p>
              <h3 className="text-xl font-bold text-orange-900 leading-none mt-1">{avgDurationDisplay}</h3>
            </div>
            <Clock className="text-orange-400 h-5 w-5" />
          </CardContent>
        </Card>
      </div>

      {/* ── Charts: Status Pie + Daily Trend ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Breakdown Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Call Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statusBreakdown.length === 0 ? (
              <p className="text-center text-gray-400 text-sm pt-20">No call data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend Bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0F3A5F]">Daily Call Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dailyTrends.length === 0 ? (
              <p className="text-center text-gray-400 text-sm pt-20">No call data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrends} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="calls" name="Total Calls" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="connected" name="Connected" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Per-Employee Breakdown ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#0F3A5F] flex items-center gap-2">
            <Users size={16} /> Employee Call Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeBreakdown.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No call data for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500 uppercase">
                    <th className="py-2 pr-4">Employee</th>
                    <th className="py-2 pr-4 text-center">Total</th>
                    <th className="py-2 pr-4 text-center">Connected</th>
                    <th className="py-2 pr-4 text-center">Not Answered</th>
                    <th className="py-2 pr-4 text-center">Busy</th>
                    <th className="py-2 pr-4 text-center">Other</th>
                    <th className="py-2 pr-4 text-center">Connect %</th>
                    <th className="py-2 text-center">Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeBreakdown.map(emp => (
                    <tr key={emp.employeeId} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">{emp.name}</td>
                      <td className="py-3 pr-4 text-center font-bold text-gray-700">{emp.total}</td>
                      <td className="py-3 pr-4 text-center text-green-700 font-semibold">{emp.connected}</td>
                      <td className="py-3 pr-4 text-center text-red-600">{emp.notAnswered}</td>
                      <td className="py-3 pr-4 text-center text-yellow-600">{emp.busy}</td>
                      <td className="py-3 pr-4 text-center text-gray-500">{emp.other}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          emp.connectRate >= 50 ? 'bg-green-100 text-green-700' :
                          emp.connectRate >= 30 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {emp.connectRate}%
                        </span>
                      </td>
                      <td className="py-3 text-center text-gray-600 text-xs">
                        {emp.avgDuration > 0 ? `${Math.floor(emp.avgDuration / 60)}m ${emp.avgDuration % 60}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CallAnalytics;
