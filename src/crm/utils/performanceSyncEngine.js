// src/crm/utils/performanceSyncEngine.js
// Shared Performance Sync Engine - Links Smart Guidance & Employee Intelligence
// This engine provides unified scoring, streak tracking, and pipeline analytics
// used by BOTH employee-facing and admin-facing pages.

import { differenceInDays, differenceInHours, isToday, startOfDay, subDays, format } from 'date-fns';

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE PERFORMANCE CALCULATOR (used by Smart Guidance "My Performance")
// ════════════════════════════════════════════════════════════════════════════

export const calculateMyPerformance = (userId, employees, leads, calls, siteVisits, bookings) => {
  if (!userId || !employees?.length) return null;

  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  // Calculate metrics for all employees to determine rank
  const allMetrics = salesEmployees.map(emp => {
    const empId = emp.id;
    const empCalls = calls.filter(c =>
      c.employeeId === empId && new Date(c.timestamp) >= weekStart
    );
    const empVisits = siteVisits.filter(sv =>
      sv.employeeId === empId && new Date(sv.timestamp) >= weekStart
    );
    const empBookings = bookings.filter(b =>
      b.employeeId === empId && new Date(b.timestamp) >= weekStart
    );

    const totalCalls = empCalls.length;
    const connectedCalls = empCalls.filter(c =>
      c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
    ).length;
    const completedVisits = empVisits.filter(sv =>
      sv.status === 'completed' || sv.status === 'Completed'
    ).length;
    const totalBookings = empBookings.length;
    const assignedLeads = leads.filter(l => l.assignedTo === empId || l.assigned_to === empId);

    // Simple score
    const score = totalCalls * 2 + connectedCalls * 5 + completedVisits * 15 + totalBookings * 30;

    return { empId, totalCalls, connectedCalls, completedVisits, totalBookings, score, assignedLeadCount: assignedLeads.length };
  });

  allMetrics.sort((a, b) => b.score - a.score);
  const myIndex = allMetrics.findIndex(m => m.empId === userId);
  const myMetrics = allMetrics[myIndex] || allMetrics[0];

  if (!myMetrics) return null;

  // Today's activity
  const todayStart = startOfDay(today);
  const todayCalls = calls.filter(c => c.employeeId === userId && new Date(c.timestamp) >= todayStart);
  const todayConnected = todayCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  );

  return {
    rank: myIndex + 1,
    totalEmployees: allMetrics.length,
    weeklyScore: myMetrics.score,
    weeklyCalls: myMetrics.totalCalls,
    weeklyConnected: myMetrics.connectedCalls,
    weeklyVisits: myMetrics.completedVisits,
    weeklyBookings: myMetrics.totalBookings,
    todayCalls: todayCalls.length,
    todayConnected: todayConnected.length,
    dailyCallTarget: 15,
    dailyCallProgress: Math.min(100, Math.round((todayCalls.length / 15) * 100)),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// LEAD MOMENTUM CALCULATOR
// ════════════════════════════════════════════════════════════════════════════

export const calculateLeadMomentum = (lead, calls) => {
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const now = new Date();

  if (leadCalls.length === 0) {
    const daysSinceCreated = lead.createdAt ? differenceInDays(now, new Date(lead.createdAt)) : 999;
    if (daysSinceCreated <= 1) return { status: 'new', label: 'New Lead', color: 'blue', urgency: 80 };
    if (daysSinceCreated <= 3) return { status: 'cooling', label: 'Not Contacted (3d)', color: 'orange', urgency: 90 };
    return { status: 'cold', label: `No Contact (${daysSinceCreated}d)`, color: 'red', urgency: 100 };
  }

  const lastCallTime = new Date(leadCalls[leadCalls.length - 1]?.timestamp || leadCalls[0]?.timestamp);
  const hoursSince = differenceInHours(now, lastCallTime);
  const daysSince = differenceInDays(now, lastCallTime);

  const connectedCalls = leadCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  );

  if (connectedCalls.length > 0 && daysSince <= 2) {
    return { status: 'hot', label: 'Active & Engaged', color: 'green', urgency: 20 };
  }
  if (daysSince <= 1) {
    return { status: 'warm', label: 'Recently Contacted', color: 'green', urgency: 30 };
  }
  if (daysSince <= 3) {
    return { status: 'cooling', label: `${daysSince}d since contact`, color: 'yellow', urgency: 60 };
  }
  if (daysSince <= 7) {
    return { status: 'going-cold', label: `${daysSince}d - Going Cold`, color: 'orange', urgency: 80 };
  }
  return { status: 'cold', label: `${daysSince}d - Gone Cold`, color: 'red', urgency: 95 };
};

// ════════════════════════════════════════════════════════════════════════════
// PIPELINE ANALYTICS (used by both pages)
// ════════════════════════════════════════════════════════════════════════════

export const calculatePipelineHealth = (leads) => {
  if (!leads?.length) return { hot: 0, warm: 0, cold: 0, total: 0, hotPercent: 0, warmPercent: 0, coldPercent: 0 };

  const activeLeads = leads.filter(l => l.status !== 'Booked' && l.status !== 'Lost');
  const hot = activeLeads.filter(l => (l.interestLevel || l.interest_level) === 'Hot').length;
  const warm = activeLeads.filter(l => (l.interestLevel || l.interest_level) === 'Warm').length;
  const cold = activeLeads.filter(l => (l.interestLevel || l.interest_level) === 'Cold' || !(l.interestLevel || l.interest_level)).length;
  const total = activeLeads.length;

  return {
    hot, warm, cold, total,
    hotPercent: total > 0 ? Math.round((hot / total) * 100) : 0,
    warmPercent: total > 0 ? Math.round((warm / total) * 100) : 0,
    coldPercent: total > 0 ? Math.round((cold / total) * 100) : 0,
  };
};

// Per-employee pipeline for Employee Intelligence
export const calculateEmployeePipelines = (employees, leads) => {
  return employees.map(emp => {
    const empLeads = leads.filter(l => l.assignedTo === emp.id || l.assigned_to === emp.id);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      pipeline: calculatePipelineHealth(empLeads),
    };
  });
};

// ════════════════════════════════════════════════════════════════════════════
// WORKLOAD BALANCE ANALYZER
// ════════════════════════════════════════════════════════════════════════════

export const analyzeWorkloadBalance = (employees, leads) => {
  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  if (salesEmployees.length === 0) return { balanced: true, employees: [], avgLeads: 0, stdDev: 0 };

  const distribution = salesEmployees.map(emp => {
    const empLeads = leads.filter(l =>
      (l.assignedTo === emp.id || l.assigned_to === emp.id) &&
      l.status !== 'Booked' && l.status !== 'Lost'
    );
    return { id: emp.id, name: emp.name, leadCount: empLeads.length };
  });

  const avgLeads = distribution.reduce((s, d) => s + d.leadCount, 0) / distribution.length;
  const variance = distribution.reduce((s, d) => s + Math.pow(d.leadCount - avgLeads, 2), 0) / distribution.length;
  const stdDev = Math.sqrt(variance);

  // Flag employees with significantly more or fewer leads
  const flagged = distribution.map(d => ({
    ...d,
    status: d.leadCount > avgLeads + stdDev ? 'overloaded' :
            d.leadCount < avgLeads - stdDev ? 'underloaded' : 'balanced',
    deviation: Math.round(((d.leadCount - avgLeads) / (avgLeads || 1)) * 100),
  }));

  return {
    balanced: stdDev <= avgLeads * 0.3,
    employees: flagged,
    avgLeads: Math.round(avgLeads),
    stdDev: Math.round(stdDev),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// RISK ALERT GENERATOR (for Employee Intelligence)
// ════════════════════════════════════════════════════════════════════════════

export const generateRiskAlerts = (employees, leads, calls, siteVisits) => {
  const alerts = [];
  const today = new Date();
  const threeDaysAgo = subDays(today, 3);

  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  salesEmployees.forEach(emp => {
    const empLeads = leads.filter(l =>
      (l.assignedTo === emp.id || l.assigned_to === emp.id) &&
      l.status !== 'Booked' && l.status !== 'Lost'
    );
    const empCalls = calls.filter(c => c.employeeId === emp.id);
    const recentCalls = empCalls.filter(c => new Date(c.timestamp) >= threeDaysAgo);

    // No activity in 3 days
    if (recentCalls.length === 0 && empLeads.length > 0) {
      alerts.push({
        type: 'critical',
        employeeId: emp.id,
        employeeName: emp.name,
        title: 'No Activity (3+ Days)',
        message: `${emp.name} has ${empLeads.length} leads but no calls in 3 days`,
        icon: 'AlertTriangle',
      });
    }

    // Hot leads going uncontacted
    const hotLeads = empLeads.filter(l => (l.interestLevel || l.interest_level) === 'Hot');
    const uncontactedHot = hotLeads.filter(l => {
      return !empCalls.some(c => c.leadId === l.id && new Date(c.timestamp) >= threeDaysAgo);
    });
    if (uncontactedHot.length > 0) {
      alerts.push({
        type: 'warning',
        employeeId: emp.id,
        employeeName: emp.name,
        title: 'Hot Leads Neglected',
        message: `${emp.name} has ${uncontactedHot.length} hot leads without recent contact`,
        icon: 'Flame',
      });
    }

    // Overdue follow-ups
    const overdueFollowUps = empLeads.filter(l => {
      const fDate = l.followUpDate || l.follow_up_date;
      if (!fDate) return false;
      try {
        const d = new Date(fDate);
        return d < startOfDay(today) && l.status !== 'Booked';
      } catch { return false; }
    });
    if (overdueFollowUps.length >= 3) {
      alerts.push({
        type: 'warning',
        employeeId: emp.id,
        employeeName: emp.name,
        title: 'Multiple Overdue Follow-ups',
        message: `${emp.name} has ${overdueFollowUps.length} overdue follow-ups`,
        icon: 'Clock',
      });
    }
  });

  // Sort: critical first
  alerts.sort((a, b) => (a.type === 'critical' ? -1 : 1) - (b.type === 'critical' ? -1 : 1));
  return alerts;
};

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITY FEED GENERATOR (for Employee Intelligence)
// ════════════════════════════════════════════════════════════════════════════

export const generateActivityFeed = (employees, calls, siteVisits, bookings, limit = 15) => {
  const empMap = {};
  employees.forEach(e => { empMap[e.id] = e.name; });

  const activities = [];

  calls.forEach(c => {
    activities.push({
      type: 'call',
      employeeName: empMap[c.employeeId] || 'Unknown',
      employeeId: c.employeeId,
      detail: `Called ${c.leadName || 'a lead'} - ${c.status}`,
      timestamp: c.timestamp,
      icon: 'Phone',
      color: c.status === 'Connected' || c.status === 'connected' ? 'green' : 'blue',
    });
  });

  siteVisits.forEach(sv => {
    activities.push({
      type: 'visit',
      employeeName: empMap[sv.employeeId] || 'Unknown',
      employeeId: sv.employeeId,
      detail: `Site visit with ${sv.leadName || 'a lead'} - ${sv.status}`,
      timestamp: sv.timestamp,
      icon: 'MapPin',
      color: 'purple',
    });
  });

  bookings.forEach(b => {
    activities.push({
      type: 'booking',
      employeeName: empMap[b.employeeId] || 'Unknown',
      employeeId: b.employeeId,
      detail: `Booking: ${b.leadName || 'Lead'} - ${b.projectName || ''} (${b.amount ? '₹' + Number(b.amount).toLocaleString('en-IN') : ''})`,
      timestamp: b.timestamp,
      icon: 'Target',
      color: 'green',
    });
  });

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return activities.slice(0, limit);
};

// ════════════════════════════════════════════════════════════════════════════
// OBJECTION HANDLER GENERATOR (for Smart Guidance)
// ════════════════════════════════════════════════════════════════════════════

export const generateObjectionHandlers = (lead, calls) => {
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const lastCall = leadCalls[leadCalls.length - 1];
  const interest = lead.interestLevel || lead.interest_level || 'Cold';
  const handlers = [];

  // Budget objection
  if (!lead.budget || parseInt(lead.budget) === 0) {
    handlers.push({
      objection: '"It\'s too expensive"',
      response: 'I understand budget is a concern. Let me show you our flexible payment plans - many buyers start with just a 10% down payment. Plus, property values in this area have grown 15-20% annually.',
      type: 'budget',
    });
  }

  // Timing objection
  if (lastCall?.status === 'Busy' || lastCall?.status === 'Not Answered') {
    handlers.push({
      objection: '"Not the right time"',
      response: 'Completely understand! When would be more convenient? I\'d love just 3 minutes to share an exclusive offer that expires this week.',
      type: 'timing',
    });
  }

  // Competition objection
  if (interest === 'Warm') {
    handlers.push({
      objection: '"Looking at other options"',
      response: 'That\'s smart! Comparing is important. What I can share is our unique advantages - [location/amenities/price]. Many buyers who compared chose us. Would a quick site visit help you decide?',
      type: 'competition',
    });
  }

  // Trust objection for cold leads
  if (interest === 'Cold') {
    handlers.push({
      objection: '"Not interested right now"',
      response: 'I respect that. Just so you know, we have some limited-period offers. Can I send you a quick WhatsApp with details? No pressure at all - just so you have the info when you\'re ready.',
      type: 'trust',
    });
  }

  // Site visit hesitation
  const hasVisit = leadCalls.some(c => c.notes?.toLowerCase()?.includes('visit'));
  if (!hasVisit && interest !== 'Cold') {
    handlers.push({
      objection: '"I\'ll visit later"',
      response: 'We have a special this weekend - free pickup and drop for site visits, plus complimentary lunch. Many undecided buyers made their decision after seeing the project in person!',
      type: 'visit',
    });
  }

  return handlers;
};
