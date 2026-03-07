import React, { useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Download, TrendingUp, Target, Building2, Users, IndianRupee,
  ArrowDown, Loader2, Trophy
} from 'lucide-react';
import { format } from 'date-fns';

const formatINR = (val) => {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${n.toLocaleString('en-IN')}`;
  return `₹${n}`;
};

const CHART_COLORS = ['#0F3A5F', '#D4AF37', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const BookingAnalytics = () => {
  const { bookings, bookingsLoading, leads, leadsLoading, calls, siteVisits, employees } = useCRMData();

  // ── Conversion Funnel ─────────────────────────────────────────────────
  const funnel = useMemo(() => {
    const totalLeads = leads.length;
    const calledLeadIds = new Set((calls || []).map(c => c.leadId));
    const calledLeads = calledLeadIds.size;

    const connectedLeadIds = new Set(
      (calls || [])
        .filter(c => c.status === 'Connected' || c.status === 'connected' || c.status === 'interested')
        .map(c => c.leadId)
    );
    const interestedLeads = connectedLeadIds.size;

    const visitedLeadIds = new Set((siteVisits || []).map(v => v.leadId));
    const siteVisitDone = visitedLeadIds.size;

    const bookedLeads = leads.filter(l => l.status === 'Booked').length;

    return [
      { label: 'Total Leads', value: totalLeads, color: '#0F3A5F' },
      { label: 'Called', value: calledLeads, color: '#3b82f6' },
      { label: 'Interested', value: interestedLeads, color: '#f59e0b' },
      { label: 'Site Visit Done', value: siteVisitDone, color: '#8b5cf6' },
      { label: 'Booked', value: bookedLeads, color: '#10b981' },
    ];
  }, [leads, calls, siteVisits]);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalBookings = bookings.length;
    const totalValue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const bookedLeads = leads.filter(l => l.status === 'Booked');
    const totalToken = bookedLeads.reduce((sum, l) => sum + Number(l.tokenAmount || 0), 0);
    const convRate = leads.length > 0 ? ((bookedLeads.length / leads.length) * 100).toFixed(1) : '0.0';
    return { totalBookings, totalValue, totalToken, convRate, bookedCount: bookedLeads.length };
  }, [bookings, leads]);

  // ── Bookings by Project (with amounts) ────────────────────────────────
  const projectBookings = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const lead = leads.find(l => l.id === b.leadId);
      const proj = lead?.project || b.projectName || 'Unassigned';
      if (!map[proj]) map[proj] = { name: proj, count: 0, value: 0 };
      map[proj].count += 1;
      map[proj].value += (b.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [bookings, leads]);

  // ── Bookings by Employee ──────────────────────────────────────────────
  const employeeBookings = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const empId = b.employeeId;
      if (!map[empId]) map[empId] = { employeeId: empId, count: 0, value: 0 };
      map[empId].count += 1;
      map[empId].value += (b.amount || 0);
    });
    return Object.values(map).map(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      return { ...item, name: emp?.name || 'Unknown' };
    }).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [bookings, employees]);

  // ── Booking Timeline (per week/day) ───────────────────────────────────
  const bookingTimeline = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const date = new Date(b.bookingDate || b.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { name: key, count: 0, value: 0 };
      map[key].count += 1;
      map[key].value += (b.amount || 0);
    });
    return Object.values(map)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-6)
      .map(m => ({
        ...m,
        label: format(new Date(m.name + '-01'), 'MMM'),
      }));
  }, [bookings]);

  // ── Booked leads for detailed table ───────────────────────────────────
  const detailedBookings = useMemo(() => {
    return bookings.map(b => {
      const lead = leads.find(l => l.id === b.leadId);
      const emp = employees.find(e => e.id === b.employeeId);
      const tokenAmt = Number(lead?.tokenAmount || 0);
      const partialAmt = Number(lead?.partialPayment || 0);
      const bookingAmt = b.amount || 0;
      const pending = Math.max(0, bookingAmt - tokenAmt - partialAmt);
      return {
        ...b,
        leadPhone: lead?.phone || '—',
        tokenAmount: tokenAmt,
        partialPayment: partialAmt,
        pending,
        employeeName: emp?.name || '—',
      };
    }).sort((a, b) => new Date(b.bookingDate || b.timestamp) - new Date(a.bookingDate || a.timestamp));
  }, [bookings, leads, employees]);

  if (bookingsLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F3A5F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F]">Booking Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500">Real estate pipeline view — conversion funnel & booking insights</p>
        </div>
        <Button variant="outline" className="text-xs h-9 gap-1.5">
          <Download size={14} /> Export
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#0F3A5F]/20 bg-gradient-to-br from-[#0F3A5F]/5 to-white">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Bookings</p>
            <p className="text-2xl font-black text-[#0F3A5F] mt-1">{kpis.totalBookings}</p>
            <p className="text-[10px] text-gray-400 mt-1">Units booked</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Value</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{formatINR(kpis.totalValue)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Booking amounts</p>
          </CardContent>
        </Card>
        <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-white">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Token Collected</p>
            <p className="text-2xl font-black text-[#D4AF37] mt-1">{formatINR(kpis.totalToken)}</p>
            <p className="text-[10px] text-gray-400 mt-1">From booked leads</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Conversion Rate</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{kpis.convRate}%</p>
            <p className="text-[10px] text-gray-400 mt-1">{kpis.bookedCount} / {leads.length} leads</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Conversion Funnel ── */}
      <Card className="shadow-sm border-2 border-[#0F3A5F]/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target size={16} className="text-[#0F3A5F]" /> Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnel.map((step, i) => {
              const pct = funnel[0].value > 0 ? Math.round((step.value / funnel[0].value) * 100) : 0;
              const maxWidth = 100;
              const barWidth = Math.max(pct, 5);
              return (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600 w-28 text-right shrink-0">{step.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-9 relative overflow-hidden">
                      <div className="h-9 rounded-full transition-all duration-500 flex items-center px-3"
                        style={{ width: `${barWidth}%`, backgroundColor: step.color }}>
                        <span className="text-white text-xs font-black">{step.value.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-12 text-right">{pct}%</span>
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="flex items-center gap-3 py-0.5">
                      <span className="w-28" />
                      <ArrowDown size={12} className="text-gray-300 ml-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Project */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 size={14} /> Bookings by Project
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {projectBookings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectBookings} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `₹${v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => formatINR(val)} />
                  <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]}>
                    {projectBookings.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No project data available.</div>
            )}
          </CardContent>
        </Card>

        {/* Bookings by Employee */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users size={14} /> Bookings by Employee
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {employeeBookings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeBookings} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val, name) => name === 'value' ? formatINR(val) : val} />
                  <Bar dataKey="count" name="Bookings" fill="#0F3A5F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No employee data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Booking Timeline ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp size={14} /> Booking Timeline (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {bookingTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Bookings" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">No timeline data available.</div>
          )}
        </CardContent>
      </Card>

      {/* ── Detailed Bookings Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy size={14} className="text-[#D4AF37]" /> All Bookings ({detailedBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {detailedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest">
                    <th className="text-left py-2 px-2">Lead</th>
                    <th className="text-left py-2 px-2">Phone</th>
                    <th className="text-left py-2 px-2">Project</th>
                    <th className="text-left py-2 px-2">Unit</th>
                    <th className="text-right py-2 px-2">Booking Amt</th>
                    <th className="text-right py-2 px-2">Token</th>
                    <th className="text-right py-2 px-2">Partial</th>
                    <th className="text-right py-2 px-2">Pending</th>
                    <th className="text-left py-2 px-2">Employee</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedBookings.map((b, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-2 px-2 font-semibold text-[#0F3A5F] whitespace-nowrap">{b.leadName || '—'}</td>
                      <td className="py-2 px-2 text-gray-500 whitespace-nowrap">{b.leadPhone}</td>
                      <td className="py-2 px-2 text-gray-600 whitespace-nowrap">{b.projectName || '—'}</td>
                      <td className="py-2 px-2 text-gray-600">{b.unitNumber || '—'}</td>
                      <td className="py-2 px-2 text-right font-semibold">{formatINR(b.amount)}</td>
                      <td className="py-2 px-2 text-right text-emerald-600">{formatINR(b.tokenAmount)}</td>
                      <td className="py-2 px-2 text-right text-amber-600">{formatINR(b.partialPayment)}</td>
                      <td className="py-2 px-2 text-right text-red-600 font-semibold">{formatINR(b.pending)}</td>
                      <td className="py-2 px-2 text-gray-600 whitespace-nowrap">{b.employeeName}</td>
                      <td className="py-2 px-2 text-gray-500 whitespace-nowrap">
                        {b.bookingDate ? format(new Date(b.bookingDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-2 px-2">
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target size={24} className="text-gray-300" />
              </div>
              No bookings yet. Bookings will appear here when leads are converted.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingAnalytics;
