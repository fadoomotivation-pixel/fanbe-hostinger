
export const calculateScore = (lead) => {
  let score = 0;

  if (!lead) return 0;

  // Engagement Score
  // Assuming activityLog structure: [{ action: 'Call', timestamp: ... }, ...]
  const activities = lead.activityLog || [];
  const calls = activities.filter(a => a.action === 'Call').length;
  const messages = activities.filter(a => a.action === 'Message' || a.action === 'WhatsApp').length;
  const visits = activities.filter(a => a.action.includes('Site Visit')).length;

  score += calls * 5;
  score += messages * 3;
  score += visits * 10;

  // Budget Score
  // Assuming budget is a number or string like "500000"
  const budget = parseInt(lead.budget || 0);
  if (budget >= 2000000) score += 20; // High budget (e.g. > 20L)
  else if (budget >= 1000000) score += 10; // Medium budget
  else if (budget > 0) score += 5; // Low budget

  // Timeline Score (Mock logic as timeline field might vary)
  // Assuming a 'timeline' field exists: 'Immediate', '1-3 Months', 'Later'
  const timeline = (lead.timeline || '').toLowerCase();
  if (timeline.includes('immediate') || timeline.includes('urgent')) score += 15;
  else if (timeline.includes('month') || timeline.includes('soon')) score += 10;
  else score += 5;

  // Preference Score
  if (lead.project && lead.project !== 'General Inquiry') score += 10;
  else score += 5;

  // Cap score at 100
  return Math.min(score, 100);
};

export const getScoreBadge = (score) => {
  if (score >= 70) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
};

export const getScoreColor = (score) => {
  if (score >= 70) return 'bg-red-100 text-red-800 border-red-200'; // Hot
  if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'; // Warm
  return 'bg-blue-100 text-blue-800 border-blue-200'; // Cold
};

export const getProgressBarColor = (score) => {
  if (score >= 70) return 'bg-red-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-blue-500';
};
