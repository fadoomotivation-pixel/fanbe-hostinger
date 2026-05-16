// Lead Scoring Engine - Automatic Temperature Calculation
import { INTEREST_LEVEL } from './statusUtils';

/**
 * Calculate lead temperature based on multiple scoring factors
 * @param {Object} lead - The lead object
 * @param {Array} calls - All call logs for this lead
 * @param {Array} notes - All notes for this lead
 * @returns {Object} { temperature: string, score: number, factors: Object }
 */
export const calculateLeadTemperature = (lead, calls = [], notes = []) => {
  let score = 0;
  const factors = {
    calls: 0,
    budget: 0,
    timeline: 0,
    engagement: 0,
    recency: 0
  };

  // 1. Call Frequency Score (0-25 points)
  const leadCalls = calls.filter(c => c.leadId === lead.id || c.lead_id === lead.id);
  const callCount = leadCalls.length;
  
  if (callCount >= 5) {
    factors.calls = 25;
  } else if (callCount >= 3) {
    factors.calls = 18;
  } else if (callCount >= 1) {
    factors.calls = 10;
  }
  score += factors.calls;

  // 2. Budget Score (0-25 points)
  const budget = parseInt(lead.budget) || 0;
  
  if (budget >= 10000000) { // 1 Cr+
    factors.budget = 25;
  } else if (budget >= 5000000) { // 50L+
    factors.budget = 18;
  } else if (budget >= 2000000) { // 20L+
    factors.budget = 12;
  } else if (budget > 0) {
    factors.budget = 5;
  }
  score += factors.budget;

  // 3. Timeline Score (0-20 points)
  const timeline = lead.timeline || lead.buying_timeline || '';
  
  if (timeline.includes('Immediate') || timeline.includes('Within 1 month')) {
    factors.timeline = 20;
  } else if (timeline.includes('1-3 months') || timeline.includes('Within 3 months')) {
    factors.timeline = 15;
  } else if (timeline.includes('3-6 months')) {
    factors.timeline = 10;
  } else if (timeline.includes('6+ months') || timeline.includes('Just exploring')) {
    factors.timeline = 5;
  }
  score += factors.timeline;

  // 4. Engagement Score (0-20 points)
  const recentNotes = notes.filter(n => 
    (n.leadId === lead.id || n.lead_id === lead.id) &&
    isWithinDays(n.createdAt || n.created_at, 7)
  );
  
  const engagementKeywords = [
    'interested', 'excited', 'ready', 'visit', 'site visit',
    'documentation', 'serious', 'keen', 'confirmed', 'booking'
  ];
  
  const positiveEngagement = recentNotes.some(note =>
    engagementKeywords.some(keyword => 
      note.content?.toLowerCase().includes(keyword)
    )
  );
  
  if (positiveEngagement) {
    factors.engagement = 20;
  } else if (recentNotes.length > 0) {
    factors.engagement = 10;
  }
  score += factors.engagement;

  // 5. Recency Score (0-10 points)
  const lastActivity = getLastActivityDate(lead, calls, notes);
  const daysSinceActivity = getDaysDifference(lastActivity, new Date());
  
  if (daysSinceActivity <= 2) {
    factors.recency = 10;
  } else if (daysSinceActivity <= 7) {
    factors.recency = 7;
  } else if (daysSinceActivity <= 14) {
    factors.recency = 4;
  }
  score += factors.recency;

  // Determine temperature based on total score (0-100)
  let temperature;
  if (score >= 70) {
    temperature = INTEREST_LEVEL.HOT;
  } else if (score >= 40) {
    temperature = INTEREST_LEVEL.WARM;
  } else {
    temperature = INTEREST_LEVEL.COLD;
  }

  return {
    temperature,
    score,
    factors,
    breakdown: {
      calls: `${factors.calls}/25`,
      budget: `${factors.budget}/25`,
      timeline: `${factors.timeline}/20`,
      engagement: `${factors.engagement}/20`,
      recency: `${factors.recency}/10`
    }
  };
};

/**
 * Check if auto-calculated temperature differs from current
 */
export const hasTemperatureDrift = (lead, calls, notes) => {
  const calculated = calculateLeadTemperature(lead, calls, notes);
  const current = lead.interestLevel || lead.interest_level || INTEREST_LEVEL.WARM;
  
  return {
    hasDrift: calculated.temperature !== current,
    calculated: calculated.temperature,
    current,
    score: calculated.score,
    factors: calculated.factors,
    breakdown: calculated.breakdown
  };
};

/**
 * Get explanation for why a temperature was calculated
 */
export const getTemperatureExplanation = (factors, score) => {
  const reasons = [];
  
  if (factors.calls >= 18) reasons.push('Multiple calls made');
  if (factors.budget >= 18) reasons.push('High budget range');
  if (factors.timeline >= 15) reasons.push('Ready to buy soon');
  if (factors.engagement >= 15) reasons.push('Highly engaged');
  if (factors.recency >= 7) reasons.push('Recent activity');
  
  if (reasons.length === 0) {
    if (score < 40) {
      reasons.push('Limited engagement and follow-ups');
    } else {
      reasons.push('Moderate interest signals');
    }
  }
  
  return reasons.join(', ');
};

// Helper functions
const isWithinDays = (dateStr, days) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
};

const getLastActivityDate = (lead, calls, notes) => {
  const dates = [
    lead.updatedAt || lead.updated_at,
    lead.createdAt || lead.created_at,
    ...calls.map(c => c.createdAt || c.created_at),
    ...notes.map(n => n.createdAt || n.created_at)
  ].filter(Boolean);
  
  if (dates.length === 0) return new Date();
  
  return new Date(Math.max(...dates.map(d => new Date(d).getTime())));
};

const getDaysDifference = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Suggest optimal follow-up actions based on temperature
 */
export const getFollowUpSuggestions = (temperature, factors) => {
  if (temperature === INTEREST_LEVEL.HOT) {
    return [
      'Schedule site visit immediately',
      'Send booking documentation',
      'Discuss payment options',
      'Follow up within 24 hours'
    ];
  } else if (temperature === INTEREST_LEVEL.WARM) {
    return [
      'Share project details and pricing',
      'Schedule site visit within 3-5 days',
      'Address any concerns or queries',
      'Follow up within 2-3 days'
    ];
  } else {
    return [
      'Share basic project information',
      'Nurture with periodic updates',
      'Understand timeline better',
      'Follow up weekly or bi-weekly'
    ];
  }
};
