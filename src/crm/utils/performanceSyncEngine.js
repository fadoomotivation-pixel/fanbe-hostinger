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

// ════════════════════════════════════════════════════════════════════════════
// MORNING BRIEFING GENERATOR (for Smart Guidance)
// ════════════════════════════════════════════════════════════════════════════

export const generateMorningBriefing = (userId, leads, calls, siteVisits, bookings) => {
  const today = new Date();
  const todayStart = startOfDay(today);

  const myLeads = leads.filter(l =>
    (l.assignedTo === userId || l.assigned_to === userId) &&
    l.status !== 'Booked' && l.status !== 'Lost'
  );

  // Today's follow-ups
  const todayFollowUps = myLeads.filter(l => {
    const fDate = l.followUpDate || l.follow_up_date;
    if (!fDate) return false;
    try {
      const d = new Date(fDate);
      return isToday(d) || d < todayStart;
    } catch { return false; }
  });

  // Overdue follow-ups (before today)
  const overdueCount = todayFollowUps.filter(l => {
    const fDate = l.followUpDate || l.follow_up_date;
    try { return new Date(fDate) < todayStart; } catch { return false; }
  }).length;

  // Hot leads needing attention
  const hotLeads = myLeads.filter(l => (l.interestLevel || l.interest_level) === 'Hot');
  const uncontactedHot = hotLeads.filter(l => {
    const leadCalls = calls.filter(c => c.leadId === l.id);
    if (leadCalls.length === 0) return true;
    const lastCall = leadCalls[leadCalls.length - 1];
    return differenceInDays(today, new Date(lastCall.timestamp)) >= 2;
  });

  // New leads (assigned in last 24 hours)
  const newLeads = myLeads.filter(l => {
    if (!l.createdAt) return false;
    return differenceInHours(today, new Date(l.createdAt)) <= 24;
  });

  // Yesterday's performance
  const yesterday = subDays(today, 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayCalls = calls.filter(c =>
    c.employeeId === userId &&
    new Date(c.timestamp) >= yesterdayStart &&
    new Date(c.timestamp) < todayStart
  );
  const yesterdayConnected = yesterdayCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  );

  // Build action items
  const actions = [];
  if (overdueCount > 0) {
    actions.push({ priority: 'critical', text: `${overdueCount} overdue follow-ups need immediate attention`, icon: 'AlertTriangle' });
  }
  if (uncontactedHot.length > 0) {
    actions.push({ priority: 'high', text: `${uncontactedHot.length} hot leads waiting for your call`, icon: 'Flame' });
  }
  if (newLeads.length > 0) {
    actions.push({ priority: 'medium', text: `${newLeads.length} new leads assigned to you`, icon: 'Sparkles' });
  }
  if (todayFollowUps.length > 0) {
    actions.push({ priority: 'medium', text: `${todayFollowUps.length} follow-ups scheduled for today`, icon: 'Calendar' });
  }
  if (actions.length === 0) {
    actions.push({ priority: 'info', text: 'No urgent tasks. Focus on calling cold leads to warm them up!', icon: 'ThumbsUp' });
  }

  return {
    greeting: getTimeGreeting(),
    totalLeads: myLeads.length,
    todayFollowUps: todayFollowUps.length,
    overdueCount,
    hotLeadsCount: hotLeads.length,
    uncontactedHot: uncontactedHot.length,
    newLeads: newLeads.length,
    yesterdayCalls: yesterdayCalls.length,
    yesterdayConnected: yesterdayConnected.length,
    actions,
  };
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ════════════════════════════════════════════════════════════════════════════
// SMART AUTO FOLLOW-UP SUGGESTER
// ════════════════════════════════════════════════════════════════════════════

export const suggestNextFollowUp = (lead, calls) => {
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const lastCall = leadCalls[leadCalls.length - 1];
  const interest = lead.interestLevel || lead.interest_level || 'Cold';
  const now = new Date();

  if (!lastCall) {
    return { days: 0, reason: 'Call today - not yet contacted', urgency: 'critical' };
  }

  const status = lastCall.status?.toLowerCase() || '';

  if (status === 'connected' || status === 'interested') {
    if (interest === 'Hot') return { days: 1, reason: 'Hot & engaged - follow up tomorrow', urgency: 'high' };
    if (interest === 'Warm') return { days: 2, reason: 'Warm lead - follow up in 2 days', urgency: 'medium' };
    return { days: 3, reason: 'Connected - follow up in 3 days', urgency: 'medium' };
  }

  if (status === 'busy') return { days: 0, reason: 'Was busy - try again later today', urgency: 'high' };
  if (status === 'not answered' || status === 'not connected') return { days: 1, reason: 'No answer - retry tomorrow', urgency: 'medium' };
  if (status === 'voicemail') return { days: 2, reason: 'Left voicemail - follow up in 2 days', urgency: 'low' };

  return { days: 2, reason: 'Standard follow-up in 2 days', urgency: 'medium' };
};

// ════════════════════════════════════════════════════════════════════════════
// DAILY STREAK & GAMIFICATION TRACKER
// ════════════════════════════════════════════════════════════════════════════

export const calculateStreak = (userId, calls, dailyTarget = 15) => {
  const today = new Date();
  let streak = 0;
  let bestStreak = 0;
  let currentStreak = 0;

  // Check last 30 days
  for (let i = 0; i < 30; i++) {
    const day = subDays(today, i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Skip weekends (optional - uncomment if needed)
    // if (day.getDay() === 0 || day.getDay() === 6) continue;

    const dayCalls = calls.filter(c =>
      c.employeeId === userId &&
      new Date(c.timestamp) >= dayStart &&
      new Date(c.timestamp) < dayEnd
    );

    if (dayCalls.length >= dailyTarget) {
      currentStreak++;
      if (i === streak) streak = currentStreak; // Only count consecutive from today
    } else if (i === 0 && isToday(day)) {
      // Today hasn't ended yet - don't break streak
      continue;
    } else {
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      if (i <= streak + 1) streak = currentStreak;
      currentStreak = 0;
    }
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;

  // Badges earned
  const badges = [];
  const totalCallsEver = calls.filter(c => c.employeeId === userId).length;
  const totalConnected = calls.filter(c =>
    c.employeeId === userId &&
    (c.status === 'Connected' || c.status === 'connected' || c.status === 'interested')
  ).length;

  if (streak >= 7) badges.push({ name: 'Week Warrior', icon: 'Shield', color: 'purple' });
  if (streak >= 3) badges.push({ name: '3-Day Streak', icon: 'Flame', color: 'orange' });
  if (totalCallsEver >= 100) badges.push({ name: 'Century Caller', icon: 'Phone', color: 'blue' });
  if (totalCallsEver >= 500) badges.push({ name: '500 Club', icon: 'Crown', color: 'gold' });
  if (totalConnected >= 50) badges.push({ name: 'Connector', icon: 'Zap', color: 'green' });
  if (bestStreak >= 10) badges.push({ name: 'Unstoppable', icon: 'Trophy', color: 'yellow' });

  return {
    currentStreak: streak,
    bestStreak,
    totalCalls: totalCallsEver,
    totalConnected,
    badges,
    dailyTarget,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// QUICK WINS IDENTIFIER (for Smart Guidance)
// ════════════════════════════════════════════════════════════════════════════

export const identifyQuickWins = (leads, calls) => {
  const now = new Date();

  return leads
    .filter(l => l.status !== 'Booked' && l.status !== 'Lost')
    .map(lead => {
      const interest = lead.interestLevel || lead.interest_level || 'Cold';
      const leadCalls = calls.filter(c => c.leadId === lead.id);
      const connectedCalls = leadCalls.filter(c =>
        c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
      );
      const hasBudget = lead.budget && parseInt(lead.budget) > 0;
      const daysSinceCreated = lead.createdAt ? differenceInDays(now, new Date(lead.createdAt)) : 999;

      let winScore = 0;
      let reasons = [];

      if (interest === 'Hot') { winScore += 40; reasons.push('Hot interest'); }
      if (hasBudget) { winScore += 25; reasons.push('Budget confirmed'); }
      if (connectedCalls.length >= 2) { winScore += 20; reasons.push('Multiple connections'); }
      if (daysSinceCreated <= 7) { winScore += 15; reasons.push('Fresh lead'); }

      // Check site visit status
      if (lead.siteVisitStatus === 'completed' || lead.siteVisitStatus === 'Completed') {
        winScore += 30;
        reasons.push('Site visit done');
      }

      return { ...lead, winScore, winReasons: reasons };
    })
    .filter(l => l.winScore >= 50)
    .sort((a, b) => b.winScore - a.winScore)
    .slice(0, 5);
};

// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE TRENDS (for Employee Intelligence)
// ════════════════════════════════════════════════════════════════════════════

export const calculatePerformanceTrends = (employees, calls, siteVisits, bookings) => {
  const now = new Date();
  const thisWeekStart = startOfDay(subDays(now, 7));
  const lastWeekStart = startOfDay(subDays(now, 14));

  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  return salesEmployees.map(emp => {
    const empId = emp.id;

    const thisWeekCalls = calls.filter(c =>
      c.employeeId === empId && new Date(c.timestamp) >= thisWeekStart
    ).length;
    const lastWeekCalls = calls.filter(c =>
      c.employeeId === empId &&
      new Date(c.timestamp) >= lastWeekStart &&
      new Date(c.timestamp) < thisWeekStart
    ).length;

    const thisWeekVisits = siteVisits.filter(sv =>
      sv.employeeId === empId && new Date(sv.timestamp) >= thisWeekStart
    ).length;
    const lastWeekVisits = siteVisits.filter(sv =>
      sv.employeeId === empId &&
      new Date(sv.timestamp) >= lastWeekStart &&
      new Date(sv.timestamp) < thisWeekStart
    ).length;

    const thisWeekBookings = bookings.filter(b =>
      b.employeeId === empId && new Date(b.timestamp) >= thisWeekStart
    ).length;
    const lastWeekBookings = bookings.filter(b =>
      b.employeeId === empId &&
      new Date(b.timestamp) >= lastWeekStart &&
      new Date(b.timestamp) < thisWeekStart
    ).length;

    const calcTrend = (current, previous) => {
      if (previous === 0 && current === 0) return { direction: 'flat', change: 0 };
      if (previous === 0) return { direction: 'up', change: 100 };
      const change = Math.round(((current - previous) / previous) * 100);
      return {
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
        change: Math.abs(change),
      };
    };

    return {
      employeeId: empId,
      employeeName: emp.name,
      calls: { current: thisWeekCalls, previous: lastWeekCalls, trend: calcTrend(thisWeekCalls, lastWeekCalls) },
      visits: { current: thisWeekVisits, previous: lastWeekVisits, trend: calcTrend(thisWeekVisits, lastWeekVisits) },
      bookings: { current: thisWeekBookings, previous: lastWeekBookings, trend: calcTrend(thisWeekBookings, lastWeekBookings) },
      overallTrend: calcTrend(
        thisWeekCalls + thisWeekVisits * 5 + thisWeekBookings * 10,
        lastWeekCalls + lastWeekVisits * 5 + lastWeekBookings * 10
      ),
    };
  });
};

// ════════════════════════════════════════════════════════════════════════════
// SMART LEAD REDISTRIBUTION (for Employee Intelligence - Admin)
// ════════════════════════════════════════════════════════════════════════════

export const suggestLeadRedistribution = (employees, leads, calls) => {
  const now = new Date();
  const salesEmployees = employees.filter(e =>
    e.role === 'sales_executive' || e.role === 'telecaller' || e.role === 'manager'
  );

  if (salesEmployees.length < 2) return [];

  const suggestions = [];

  // Find neglected leads (no contact in 5+ days, not Booked/Lost)
  const neglectedLeads = leads.filter(l => {
    if (l.status === 'Booked' || l.status === 'Lost') return false;
    const assignedTo = l.assignedTo || l.assigned_to;
    if (!assignedTo) return false;

    const leadCalls = calls.filter(c => c.leadId === l.id);
    if (leadCalls.length === 0) {
      const daysSince = l.createdAt ? differenceInDays(now, new Date(l.createdAt)) : 999;
      return daysSince >= 5;
    }

    const lastCall = leadCalls[leadCalls.length - 1];
    return differenceInDays(now, new Date(lastCall.timestamp)) >= 5;
  });

  // Find employees with capacity (fewer leads, higher performance)
  const empActivity = salesEmployees.map(emp => {
    const empLeads = leads.filter(l =>
      (l.assignedTo === emp.id || l.assigned_to === emp.id) &&
      l.status !== 'Booked' && l.status !== 'Lost'
    );
    const recentCalls = calls.filter(c =>
      c.employeeId === emp.id &&
      differenceInDays(now, new Date(c.timestamp)) <= 7
    );
    return {
      id: emp.id,
      name: emp.name,
      leadCount: empLeads.length,
      recentCallCount: recentCalls.length,
      isActive: recentCalls.length > 0,
    };
  });

  const avgLeads = empActivity.reduce((s, e) => s + e.leadCount, 0) / empActivity.length;

  neglectedLeads.forEach(lead => {
    const currentOwner = empActivity.find(e => e.id === (lead.assignedTo || lead.assigned_to));
    if (!currentOwner) return;

    // Find best candidate: active + below average lead count
    const candidates = empActivity
      .filter(e => e.id !== currentOwner.id && e.isActive && e.leadCount < avgLeads + 5)
      .sort((a, b) => a.leadCount - b.leadCount);

    if (candidates.length > 0) {
      const interest = lead.interestLevel || lead.interest_level || 'Cold';
      suggestions.push({
        leadId: lead.id,
        leadName: lead.name || 'Unknown',
        interest,
        currentOwner: currentOwner.name,
        currentOwnerId: currentOwner.id,
        suggestedOwner: candidates[0].name,
        suggestedOwnerId: candidates[0].id,
        reason: `No contact in 5+ days. ${candidates[0].name} has capacity (${candidates[0].leadCount} leads, ${candidates[0].recentCallCount} recent calls)`,
        daysSinceContact: (() => {
          const leadCalls = calls.filter(c => c.leadId === lead.id);
          if (leadCalls.length === 0) return lead.createdAt ? differenceInDays(now, new Date(lead.createdAt)) : 999;
          return differenceInDays(now, new Date(leadCalls[leadCalls.length - 1].timestamp));
        })(),
      });
    }
  });

  return suggestions.sort((a, b) => {
    const interestOrder = { Hot: 0, Warm: 1, Cold: 2 };
    return (interestOrder[a.interest] || 2) - (interestOrder[b.interest] || 2);
  }).slice(0, 10);
};

// ════════════════════════════════════════════════════════════════════════════
// WIN/LOSS INSIGHTS (for Employee Intelligence)
// ════════════════════════════════════════════════════════════════════════════

export const analyzeWinLossInsights = (leads, calls, bookings) => {
  const bookedLeads = leads.filter(l => l.status === 'Booked');
  const lostLeads = leads.filter(l => l.status === 'Lost');

  // Win analysis
  const winPatterns = {
    avgCallsToBook: 0,
    commonSources: {},
    commonInterest: {},
    avgDaysToClose: 0,
    totalRevenue: 0,
  };

  bookedLeads.forEach(lead => {
    const leadCalls = calls.filter(c => c.leadId === lead.id);
    winPatterns.avgCallsToBook += leadCalls.length;

    const source = lead.source || 'Unknown';
    winPatterns.commonSources[source] = (winPatterns.commonSources[source] || 0) + 1;

    const interest = lead.interestLevel || lead.interest_level || 'Unknown';
    winPatterns.commonInterest[interest] = (winPatterns.commonInterest[interest] || 0) + 1;

    if (lead.createdAt) {
      const booking = bookings.find(b => b.leadId === lead.id);
      if (booking?.timestamp) {
        winPatterns.avgDaysToClose += differenceInDays(new Date(booking.timestamp), new Date(lead.createdAt));
      }
    }

    winPatterns.totalRevenue += Number(lead.bookingAmount || lead.tokenAmount || 0);
  });

  if (bookedLeads.length > 0) {
    winPatterns.avgCallsToBook = Math.round(winPatterns.avgCallsToBook / bookedLeads.length);
    winPatterns.avgDaysToClose = Math.round(winPatterns.avgDaysToClose / bookedLeads.length);
  }

  // Loss analysis
  const lossPatterns = {
    count: lostLeads.length,
    commonSources: {},
    avgCallsBeforeLoss: 0,
  };

  lostLeads.forEach(lead => {
    const leadCalls = calls.filter(c => c.leadId === lead.id);
    lossPatterns.avgCallsBeforeLoss += leadCalls.length;

    const source = lead.source || 'Unknown';
    lossPatterns.commonSources[source] = (lossPatterns.commonSources[source] || 0) + 1;
  });

  if (lostLeads.length > 0) {
    lossPatterns.avgCallsBeforeLoss = Math.round(lossPatterns.avgCallsBeforeLoss / lostLeads.length);
  }

  // Top source by wins
  const topWinSource = Object.entries(winPatterns.commonSources)
    .sort((a, b) => b[1] - a[1])[0];

  // Conversion rate
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads.length / totalLeads) * 100) : 0;

  // Key insights
  const insights = [];
  if (winPatterns.avgCallsToBook > 0) {
    insights.push(`Average ${winPatterns.avgCallsToBook} calls needed to close a deal`);
  }
  if (winPatterns.avgDaysToClose > 0) {
    insights.push(`Average ${winPatterns.avgDaysToClose} days from lead creation to booking`);
  }
  if (topWinSource) {
    insights.push(`Best lead source: ${topWinSource[0]} (${topWinSource[1]} bookings)`);
  }
  if (lossPatterns.avgCallsBeforeLoss > 0 && lossPatterns.avgCallsBeforeLoss < 3) {
    insights.push(`Lost leads avg only ${lossPatterns.avgCallsBeforeLoss} calls - try more persistence`);
  }

  return {
    wins: { count: bookedLeads.length, ...winPatterns },
    losses: lossPatterns,
    conversionRate,
    insights,
    topWinSource: topWinSource ? { source: topWinSource[0], count: topWinSource[1] } : null,
  };
};
