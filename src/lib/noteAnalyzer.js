// src/lib/noteAnalyzer.js
// Text analysis and pattern detection for CRM notes

import {
  CALL_OUTCOME_TAGS,
  MEETING_TAGS,
  OBJECTION_TAGS,
  ACTION_TAGS,
} from '@/crm/data/noteTemplates';

/**
 * Analyze note text and return detected tags, sentiment, and suggestions
 */
export const analyzeNote = (text) => {
  if (!text || typeof text !== 'string') {
    return { tags: [], sentiment: 'neutral', suggestions: [], detectedActions: [] };
  }

  const lower = text.toLowerCase();
  const tags = [];
  let sentiment = 'neutral';
  let positiveSignals = 0;
  let negativeSignals = 0;
  const suggestions = [];
  const detectedActions = [];

  // Detect call outcomes
  CALL_OUTCOME_TAGS.forEach(item => {
    if (lower.includes(item.tag)) {
      tags.push({ type: 'call_outcome', label: item.tag });
      if (item.sentiment === 'positive') positiveSignals++;
      if (item.sentiment === 'negative') negativeSignals++;
      if (item.suggestStatus) {
        suggestions.push({ type: 'status', value: item.suggestStatus, reason: `Note mentions "${item.tag}"` });
      }
    }
  });

  // Detect meeting mentions
  MEETING_TAGS.forEach(item => {
    if (lower.includes(item.tag)) {
      tags.push({ type: 'meeting', label: item.tag });
      positiveSignals++;
      if (item.suggestStatus) {
        suggestions.push({ type: 'status', value: item.suggestStatus, reason: `Note mentions "${item.tag}"` });
      }
    }
  });

  // Detect objections
  OBJECTION_TAGS.forEach(item => {
    if (lower.includes(item.tag)) {
      tags.push({ type: 'objection', label: item.tag, objectionType: item.type });
      if (item.type === 'budget') {
        suggestions.push({ type: 'flag', value: 'manager_review', reason: 'Budget concern detected' });
      }
    }
  });

  // Detect action items
  ACTION_TAGS.forEach(item => {
    if (lower.includes(item.tag)) {
      if (item.action) {
        detectedActions.push(item.action);
      }
      if (item.followUpDays) {
        const target = new Date();
        target.setDate(target.getDate() + item.followUpDays);
        const dateStr = target.toISOString().split('T')[0];
        suggestions.push({
          type: 'follow_up_date',
          value: dateStr,
          days: item.followUpDays,
          reason: `Note mentions "${item.tag}"`,
        });
      }
    }
  });

  // Positive sentiment keywords
  const positiveWords = ['interested', 'excited', 'ready', 'keen', 'positive', 'happy', 'good', 'great', 'yes', 'agreed', 'confirm'];
  positiveWords.forEach(w => {
    if (lower.includes(w) && !lower.includes('not ' + w)) positiveSignals++;
  });

  // Negative sentiment keywords
  const negativeWords = ['not interested', 'refused', 'angry', 'annoyed', 'complaint', 'no', 'never', 'wrong', 'bad'];
  negativeWords.forEach(w => {
    if (lower.includes(w)) negativeSignals++;
  });

  if (positiveSignals > negativeSignals) sentiment = 'positive';
  else if (negativeSignals > positiveSignals) sentiment = 'negative';

  // Deduplicate suggestions by type+value
  const seen = new Set();
  const uniqueSuggestions = suggestions.filter(s => {
    const key = `${s.type}:${s.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { tags, sentiment, suggestions: uniqueSuggestions, detectedActions };
};

/**
 * Analyze note history to detect patterns
 */
export const analyzeNoteHistory = (notesText) => {
  if (!notesText || typeof notesText !== 'string') {
    return { patterns: [], insights: [] };
  }

  const lines = notesText.split('\n').filter(l => l.trim());
  const patterns = [];
  const insights = [];

  // Count occurrences of key phrases
  const phraseCounts = {};
  const lower = notesText.toLowerCase();

  const trackPhrases = [
    { phrase: 'not answering', label: 'Not Answering' },
    { phrase: 'no answer', label: 'Not Answering' },
    { phrase: 'busy', label: 'Busy' },
    { phrase: 'switched off', label: 'Switched Off' },
    { phrase: 'not interested', label: 'Not Interested' },
    { phrase: 'budget', label: 'Budget Concern' },
    { phrase: 'price', label: 'Price Discussion' },
    { phrase: 'site visit', label: 'Site Visit' },
    { phrase: 'interested', label: 'Showed Interest' },
    { phrase: 'callback', label: 'Callback Requested' },
    { phrase: 'call back', label: 'Callback Requested' },
  ];

  trackPhrases.forEach(({ phrase, label }) => {
    const regex = new RegExp(phrase, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      phraseCounts[label] = (phraseCounts[label] || 0) + matches.length;
    }
  });

  // Generate patterns
  Object.entries(phraseCounts).forEach(([label, count]) => {
    if (count >= 2) {
      patterns.push({ label, count, severity: count >= 3 ? 'high' : 'medium' });
    }
  });

  // Generate insights
  if (phraseCounts['Not Answering'] >= 3) {
    insights.push({
      type: 'warning',
      message: `${phraseCounts['Not Answering']}x "not answering" — consider trying at a different time or via WhatsApp`,
    });
  }
  if (phraseCounts['Budget Concern'] >= 2) {
    insights.push({
      type: 'flag',
      message: `Client mentioned budget ${phraseCounts['Budget Concern']} times — may need manager intervention or flexible payment plan`,
    });
  }
  if (phraseCounts['Showed Interest'] >= 3) {
    insights.push({
      type: 'positive',
      message: `${phraseCounts['Showed Interest']}x positive interactions — high conversion potential`,
    });
  }
  if (phraseCounts['Not Interested'] >= 2) {
    insights.push({
      type: 'warning',
      message: `Client expressed disinterest ${phraseCounts['Not Interested']} times — consider marking as Lost`,
    });
  }

  // Total interaction count
  const noteLines = lines.filter(l => l.match(/^\[.*?\]/));
  if (noteLines.length > 0) {
    insights.unshift({
      type: 'info',
      message: `${noteLines.length} logged interaction${noteLines.length > 1 ? 's' : ''} in history`,
    });
  }

  return { patterns, insights };
};

/**
 * Detect sentiment emoji for display
 */
export const getSentimentEmoji = (sentiment) => {
  switch (sentiment) {
    case 'positive': return '\uD83D\uDE0A';
    case 'negative': return '\uD83D\uDE1F';
    default: return '\uD83D\uDE10';
  }
};

/**
 * Get color class for sentiment
 */
export const getSentimentColor = (sentiment) => {
  switch (sentiment) {
    case 'positive': return 'text-emerald-600 bg-emerald-50';
    case 'negative': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};
