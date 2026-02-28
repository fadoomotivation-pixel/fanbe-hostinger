import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Award, Phone, PhoneCall, MapPin, IndianRupee, TrendingUp,
  Users, Target, Clock, Star, Crown, Medal, BarChart2,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// ═══════════════════════════════════════════════════════════════
// SCORING ALGORITHM — What We Measure & How
// ═══════════════════════════════════════════════════════════════
//
// METRIC                  | WEIGHT | WHY
// ────────────────────────┼────────┼──────────────────────────
// Total Calls             |  15%   | Outreach volume
// Connected Calls         |  15%   | Ability to reach leads
// Site Visits Completed   |  20%   | Field activity & effort
// Bookings Made           |  30%   | Revenue — the #1 goal
// Lead Conversion Rate    |  10%   | Efficiency (calls → bookings)
// Follow-up Discipline    |  10%   | Consistency & reliability
// ────────────────────────┼────────┼──────────────────────────
// TOTAL                   | 100%   |
//
// Each metric is normalized to 0–100, then multiplied by weight.
// Max possible score = 100.
// ═══════════════════════════════════════════════════════════════

const WEIGHTS = {
  totalCalls:      0.15,
  connectedCalls:  0.15,
  siteVisits:      0.20,
  bookings:        0.30,
  conversionRate:  0.10,
  followUpRate:    0.10,
};

const computeEmployeeMetrics = (employee, leads, calls, siteVisits, bookings, dateRange) => {
  const { start, end } = dateRange;
  const empId = employee.id;

  // Filter data by employee and date range
  const empCalls = calls.filter(c =>
    c.employeeId === empId &&
    isWithinInterval(new Date(c.timestamp), { start, end })
  );

  const empVisits = siteVisits.filter(sv =>
    sv.employeeId === empId &&
    isWithinInterval(new Date(sv.timestamp), { start, end })
  );

  const empBookings = bookings.filter(b =>
    b.employeeId === empId &&
    isWithinInterval(new Date(b.timestamp), { start, end })
  );

  const assignedLeads = leads.filter(l => l.assignedTo === empId || l.assigned_to === empId);

  // Raw metrics
  const totalCalls = empCalls.length;
  const connectedCalls = empCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  ).length;
  const completedVisits = empVisits.filter(sv =>
    sv.status === 'completed' || sv.status === 'Completed'
  ).length;
  const totalBookings = empBookings.length;
  const bookingRevenue = empBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Conversion rate: bookings / connected calls (or 0 if no connected calls)
  const conversionRate = connectedCalls > 0
    ? Math.round((totalBookings / connectedCalls) * 100)
    : 0;

  // Follow-up discipline: leads with follow_up_date that were contacted
  const leadsWithFollowUp = assignedLeads.filter(l => l.followUpDate || l.follow_up_date);
  const followedUpLeads = leadsWithFollowUp.filter(l => {
    return empCalls.some(c => c.leadId === l.id);
  });
  const followUpRate = leadsWithFollowUp.length > 0
    ? Math.round((followedUpLeads.length / leadsWithFollowUp.length) * 100)
    : 100; // no follow-ups needed = perfect

  return {
    employeeId: empId,
    employeeName: employee.name,
    role: employee.role,
    totalCalls,
    connectedCalls,
    completedVisits,
    totalBookings,
    bookingRevenue,
    conversionRate,
    followUpRate,
    assignedLeadCount: assignedLeads.length,
  };
};

// Normalize metrics across all employees, then compute weighted score
const scoreEmployees = (metricsArray) => {
  if (metricsArray.length === 0) return [];

  // Find max values for normalization
  const maxVals = {
    totalCalls:     Math.max(...metricsArray.map(m => m.totalCalls), 1),
    connectedCalls: Math.max(...metricsArray.map(m => m.connectedCalls), 1),
    completedVisits:Math.max(...metricsArray.map(m => m.completedVisits), 1),
    totalBookings:  Math.max(...metricsArray.map(m => m.totalBookings), 1),
    conversionRate: 100, // already a percentage
    followUpRate:   100,
  };

  return metricsArray.map(m => {
    const normalizedCalls     = (m.totalCalls / maxVals.totalCalls) * 100;
    const normalizedConnected = (m.connectedCalls / maxVals.connectedCalls) * 100;
    const normalizedVisits    = (m.completedVisits / maxVals.completedVisits) * 100;
    const normalizedBookings  = (m.totalBookings / maxVals.totalBookings) * 100;
    const normalizedConversion= m.conversionRate;
    const normalizedFollowUp  = m.followUpRate;

    const score = Math.round(
      normalizedCalls      * WEIGHTS.totalCalls +
      normalizedConnected  * WEIGHTS.connectedCalls +
      normalizedVisits     * WEIGHTS.siteVisits +
      normalizedBookings   * WEIGHTS.bookings +
      normalizedConversion * WEIGHTS.conversionRate +
      normalizedFollowUp   * WEIGHTS.followUpRate
    );

    return { ...m, score };
  }).sort((a, b) => b.score - a.score);
};

// ── Main Component ────────────────────────────────────────────
const EmployeeIntelligence = () => {
  const { user } = useAuth();
  const { employees, leads, calls, siteVisits, bookings } = useCRMData();
  const [period, setPeriod] = useState('week');

  // Only sales-facing employees
  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  // Date ranges
  const now = new Date();
  const dateRanges = useMemo(() => ({
    week: {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
      label: `${format(startOfWeek(now, { weekStartsOn: 1 }), 'dd MMM')} – ${format(endOfWeek(now, { weekStartsOn: 1 }), 'dd MMM yyyy')}`,
    },
    month: {
      start: startOfMonth(now),
      end: endOfMonth(now),
      label: format(now, 'MMMM yyyy'),
    },
  }), []);

  const activeRange = dateRanges[period];

  // Compute metrics for all employees
  const rankedEmployees = useMemo(() => {
    const metrics = salesEmployees.map(emp =>
      computeEmployeeMetrics(emp, leads, calls, siteVisits, bookings, activeRange)
    );
    return scoreEmployees(metrics);
  }, [salesEmployees, leads, calls, siteVisits, bookings, activeRange]);

  const topPerformer = rankedEmployees[0];
  const secondPlace = rankedEmployees[1];
  const thirdPlace = rankedEmployees[2];

  // Aggregate totals
  const totals = useMemo(() => ({
    calls:    rankedEmployees.reduce((s, e) => s + e.totalCalls, 0),
    visits:   rankedEmployees.reduce((s, e) => s + e.completedVisits, 0),
    bookings: rankedEmployees.reduce((s, e) => s + e.totalBookings, 0),
    revenue:  rankedEmployees.reduce((s, e) => s + e.bookingRevenue, 0),
  }), [rankedEmployees]);

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (idx === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (idx === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>;
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)} K`;
    return val.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Employee Intelligence</h1>
        <p className="text-gray-500">Performance rankings, top performers & scoring breakdown</p>
      </div>

      {/* Period Toggle */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-4 space-y-6">
          <p className="text-sm text-gray-400">{activeRange.label}</p>

          {/* ── Top 3 Podium ── */}
          {rankedEmployees.length >= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* #1 — Gold */}
              {topPerformer && (
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 shadow-lg md:col-span-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    {period === 'week' ? 'EMPLOYEE OF THE WEEK' : 'EMPLOYEE OF THE MONTH'}
                  </div>
                  <CardContent className="pt-10 pb-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-md">
                      {topPerformer.employeeName?.charAt(0) || '?'}
                    </div>
                    <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                    <h3 className="text-lg font-bold text-[#0F3A5F]">{topPerformer.employeeName}</h3>
                    <p className="text-xs text-gray-400 capitalize mb-3">{topPerformer.role?.replace('_', ' ')}</p>
                    <div className="text-3xl font-black text-yellow-600 mb-1">{topPerformer.score}</div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">Performance Score</p>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-[#0F3A5F]">{topPerformer.totalCalls}</p>
                        <p className="text-[10px] text-gray-400">Calls</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#0F3A5F]">{topPerformer.completedVisits}</p>
                        <p className="text-[10px] text-gray-400">Visits</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#0F3A5F]">{topPerformer.totalBookings}</p>
                        <p className="text-[10px] text-gray-400">Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* #2 — Silver */}
              {secondPlace && (
                <Card className="border border-gray-300 bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="pt-6 pb-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white text-lg font-black mx-auto mb-2">
                      {secondPlace.employeeName?.charAt(0) || '?'}
                    </div>
                    <Medal className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <h3 className="font-bold text-[#0F3A5F]">{secondPlace.employeeName}</h3>
                    <p className="text-[10px] text-gray-400 capitalize mb-2">{secondPlace.role?.replace('_', ' ')}</p>
                    <div className="text-2xl font-bold text-gray-600">{secondPlace.score}</div>
                    <p className="text-[10px] text-gray-400">Score</p>
                    <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{secondPlace.totalCalls} calls</span>
                      <span>{secondPlace.completedVisits} visits</span>
                      <span>{secondPlace.totalBookings} bookings</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* #3 — Bronze */}
              {thirdPlace && (
                <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                  <CardContent className="pt-6 pb-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white text-lg font-black mx-auto mb-2">
                      {thirdPlace.employeeName?.charAt(0) || '?'}
                    </div>
                    <Medal className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <h3 className="font-bold text-[#0F3A5F]">{thirdPlace.employeeName}</h3>
                    <p className="text-[10px] text-gray-400 capitalize mb-2">{thirdPlace.role?.replace('_', ' ')}</p>
                    <div className="text-2xl font-bold text-amber-700">{thirdPlace.score}</div>
                    <p className="text-[10px] text-gray-400">Score</p>
                    <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{thirdPlace.totalCalls} calls</span>
                      <span>{thirdPlace.completedVisits} visits</span>
                      <span>{thirdPlace.totalBookings} bookings</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Team Totals ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <PhoneCall className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0F3A5F]">{totals.calls}</p>
                  <p className="text-xs text-gray-400">Total Calls</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0F3A5F]">{totals.visits}</p>
                  <p className="text-xs text-gray-400">Site Visits</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0F3A5F]">{totals.bookings}</p>
                  <p className="text-xs text-gray-400">Bookings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                  <IndianRupee className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0F3A5F]">{formatCurrency(totals.revenue)}</p>
                  <p className="text-xs text-gray-400">Revenue</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Scoring Formula Explained ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> How We Score Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'Bookings', weight: '30%', color: 'bg-green-500', desc: 'Revenue is king' },
                  { label: 'Site Visits', weight: '20%', color: 'bg-purple-500', desc: 'Field effort' },
                  { label: 'Total Calls', weight: '15%', color: 'bg-blue-500', desc: 'Outreach volume' },
                  { label: 'Connected', weight: '15%', color: 'bg-cyan-500', desc: 'Reach rate' },
                  { label: 'Conversion', weight: '10%', color: 'bg-orange-500', desc: 'Efficiency' },
                  { label: 'Follow-ups', weight: '10%', color: 'bg-pink-500', desc: 'Discipline' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`${item.color} text-white text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1`}>
                      {item.weight}
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    <p className="text-[10px] text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Full Leaderboard Table ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Full Leaderboard — {period === 'week' ? 'This Week' : 'This Month'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankedEmployees.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No employee activity found for this period</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Calls</TableHead>
                        <TableHead className="text-center">Connected</TableHead>
                        <TableHead className="text-center">Site Visits</TableHead>
                        <TableHead className="text-center">Bookings</TableHead>
                        <TableHead className="text-center">Conversion</TableHead>
                        <TableHead className="text-center">Follow-up</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankedEmployees.map((emp, idx) => (
                        <TableRow key={emp.employeeId} className={idx < 3 ? 'bg-yellow-50/50' : ''}>
                          <TableCell className="text-center">{getRankIcon(idx)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#0F3A5F]">{emp.employeeName}</p>
                              <p className="text-[10px] text-gray-400 capitalize">{emp.role?.replace('_', ' ')} | {emp.assignedLeadCount} leads</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${getScoreColor(emp.score)} font-bold`}>{emp.score}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">{emp.totalCalls}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-green-700 font-medium">{emp.connectedCalls}</span>
                            {emp.totalCalls > 0 && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                ({Math.round((emp.connectedCalls / emp.totalCalls) * 100)}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">{emp.completedVisits}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-green-700">{emp.totalBookings}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={emp.conversionRate >= 20 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                              {emp.conversionRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={emp.followUpRate >= 70 ? 'text-green-600' : emp.followUpRate >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                              {emp.followUpRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {emp.bookingRevenue > 0 ? `₹${formatCurrency(emp.bookingRevenue)}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeIntelligence;
