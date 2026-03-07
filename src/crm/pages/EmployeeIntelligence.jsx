import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award, Phone, PhoneCall, MapPin, IndianRupee, TrendingUp,
  Users, Target, Clock, Star, Crown, Medal, BarChart2,
  Brain, Sparkles, AlertTriangle, TrendingDown, Activity,
  ThumbsUp, ThumbsDown, Zap, Shield, CheckCircle, XCircle,
  MessageSquare, Calendar, Lightbulb, Flame, Eye,
  ArrowUpRight, ArrowDownRight, LayoutGrid, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isWithinInterval, differenceInDays, eachDayOfInterval, getDay, startOfDay
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  calculatePipelineHealth,
  calculateEmployeePipelines,
  analyzeWorkloadBalance,
  generateRiskAlerts,
  generateActivityFeed
} from '@/crm/utils/performanceSyncEngine';

// ════════════════════════════════════════════════════════════════════════════
// SCORING ALGORITHM
// ════════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
  totalCalls: 0.15,
  connectedCalls: 0.15,
  siteVisits: 0.20,
  bookings: 0.30,
  conversionRate: 0.10,
  followUpRate: 0.10,
};

const calculateEfficiency = (metrics) => {
  const callEfficiency = metrics.totalCalls > 0 ? (metrics.connectedCalls / metrics.totalCalls) * 100 : 0;
  const conversionEfficiency = metrics.conversionRate;
  const followUpEfficiency = metrics.followUpRate;
  const activityScore = Math.min(100, (metrics.totalCalls / 20) * 100);
  return Math.round((callEfficiency + conversionEfficiency + followUpEfficiency + activityScore) / 4);
};

const generateCoachingTips = (metrics) => {
  const tips = [];
  if (metrics.totalCalls < 10) {
    tips.push({ type: 'warning', icon: Phone, title: 'Low Call Activity', suggestion: 'Increase daily call target to 15-20 calls for better lead coverage' });
  }
  const connectionRate = metrics.totalCalls > 0 ? (metrics.connectedCalls / metrics.totalCalls) * 100 : 0;
  if (connectionRate < 40) {
    tips.push({ type: 'warning', icon: PhoneCall, title: 'Low Connection Rate', suggestion: 'Try calling during 10 AM-12 PM and 4 PM-6 PM for better reach' });
  }
  if (metrics.conversionRate < 15 && metrics.connectedCalls > 5) {
    tips.push({ type: 'critical', icon: Target, title: 'Low Conversion Rate', suggestion: 'Focus on quality over quantity. Review call scripts and objection handling' });
  }
  if (metrics.followUpRate < 60) {
    tips.push({ type: 'warning', icon: Calendar, title: 'Follow-up Discipline', suggestion: 'Set daily reminders for scheduled follow-ups. Consistency drives conversions' });
  }
  if (metrics.completedVisits === 0 && metrics.connectedCalls > 5) {
    tips.push({ type: 'info', icon: MapPin, title: 'Site Visit Opportunity', suggestion: 'Push for site visits with interested leads. Visits increase booking probability by 60%' });
  }
  if (metrics.score >= 80) {
    tips.push({ type: 'success', icon: Award, title: 'Top Performer!', suggestion: 'Excellent work! Share your strategies with the team in next meeting' });
  }
  return tips;
};

const calculateTeamHealth = (employees) => {
  const totalScore = employees.reduce((sum, e) => sum + e.score, 0);
  const avgScore = employees.length > 0 ? totalScore / employees.length : 0;
  const highPerformers = employees.filter(e => e.score >= 70).length;
  const needsAttention = employees.filter(e => e.score < 40).length;
  const avgConversion = employees.length > 0 ? employees.reduce((sum, e) => sum + e.conversionRate, 0) / employees.length : 0;
  const avgFollowUp = employees.length > 0 ? employees.reduce((sum, e) => sum + e.followUpRate, 0) / employees.length : 0;
  return {
    avgScore: Math.round(avgScore), highPerformers, needsAttention,
    avgConversion: Math.round(avgConversion), avgFollowUp: Math.round(avgFollowUp),
    teamSize: employees.length,
    health: avgScore >= 60 ? 'excellent' : avgScore >= 40 ? 'good' : 'needs-improvement'
  };
};

const computeEmployeeMetrics = (employee, leads, calls, siteVisits, bookings, dateRange) => {
  const { start, end } = dateRange;
  const empId = employee.id;

  const empCalls = calls.filter(c =>
    c.employeeId === empId && isWithinInterval(new Date(c.timestamp), { start, end })
  );
  const empVisits = siteVisits.filter(sv =>
    sv.employeeId === empId && isWithinInterval(new Date(sv.timestamp), { start, end })
  );
  const empBookings = bookings.filter(b =>
    b.employeeId === empId && isWithinInterval(new Date(b.timestamp), { start, end })
  );

  const assignedLeads = leads.filter(l => l.assignedTo === empId || l.assigned_to === empId);

  const totalCalls = empCalls.length;
  const connectedCalls = empCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  ).length;
  const completedVisits = empVisits.filter(sv =>
    sv.status === 'completed' || sv.status === 'Completed'
  ).length;
  const totalBookings = empBookings.length;
  const bookingRevenue = empBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const empTokenLeads = assignedLeads.filter(l => {
    const tokenValue = Number(l.tokenAmount || l.token_amount || 0);
    if (tokenValue <= 0) return false;
    const tokenDate = new Date(l.lastActivity || l.updatedAt || l.createdAt || Date.now());
    return isWithinInterval(tokenDate, { start, end });
  });
  const tokenReceived = empTokenLeads.reduce((sum, l) => sum + Number(l.tokenAmount || l.token_amount || 0), 0);

  // FIX: Conversion rate = bookings / total assigned leads (not connected calls)
  const conversionRate = assignedLeads.length > 0
    ? Math.round((totalBookings / assignedLeads.length) * 100)
    : 0;

  const leadsWithFollowUp = assignedLeads.filter(l => l.followUpDate || l.follow_up_date);
  const followedUpLeads = leadsWithFollowUp.filter(l => empCalls.some(c => c.leadId === l.id));
  const followUpRate = leadsWithFollowUp.length > 0
    ? Math.round((followedUpLeads.length / leadsWithFollowUp.length) * 100) : 100;

  // Collect objections for this employee's calls
  const objections = {};
  empCalls.forEach(c => {
    const obj = c.majorObjection;
    if (obj && obj.trim()) {
      const key = obj.trim().toLowerCase();
      objections[key] = (objections[key] || 0) + 1;
    }
  });
  const topObjections = Object.entries(objections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([objection, count]) => ({ objection, count }));

  // Daily calls for the current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(d => getDay(d) !== 0); // Mon-Sat
  const dailyCalls = weekDays.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
    const count = calls.filter(c =>
      c.employeeId === empId &&
      isWithinInterval(new Date(c.timestamp), { start: dayStart, end: dayEnd })
    ).length;
    return { name: format(day, 'EEE'), calls: count };
  });

  // Lead funnel for this employee
  const calledLeadIds = new Set(empCalls.map(c => c.leadId));
  const connectedLeadIds = new Set(empCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  ).map(c => c.leadId));
  const visitedLeadIds = new Set(empVisits.map(v => v.leadId));
  const bookedLeadIds = new Set(assignedLeads.filter(l => l.status === 'Booked').map(l => l.id));

  const funnel = {
    assigned: assignedLeads.length,
    called: calledLeadIds.size,
    interested: connectedLeadIds.size,
    visited: visitedLeadIds.size,
    booked: bookedLeadIds.size,
  };

  return {
    employeeId: empId, employeeName: employee.name, role: employee.role,
    totalCalls, connectedCalls, completedVisits, totalBookings, bookingRevenue, tokenReceived,
    conversionRate, followUpRate, assignedLeadCount: assignedLeads.length,
    efficiency: 0, topObjections, dailyCalls, funnel,
  };
};

const scoreEmployees = (metricsArray) => {
  if (metricsArray.length === 0) return [];
  const maxVals = {
    totalCalls: Math.max(...metricsArray.map(m => m.totalCalls), 1),
    connectedCalls: Math.max(...metricsArray.map(m => m.connectedCalls), 1),
    completedVisits: Math.max(...metricsArray.map(m => m.completedVisits), 1),
    totalBookings: Math.max(...metricsArray.map(m => m.totalBookings), 1),
    conversionRate: 100, followUpRate: 100,
  };
  return metricsArray.map(m => {
    const score = Math.round(
      (m.totalCalls / maxVals.totalCalls) * 100 * WEIGHTS.totalCalls +
      (m.connectedCalls / maxVals.connectedCalls) * 100 * WEIGHTS.connectedCalls +
      (m.completedVisits / maxVals.completedVisits) * 100 * WEIGHTS.siteVisits +
      (m.totalBookings / maxVals.totalBookings) * 100 * WEIGHTS.bookings +
      m.conversionRate * WEIGHTS.conversionRate +
      m.followUpRate * WEIGHTS.followUpRate
    );
    const efficiency = calculateEfficiency(m);
    const coachingTips = generateCoachingTips({ ...m, score });
    return { ...m, score, efficiency, coachingTips };
  }).sort((a, b) => b.score - a.score);
};

// ── Main Component ────────────────────────────────────────────────────
const EmployeeIntelligence = () => {
  const { user } = useAuth();
  const { employees, leads, calls, siteVisits, bookings } = useCRMData();
  const [period, setPeriod] = useState('week');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSection, setShowSection] = useState({ risks: true, activity: true, workload: true });

  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  const now = new Date();
  const dateRanges = useMemo(() => ({
    today: {
      start: startOfDay(now),
      end: now,
      label: format(now, 'dd MMM yyyy'),
    },
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

  const rankedEmployees = useMemo(() => {
    const metrics = salesEmployees.map(emp =>
      computeEmployeeMetrics(emp, leads, calls, siteVisits, bookings, activeRange)
    );
    return scoreEmployees(metrics);
  }, [salesEmployees, leads, calls, siteVisits, bookings, activeRange]);

  const teamHealth = useMemo(() => calculateTeamHealth(rankedEmployees), [rankedEmployees]);

  const riskAlerts = useMemo(() =>
    generateRiskAlerts(employees, leads, calls, siteVisits),
    [employees, leads, calls, siteVisits]
  );

  const workloadBalance = useMemo(() =>
    analyzeWorkloadBalance(employees, leads),
    [employees, leads]
  );

  const employeePipelines = useMemo(() =>
    calculateEmployeePipelines(salesEmployees, leads),
    [salesEmployees, leads]
  );

  const activityFeed = useMemo(() =>
    generateActivityFeed(employees, calls, siteVisits, bookings, 12),
    [employees, calls, siteVisits, bookings]
  );

  const overallPipeline = useMemo(() =>
    calculatePipelineHealth(leads),
    [leads]
  );

  const topPerformer = rankedEmployees[0];
  const secondPlace = rankedEmployees[1];
  const thirdPlace = rankedEmployees[2];

  const totals = useMemo(() => ({
    calls: rankedEmployees.reduce((s, e) => s + e.totalCalls, 0),
    visits: rankedEmployees.reduce((s, e) => s + e.completedVisits, 0),
    bookings: rankedEmployees.reduce((s, e) => s + e.totalBookings, 0),
    revenue: rankedEmployees.reduce((s, e) => s + e.bookingRevenue, 0),
    tokens: rankedEmployees.reduce((s, e) => s + e.tokenReceived, 0),
    avgConversion: rankedEmployees.length > 0
      ? Math.round(rankedEmployees.reduce((s, e) => s + e.conversionRate, 0) / rankedEmployees.length) : 0,
  }), [rankedEmployees]);

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreRowColor = (score) => {
    if (score >= 70) return 'border-l-4 border-l-green-500 bg-green-50/30';
    if (score >= 40) return 'border-l-4 border-l-yellow-500 bg-yellow-50/30';
    return 'border-l-4 border-l-red-500 bg-red-50/30';
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const getRankIcon = (idx) => {
    if (idx === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (idx === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (idx === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>;
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'visit': return <MapPin className="h-4 w-4" />;
      case 'booking': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (color) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-700';
      case 'purple': return 'bg-purple-100 text-purple-700';
      case 'blue': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEmployeePipeline = (empId) => {
    return employeePipelines.find(p => p.employeeId === empId)?.pipeline || { hot: 0, warm: 0, cold: 0, total: 0 };
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F] flex items-center gap-2">
          <Brain className="h-7 w-7 text-purple-600" />
          Employee Intelligence
        </h1>
        <p className="text-gray-500">AI-powered performance insights based on real activity</p>
      </div>

      {/* ═══ RISK ALERTS BANNER ═══ */}
      {riskAlerts.length > 0 && (
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-red-900">Risk Alerts ({riskAlerts.length})</h3>
              </div>
              <button onClick={() => setShowSection(s => ({ ...s, risks: !s.risks }))} className="text-xs text-red-600 hover:underline">
                {showSection.risks ? 'Hide' : 'Show'}
              </button>
            </div>
            {showSection.risks && (
              <div className="space-y-2">
                {riskAlerts.map((alert, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.type === 'critical' ? 'bg-red-100 border border-red-300' : 'bg-yellow-100 border border-yellow-300'
                  }`}>
                    {alert.type === 'critical' ?
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" /> :
                      <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className={`text-xs font-bold ${alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>{alert.title}</p>
                      <p className="text-[11px] text-gray-700">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Health Dashboard — 4 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#0F3A5F]/20 bg-gradient-to-br from-[#0F3A5F]/5 to-white">
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-black ${getHealthColor(teamHealth.health)} rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-1`}>
              {teamHealth.avgConversion}%
            </div>
            <p className="text-xs font-semibold text-gray-600">Team Conversion</p>
            <p className="text-[10px] text-gray-400">Bookings / Assigned Leads</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{totals.bookings}</p>
            <p className="text-xs font-semibold text-gray-600">Total Bookings</p>
            <p className="text-[10px] text-gray-400">This Period</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-blue-600">
              {rankedEmployees.length > 0 ? Math.round(totals.calls / rankedEmployees.length) : 0}
            </p>
            <p className="text-xs font-semibold text-gray-600">Avg Calls/Employee</p>
            <p className="text-[10px] text-gray-400">This Period</p>
          </CardContent>
        </Card>
        <Card className="border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/10 to-white">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-[#D4AF37]">{formatCurrency(totals.revenue)}</p>
            <p className="text-xs font-semibold text-gray-600">Total Revenue</p>
            <p className="text-[10px] text-gray-400">This Period</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Pipeline + Workload Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-gray-600" /> Lead Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 h-5 rounded-full overflow-hidden mb-3">
              {overallPipeline.hotPercent > 0 && (
                <div className="bg-red-500 transition-all flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${overallPipeline.hotPercent}%` }}>
                  {overallPipeline.hotPercent > 10 ? `${overallPipeline.hotPercent}%` : ''}
                </div>
              )}
              {overallPipeline.warmPercent > 0 && (
                <div className="bg-yellow-500 transition-all flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${overallPipeline.warmPercent}%` }}>
                  {overallPipeline.warmPercent > 10 ? `${overallPipeline.warmPercent}%` : ''}
                </div>
              )}
              {overallPipeline.coldPercent > 0 && (
                <div className="bg-blue-400 transition-all flex items-center justify-center text-white text-[9px] font-bold" style={{ width: `${overallPipeline.coldPercent}%` }}>
                  {overallPipeline.coldPercent > 10 ? `${overallPipeline.coldPercent}%` : ''}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-2xl font-black text-red-600">{overallPipeline.hot}</p><p className="text-[10px] text-gray-500">Hot</p></div>
              <div><p className="text-2xl font-black text-yellow-600">{overallPipeline.warm}</p><p className="text-[10px] text-gray-500">Warm</p></div>
              <div><p className="text-2xl font-black text-blue-500">{overallPipeline.cold}</p><p className="text-[10px] text-gray-500">Cold</p></div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${workloadBalance.balanced ? 'border-green-200' : 'border-orange-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Workload Balance
              {workloadBalance.balanced ? (
                <Badge className="bg-green-100 text-green-700 text-[10px] ml-auto">Balanced</Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-700 text-[10px] ml-auto">Imbalanced</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">Avg: {workloadBalance.avgLeads} leads/person</p>
            <div className="space-y-2">
              {workloadBalance.employees.map((emp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 w-24 truncate">{emp.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
                    <div className={`h-3 rounded-full transition-all ${
                      emp.status === 'overloaded' ? 'bg-red-500' : emp.status === 'underloaded' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} style={{ width: `${Math.min(100, workloadBalance.avgLeads > 0 ? (emp.leadCount / (workloadBalance.avgLeads * 2)) * 100 : 0)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-8 text-right">{emp.leadCount}</span>
                  {emp.status !== 'balanced' && (
                    <span className={`text-[9px] ${emp.status === 'overloaded' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {emp.deviation > 0 ? '+' : ''}{emp.deviation}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Toggle */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-4 space-y-6">
          <p className="text-sm text-gray-400">{activeRange.label}</p>

          {/* Top 3 Podium */}
          {rankedEmployees.length >= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformer && (
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    {period === 'today' ? 'TOP TODAY' : period === 'week' ? 'EMPLOYEE OF THE WEEK' : 'EMPLOYEE OF THE MONTH'}
                  </div>
                  <CardContent className="pt-10 pb-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-md">
                      {topPerformer.employeeName?.charAt(0) || '?'}
                    </div>
                    <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                    <h3 className="text-lg font-bold text-[#0F3A5F]">{topPerformer.employeeName}</h3>
                    <p className="text-xs text-gray-400 capitalize mb-3">{topPerformer.role?.replace('_', ' ')}</p>
                    <div className="text-3xl font-black text-yellow-600 mb-1">{topPerformer.score}</div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">Performance Score</p>
                    <Badge className="bg-green-100 text-green-700 text-[10px]">{topPerformer.efficiency}% Efficiency</Badge>
                    {(() => {
                      const pp = getEmployeePipeline(topPerformer.employeeId);
                      return pp.total > 0 && (
                        <div className="mt-3 px-4">
                          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-400" style={{ width: `${(pp.hot / pp.total) * 100}%` }} />
                            <div className="bg-yellow-400" style={{ width: `${(pp.warm / pp.total) * 100}%` }} />
                            <div className="bg-blue-300" style={{ width: `${(pp.cold / pp.total) * 100}%` }} />
                          </div>
                          <p className="text-[9px] text-gray-400 mt-1">{pp.hot}H / {pp.warm}W / {pp.cold}C</p>
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div><p className="text-lg font-bold text-[#0F3A5F]">{topPerformer.totalCalls}</p><p className="text-[10px] text-gray-400">Calls</p></div>
                      <div><p className="text-lg font-bold text-[#0F3A5F]">{topPerformer.completedVisits}</p><p className="text-[10px] text-gray-400">Visits</p></div>
                      <div><p className="text-lg font-bold text-[#0F3A5F]">{topPerformer.totalBookings}</p><p className="text-[10px] text-gray-400">Bookings</p></div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {secondPlace && (
                <Card className="border border-gray-300 bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="pt-6 pb-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white text-lg font-black mx-auto mb-2">
                      {secondPlace.employeeName?.charAt(0) || '?'}
                    </div>
                    <Medal className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <h3 className="font-bold text-[#0F3A5F]">{secondPlace.employeeName}</h3>
                    <div className="text-2xl font-bold text-gray-600">{secondPlace.score}</div>
                    <p className="text-[10px] text-gray-400 mb-2">Score</p>
                    <Badge className="bg-blue-100 text-blue-700 text-[9px]">{secondPlace.efficiency}% Efficiency</Badge>
                  </CardContent>
                </Card>
              )}
              {thirdPlace && (
                <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                  <CardContent className="pt-6 pb-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-white text-lg font-black mx-auto mb-2">
                      {thirdPlace.employeeName?.charAt(0) || '?'}
                    </div>
                    <Medal className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <h3 className="font-bold text-[#0F3A5F]">{thirdPlace.employeeName}</h3>
                    <div className="text-2xl font-bold text-amber-700">{thirdPlace.score}</div>
                    <p className="text-[10px] text-gray-400 mb-2">Score</p>
                    <Badge className="bg-amber-100 text-amber-700 text-[9px]">{thirdPlace.efficiency}% Efficiency</Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Team Totals */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Calls', value: totals.calls, icon: PhoneCall, color: 'blue' },
              { label: 'Site Visits', value: totals.visits, icon: MapPin, color: 'purple' },
              { label: 'Bookings', value: totals.bookings, icon: Target, color: 'green' },
              { label: 'Token Received', value: formatCurrency(totals.tokens), icon: IndianRupee, color: 'amber' },
              { label: 'Revenue', value: formatCurrency(totals.revenue), icon: IndianRupee, color: 'yellow' },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-${item.color}-100 flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#0F3A5F]">{typeof item.value === 'number' ? item.value : item.value}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-600" /> Recent Team Activity
                </CardTitle>
                <button onClick={() => setShowSection(s => ({ ...s, activity: !s.activity }))} className="text-xs text-blue-600 hover:underline">
                  {showSection.activity ? 'Hide' : 'Show'}
                </button>
              </div>
            </CardHeader>
            {showSection.activity && (
              <CardContent>
                {activityFeed.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">No recent activity</p>
                ) : (
                  <div className="space-y-2">
                    {activityFeed.map((act, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(act.color)}`}>
                          {getActivityIcon(act.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{act.employeeName}</p>
                          <p className="text-[11px] text-gray-500 truncate">{act.detail}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {act.timestamp ? format(new Date(act.timestamp), 'dd MMM, h:mm a') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* ═══ PERFORMANCE TABLE + DEEP-DIVE ═══ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Performance Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sortable table header */}
              <div className="hidden md:grid grid-cols-10 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pb-2 border-b border-gray-200">
                <span>Rank</span><span>Employee</span><span>Calls</span><span>Connected%</span>
                <span>Visits</span><span>Bookings</span><span>Conv%</span><span>Score</span><span>Status</span><span></span>
              </div>
              {rankedEmployees.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No employee activity found for this period</p>
              ) : (
                <div className="space-y-3 mt-3">
                  {rankedEmployees.map((emp, idx) => {
                    const empPipeline = getEmployeePipeline(emp.employeeId);
                    const isExpanded = selectedEmployee?.employeeId === emp.employeeId;
                    const connectedPct = emp.totalCalls > 0 ? Math.round((emp.connectedCalls / emp.totalCalls) * 100) : 0;
                    return (
                      <Card key={emp.employeeId}
                        className={`cursor-pointer hover:shadow-lg transition overflow-hidden ${getScoreRowColor(emp.score)}`}
                        onClick={() => setSelectedEmployee(isExpanded ? null : emp)}>
                        <CardContent className="p-4">
                          {/* Summary row */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="text-center w-8">{getRankIcon(idx)}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-[#0F3A5F]">{emp.employeeName}</h3>
                                  <Badge className={`${getScoreColor(emp.score)} font-bold text-xs`}>{emp.score}</Badge>
                                </div>
                                <p className="text-xs text-gray-400 capitalize">{emp.role?.replace('_', ' ')} | {emp.assignedLeadCount} leads</p>
                                <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                                  <span className="text-blue-600">📞 {emp.totalCalls}</span>
                                  <span className="text-emerald-600">✅ {connectedPct}%</span>
                                  <span className="text-purple-600">🏗️ {emp.completedVisits}</span>
                                  <span className="text-amber-600">🎯 {emp.totalBookings}</span>
                                  <span className="text-green-600 font-medium">{emp.conversionRate}% conv</span>
                                </div>
                                {empPipeline.total > 0 && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden w-32">
                                      <div className="bg-red-400" style={{ width: `${(empPipeline.hot / empPipeline.total) * 100}%` }} />
                                      <div className="bg-yellow-400" style={{ width: `${(empPipeline.warm / empPipeline.total) * 100}%` }} />
                                      <div className="bg-blue-300" style={{ width: `${(empPipeline.cold / empPipeline.total) * 100}%` }} />
                                    </div>
                                    <span className="text-[9px] text-gray-400">{empPipeline.hot}H {empPipeline.warm}W {empPipeline.cold}C</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <Badge className="bg-purple-100 text-purple-700 text-xs">{emp.efficiency}% Eff</Badge>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                            </div>
                          </div>

                          {/* ═══ EXPANDED DEEP-DIVE PANEL ═══ */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-5" onClick={e => e.stopPropagation()}>

                              {/* Mini Bar Chart: Daily Calls This Week */}
                              {emp.dailyCalls && (
                                <div>
                                  <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                                    <BarChart2 className="h-3.5 w-3.5" /> Daily Calls This Week
                                  </p>
                                  <div className="h-[140px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={emp.dailyCalls} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="calls" fill="#0F3A5F" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}

                              {/* Lead Funnel */}
                              {emp.funnel && (
                                <div>
                                  <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                                    <Target className="h-3.5 w-3.5" /> Lead Funnel
                                  </p>
                                  <div className="space-y-1">
                                    {[
                                      { label: 'Assigned', value: emp.funnel.assigned, color: 'bg-[#0F3A5F]' },
                                      { label: 'Called', value: emp.funnel.called, color: 'bg-blue-500' },
                                      { label: 'Interested', value: emp.funnel.interested, color: 'bg-amber-500' },
                                      { label: 'Site Visit', value: emp.funnel.visited, color: 'bg-purple-500' },
                                      { label: 'Booked', value: emp.funnel.booked, color: 'bg-emerald-500' },
                                    ].map((step, si) => {
                                      const pct = emp.funnel.assigned > 0 ? Math.round((step.value / emp.funnel.assigned) * 100) : 0;
                                      return (
                                        <div key={si} className="flex items-center gap-2">
                                          <span className="text-[10px] text-gray-500 w-16 text-right">{step.label}</span>
                                          <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                                            <div className={`${step.color} h-5 rounded-full transition-all flex items-center justify-end pr-2`}
                                              style={{ width: `${Math.max(pct, 3)}%` }}>
                                              {pct > 15 && <span className="text-[9px] text-white font-bold">{step.value}</span>}
                                            </div>
                                          </div>
                                          <span className="text-[10px] font-bold text-gray-600 w-12">{step.value} ({pct}%)</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Top Objections */}
                              {emp.topObjections && emp.topObjections.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5" /> Top Objections
                                  </p>
                                  <div className="space-y-1.5">
                                    {emp.topObjections.map((obj, oi) => (
                                      <div key={oi} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                                        <span className="text-xs text-orange-800 capitalize">{obj.objection}</span>
                                        <Badge className="bg-orange-200 text-orange-700 text-[10px]">{obj.count}x</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Risk Alerts per employee */}
                              {(emp.totalCalls === 0 || emp.conversionRate < 5 || (emp.totalCalls > 0 && (emp.connectedCalls / emp.totalCalls) * 100 < 30)) && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 mb-1">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Risk Indicators
                                  </p>
                                  <div className="space-y-1">
                                    {emp.totalCalls === 0 && (
                                      <p className="text-[11px] text-red-600">No calls made in this period</p>
                                    )}
                                    {emp.conversionRate < 5 && emp.assignedLeadCount > 0 && (
                                      <p className="text-[11px] text-red-600">Conversion rate below 5%</p>
                                    )}
                                    {emp.totalCalls > 0 && (emp.connectedCalls / emp.totalCalls) * 100 < 30 && (
                                      <p className="text-[11px] text-red-600">Connected rate below 30%</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Coaching Tips */}
                              {emp.coachingTips.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Brain className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-bold text-purple-900 text-sm">AI Coaching Recommendations</h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {emp.coachingTips.map((tip, i) => (
                                      <div key={i} className={`p-3 rounded-lg border ${
                                        tip.type === 'critical' ? 'bg-red-50 border-red-200' :
                                        tip.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                        tip.type === 'success' ? 'bg-green-50 border-green-200' :
                                        'bg-blue-50 border-blue-200'
                                      }`}>
                                        <div className="flex items-start gap-2">
                                          {React.createElement(tip.icon, {
                                            className: `h-4 w-4 shrink-0 ${
                                              tip.type === 'critical' ? 'text-red-600' :
                                              tip.type === 'warning' ? 'text-yellow-600' :
                                              tip.type === 'success' ? 'text-green-600' : 'text-blue-600'
                                            }`
                                          })}
                                          <div>
                                            <p className={`text-xs font-bold ${
                                              tip.type === 'critical' ? 'text-red-700' :
                                              tip.type === 'warning' ? 'text-yellow-700' :
                                              tip.type === 'success' ? 'text-green-700' : 'text-blue-700'
                                            }`}>{tip.title}</p>
                                            <p className="text-[11px] text-gray-600 mt-0.5">{tip.suggestion}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scoring Formula */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4" /> Performance Scoring Methodology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { label: 'Bookings', weight: '30%', color: 'bg-green-500', desc: 'Revenue is king' },
                  { label: 'Site Visits', weight: '20%', color: 'bg-purple-500', desc: 'Field effort' },
                  { label: 'Total Calls', weight: '15%', color: 'bg-blue-500', desc: 'Outreach volume' },
                  { label: 'Connected', weight: '15%', color: 'bg-cyan-500', desc: 'Reach rate' },
                  { label: 'Conversion', weight: '10%', color: 'bg-orange-500', desc: 'Bookings/Leads' },
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeIntelligence;
