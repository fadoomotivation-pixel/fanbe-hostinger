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
  ArrowUpRight, ArrowDownRight, LayoutGrid, AlertCircle
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';
import {
  calculatePipelineHealth,
  calculateEmployeePipelines,
  analyzeWorkloadBalance,
  generateRiskAlerts,
  generateActivityFeed
} from '@/crm/utils/performanceSyncEngine';

// ════════════════════════════════════════════════════════════════════════════
// ENHANCED SCORING ALGORITHM WITH AI PREDICTIONS
// ════════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
  totalCalls: 0.15,
  connectedCalls: 0.15,
  siteVisits: 0.20,
  bookings: 0.30,
  conversionRate: 0.10,
  followUpRate: 0.10,
};

// Calculate employee efficiency score
const calculateEfficiency = (metrics) => {
  const callEfficiency = metrics.connectedCalls > 0 ? (metrics.connectedCalls / metrics.totalCalls) * 100 : 0;
  const conversionEfficiency = metrics.conversionRate;
  const followUpEfficiency = metrics.followUpRate;
  const activityScore = Math.min(100, (metrics.totalCalls / 20) * 100); // 20 calls = 100%

  return Math.round((callEfficiency + conversionEfficiency + followUpEfficiency + activityScore) / 4);
};

// Generate coaching recommendations
const generateCoachingTips = (metrics) => {
  const tips = [];

  if (metrics.totalCalls < 10) {
    tips.push({
      type: 'warning',
      icon: Phone,
      title: 'Low Call Activity',
      suggestion: 'Increase daily call target to 15-20 calls for better lead coverage'
    });
  }

  const connectionRate = metrics.totalCalls > 0 ? (metrics.connectedCalls / metrics.totalCalls) * 100 : 0;
  if (connectionRate < 40) {
    tips.push({
      type: 'warning',
      icon: PhoneCall,
      title: 'Low Connection Rate',
      suggestion: 'Try calling during 10 AM-12 PM and 4 PM-6 PM for better reach'
    });
  }

  if (metrics.conversionRate < 15 && metrics.connectedCalls > 5) {
    tips.push({
      type: 'critical',
      icon: Target,
      title: 'Low Conversion Rate',
      suggestion: 'Focus on quality over quantity. Review call scripts and objection handling'
    });
  }

  if (metrics.followUpRate < 60) {
    tips.push({
      type: 'warning',
      icon: Calendar,
      title: 'Follow-up Discipline',
      suggestion: 'Set daily reminders for scheduled follow-ups. Consistency drives conversions'
    });
  }

  if (metrics.completedVisits === 0 && metrics.connectedCalls > 5) {
    tips.push({
      type: 'info',
      icon: MapPin,
      title: 'Site Visit Opportunity',
      suggestion: 'Push for site visits with interested leads. Visits increase booking probability by 60%'
    });
  }

  if (metrics.score >= 80) {
    tips.push({
      type: 'success',
      icon: Award,
      title: 'Top Performer!',
      suggestion: 'Excellent work! Share your strategies with the team in next meeting'
    });
  }

  return tips;
};

// Team health indicators
const calculateTeamHealth = (employees) => {
  const totalScore = employees.reduce((sum, e) => sum + e.score, 0);
  const avgScore = employees.length > 0 ? totalScore / employees.length : 0;

  const highPerformers = employees.filter(e => e.score >= 70).length;
  const needsAttention = employees.filter(e => e.score < 40).length;
  const avgConversion = employees.length > 0 ? employees.reduce((sum, e) => sum + e.conversionRate, 0) / employees.length : 0;
  const avgFollowUp = employees.length > 0 ? employees.reduce((sum, e) => sum + e.followUpRate, 0) / employees.length : 0;

  return {
    avgScore: Math.round(avgScore),
    highPerformers,
    needsAttention,
    avgConversion: Math.round(avgConversion),
    avgFollowUp: Math.round(avgFollowUp),
    teamSize: employees.length,
    health: avgScore >= 60 ? 'excellent' : avgScore >= 40 ? 'good' : 'needs-improvement'
  };
};

const computeEmployeeMetrics = (employee, leads, calls, siteVisits, bookings, dateRange) => {
  const { start, end } = dateRange;
  const empId = employee.id;

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
  const empTokenLeads = assignedLeads.filter(l => {
    const tokenValue = Number(l.tokenAmount || l.token_amount || 0);
    if (tokenValue <= 0) return false;
    const tokenDate = new Date(l.lastActivity || l.updatedAt || l.createdAt || Date.now());
    return isWithinInterval(tokenDate, { start, end });
  });

  const totalCalls = empCalls.length;
  const connectedCalls = empCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  ).length;
  const completedVisits = empVisits.filter(sv =>
    sv.status === 'completed' || sv.status === 'Completed'
  ).length;
  const totalBookings = empBookings.length;
  const bookingRevenue = empBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const tokenReceived = empTokenLeads.reduce((sum, l) => sum + Number(l.tokenAmount || l.token_amount || 0), 0);

  const conversionRate = connectedCalls > 0
    ? Math.round((totalBookings / connectedCalls) * 100)
    : 0;

  const leadsWithFollowUp = assignedLeads.filter(l => l.followUpDate || l.follow_up_date);
  const followedUpLeads = leadsWithFollowUp.filter(l => {
    return empCalls.some(c => c.leadId === l.id);
  });
  const followUpRate = leadsWithFollowUp.length > 0
    ? Math.round((followedUpLeads.length / leadsWithFollowUp.length) * 100)
    : 100;

  const avgResponseTime = empCalls.length > 0
    ? empCalls.reduce((sum, c) => {
        const lead = assignedLeads.find(l => l.id === c.leadId);
        if (lead?.createdAt) {
          const responseHours = differenceInDays(new Date(c.timestamp), new Date(lead.createdAt)) * 24;
          return sum + responseHours;
        }
        return sum;
      }, 0) / empCalls.length
    : 0;

  return {
    employeeId: empId,
    employeeName: employee.name,
    role: employee.role,
    totalCalls,
    connectedCalls,
    completedVisits,
    totalBookings,
    bookingRevenue,
    tokenReceived,
    conversionRate,
    followUpRate,
    assignedLeadCount: assignedLeads.length,
    avgResponseTime: Math.round(avgResponseTime),
    efficiency: 0
  };
};

const scoreEmployees = (metricsArray) => {
  if (metricsArray.length === 0) return [];

  const maxVals = {
    totalCalls: Math.max(...metricsArray.map(m => m.totalCalls), 1),
    connectedCalls: Math.max(...metricsArray.map(m => m.connectedCalls), 1),
    completedVisits: Math.max(...metricsArray.map(m => m.completedVisits), 1),
    totalBookings: Math.max(...metricsArray.map(m => m.totalBookings), 1),
    conversionRate: 100,
    followUpRate: 100,
  };

  return metricsArray.map(m => {
    const normalizedCalls = (m.totalCalls / maxVals.totalCalls) * 100;
    const normalizedConnected = (m.connectedCalls / maxVals.connectedCalls) * 100;
    const normalizedVisits = (m.completedVisits / maxVals.completedVisits) * 100;
    const normalizedBookings = (m.totalBookings / maxVals.totalBookings) * 100;
    const normalizedConversion = m.conversionRate;
    const normalizedFollowUp = m.followUpRate;

    const score = Math.round(
      normalizedCalls * WEIGHTS.totalCalls +
      normalizedConnected * WEIGHTS.connectedCalls +
      normalizedVisits * WEIGHTS.siteVisits +
      normalizedBookings * WEIGHTS.bookings +
      normalizedConversion * WEIGHTS.conversionRate +
      normalizedFollowUp * WEIGHTS.followUpRate
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

  // ═══ NEW: Risk Alerts (linked with Smart Guidance data) ═══
  const riskAlerts = useMemo(() =>
    generateRiskAlerts(employees, leads, calls, siteVisits),
    [employees, leads, calls, siteVisits]
  );

  // ═══ NEW: Workload Balance ═══
  const workloadBalance = useMemo(() =>
    analyzeWorkloadBalance(employees, leads),
    [employees, leads]
  );

  // ═══ NEW: Employee Pipeline Health ═══
  const employeePipelines = useMemo(() =>
    calculateEmployeePipelines(salesEmployees, leads),
    [salesEmployees, leads]
  );

  // ═══ NEW: Activity Feed ═══
  const activityFeed = useMemo(() =>
    generateActivityFeed(employees, calls, siteVisits, bookings, 12),
    [employees, calls, siteVisits, bookings]
  );

  // ═══ NEW: Overall Pipeline ═══
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
  }), [rankedEmployees]);

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)} K`;
    return val.toLocaleString('en-IN');
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

  // Find pipeline for a specific employee
  const getEmployeePipeline = (empId) => {
    return employeePipelines.find(p => p.employeeId === empId)?.pipeline || { hot: 0, warm: 0, cold: 0, total: 0 };
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F] flex items-center gap-2">
          <Brain className="h-7 w-7 text-purple-600" />
          Employee Intelligence AI
        </h1>
        <p className="text-gray-500">Advanced analytics, performance predictions, risk alerts & pipeline insights</p>
      </div>

      {/* ═══ RISK ALERTS BANNER (NEW) ═══ */}
      {riskAlerts.length > 0 && (
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-red-900">Risk Alerts ({riskAlerts.length})</h3>
              </div>
              <button
                onClick={() => setShowSection(s => ({ ...s, risks: !s.risks }))}
                className="text-xs text-red-600 hover:underline"
              >
                {showSection.risks ? 'Hide' : 'Show'}
              </button>
            </div>
            {showSection.risks && (
              <div className="space-y-2">
                {riskAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      alert.type === 'critical' ? 'bg-red-100 border border-red-300' : 'bg-yellow-100 border border-yellow-300'
                    }`}
                  >
                    {alert.type === 'critical' ?
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" /> :
                      <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className={`text-xs font-bold ${alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                        {alert.title}
                      </p>
                      <p className="text-[11px] text-gray-700">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Health Dashboard */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-purple-600" />
            Team Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-black ${getHealthColor(teamHealth.health)} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2`}>
                {teamHealth.avgScore}
              </div>
              <p className="text-xs font-semibold text-gray-700">Team Avg</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-green-600 mb-2">{teamHealth.highPerformers}</div>
              <p className="text-xs text-gray-500">High Performers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-red-600 mb-2">{teamHealth.needsAttention}</div>
              <p className="text-xs text-gray-500">Needs Support</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-blue-600 mb-2">{teamHealth.avgConversion}%</div>
              <p className="text-xs text-gray-500">Avg Conversion</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-600 mb-2">{teamHealth.avgFollowUp}%</div>
              <p className="text-xs text-gray-500">Follow-up Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-gray-700 mb-2">{teamHealth.teamSize}</div>
              <p className="text-xs text-gray-500">Team Size</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ OVERALL PIPELINE + WORKLOAD BALANCE (NEW) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Pipeline */}
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
              <div>
                <p className="text-2xl font-black text-red-600">{overallPipeline.hot}</p>
                <p className="text-[10px] text-gray-500">Hot Leads</p>
              </div>
              <div>
                <p className="text-2xl font-black text-yellow-600">{overallPipeline.warm}</p>
                <p className="text-[10px] text-gray-500">Warm Leads</p>
              </div>
              <div>
                <p className="text-2xl font-black text-blue-500">{overallPipeline.cold}</p>
                <p className="text-[10px] text-gray-500">Cold Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workload Balance */}
        <Card className={`border ${workloadBalance.balanced ? 'border-green-200' : 'border-orange-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Workload Balance
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
                    <div
                      className={`h-3 rounded-full transition-all ${
                        emp.status === 'overloaded' ? 'bg-red-500' :
                        emp.status === 'underloaded' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, workloadBalance.avgLeads > 0 ? (emp.leadCount / (workloadBalance.avgLeads * 2)) * 100 : 0)}%` }}
                    />
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
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">Performance Score</p>
                    <Badge className="bg-green-100 text-green-700 text-[10px]">
                      {topPerformer.efficiency}% Efficiency
                    </Badge>
                    {/* Pipeline mini-bar */}
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
                    <p className="text-[10px] text-gray-400 mb-2">Score</p>
                    <Badge className="bg-blue-100 text-blue-700 text-[9px]">
                      {secondPlace.efficiency}% Efficiency
                    </Badge>
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
                    <p className="text-[10px] text-gray-400 capitalize mb-2">{thirdPlace.role?.replace('_', ' ')}</p>
                    <div className="text-2xl font-bold text-amber-700">{thirdPlace.score}</div>
                    <p className="text-[10px] text-gray-400 mb-2">Score</p>
                    <Badge className="bg-amber-100 text-amber-700 text-[9px]">
                      {thirdPlace.efficiency}% Efficiency
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Team Totals */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <IndianRupee className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#0F3A5F]">{formatCurrency(totals.tokens)}</p>
                  <p className="text-xs text-gray-400">Token Received</p>
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

          {/* ═══ LIVE ACTIVITY FEED (NEW) ═══ */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Recent Team Activity
                </CardTitle>
                <button
                  onClick={() => setShowSection(s => ({ ...s, activity: !s.activity }))}
                  className="text-xs text-blue-600 hover:underline"
                >
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

          {/* Full Leaderboard with Coaching + Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Performance Leaderboard with AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankedEmployees.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No employee activity found for this period</p>
              ) : (
                <div className="space-y-4">
                  {rankedEmployees.map((emp, idx) => {
                    const empPipeline = getEmployeePipeline(emp.employeeId);
                    return (
                      <Card
                        key={emp.employeeId}
                        className={`cursor-pointer hover:shadow-lg transition ${
                          idx < 3 ? 'border-l-4 border-l-purple-500' : ''
                        }`}
                        onClick={() => setSelectedEmployee(selectedEmployee?.employeeId === emp.employeeId ? null : emp)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="text-center">{getRankIcon(idx)}</div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-[#0F3A5F]">{emp.employeeName}</h3>
                                  <Badge className={`${getScoreColor(emp.score)} font-bold text-xs`}>{emp.score}</Badge>
                                </div>
                                <p className="text-xs text-gray-400 capitalize">{emp.role?.replace('_', ' ')} | {emp.assignedLeadCount} leads</p>
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                  <span>📞 {emp.totalCalls} calls</span>
                                  <span>✅ {emp.connectedCalls} connected</span>
                                  <span>🏗️ {emp.completedVisits} visits</span>
                                  <span>🎯 {emp.totalBookings} bookings</span>
                                  <span className="text-green-600 font-medium">{emp.conversionRate}% conv</span>
                                </div>
                                {/* Pipeline mini-bar for each employee */}
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
                            <div className="text-right">
                              <Badge className="bg-purple-100 text-purple-700 text-xs mb-1">
                                {emp.efficiency}% Efficiency
                              </Badge>
                              {emp.coachingTips.length > 0 && (
                                <p className="text-[10px] text-purple-600 flex items-center gap-1 justify-end">
                                  <Lightbulb className="h-3 w-3" />
                                  {emp.coachingTips.length} insights
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Expanded Coaching Section */}
                          {selectedEmployee?.employeeId === emp.employeeId && emp.coachingTips.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="h-4 w-4 text-purple-600" />
                                <h4 className="font-bold text-purple-900 text-sm">AI Coaching Recommendations</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {emp.coachingTips.map((tip, i) => (
                                  <div
                                    key={i}
                                    className={`p-3 rounded-lg border ${
                                      tip.type === 'critical' ? 'bg-red-50 border-red-200' :
                                      tip.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                      tip.type === 'success' ? 'bg-green-50 border-green-200' :
                                      'bg-blue-50 border-blue-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {React.createElement(tip.icon, {
                                        className: `h-4 w-4 shrink-0 ${
                                          tip.type === 'critical' ? 'text-red-600' :
                                          tip.type === 'warning' ? 'text-yellow-600' :
                                          tip.type === 'success' ? 'text-green-600' :
                                          'text-blue-600'
                                        }`
                                      })}
                                      <div>
                                        <p className={`text-xs font-bold ${
                                          tip.type === 'critical' ? 'text-red-700' :
                                          tip.type === 'warning' ? 'text-yellow-700' :
                                          tip.type === 'success' ? 'text-green-700' :
                                          'text-blue-700'
                                        }`}>{tip.title}</p>
                                        <p className="text-[11px] text-gray-600 mt-0.5">{tip.suggestion}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeIntelligence;
