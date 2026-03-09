// src/crm/data/noteTemplates.js
// Quick-fill note templates for common CRM interactions

export const NOTE_TEMPLATES = [
  {
    id: 'not_answering',
    label: '\uD83D\uDCF5 Not Answering',
    text: 'Called — not answering.',
    autoActions: {
      incrementCallAttempt: true,
      suggestFollowUp: 1, // days
    },
  },
  {
    id: 'busy',
    label: '\uD83D\uDD34 Busy',
    text: 'Called — line busy.',
    autoActions: {
      incrementCallAttempt: true,
      suggestFollowUp: 0, // same day retry
    },
  },
  {
    id: 'switched_off',
    label: '\uD83D\uDCF4 Switched Off',
    text: 'Called — phone switched off.',
    autoActions: {
      incrementCallAttempt: true,
      suggestFollowUp: 1,
    },
  },
  {
    id: 'interested',
    label: '\u2705 Interested',
    text: 'Connected — client showed interest.',
    autoActions: {
      suggestStatus: 'FollowUp',
      suggestInterest: 'Warm',
      suggestFollowUp: 2,
    },
  },
  {
    id: 'very_interested',
    label: '\uD83D\uDD25 Very Interested',
    text: 'Connected — client very interested, wants to move forward.',
    autoActions: {
      suggestStatus: 'SiteVisit',
      suggestInterest: 'Hot',
      suggestFollowUp: 1,
    },
  },
  {
    id: 'site_visit_requested',
    label: '\uD83D\uDCCD Site Visit',
    text: 'Client requested site visit.',
    autoActions: {
      suggestStatus: 'SiteVisit',
      suggestInterest: 'Hot',
      suggestFollowUp: 2,
      createSiteVisit: true,
    },
  },
  {
    id: 'budget_concern',
    label: '\uD83D\uDCB0 Budget Issue',
    text: 'Client has budget concerns.',
    autoActions: {
      suggestStatus: 'FollowUp',
      flagForManager: true,
      suggestFollowUp: 3,
    },
  },
  {
    id: 'not_interested',
    label: '\u274C Not Interested',
    text: 'Client not interested at this time.',
    autoActions: {
      suggestStatus: 'NotInterested',
      suggestInterest: 'Cold',
    },
  },
  {
    id: 'callback_later',
    label: '\uD83D\uDD04 Call Back Later',
    text: 'Client asked to call back later.',
    autoActions: {
      suggestStatus: 'CallBackLater',
      suggestFollowUp: 3,
    },
  },
  {
    id: 'wrong_number',
    label: '\u2753 Wrong Number',
    text: 'Wrong number / not the right contact.',
    autoActions: {
      suggestStatus: 'Lost',
    },
  },
  {
    id: 'comparing',
    label: '\uD83D\uDD0D Comparing',
    text: 'Client is comparing with other properties.',
    autoActions: {
      suggestStatus: 'FollowUp',
      suggestFollowUp: 5,
    },
  },
  {
    id: 'family_decision',
    label: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 Family Decision',
    text: 'Client needs to discuss with family.',
    autoActions: {
      suggestStatus: 'FollowUp',
      suggestFollowUp: 4,
    },
  },
];

export const CALL_OUTCOME_TAGS = [
  { tag: 'not interested', sentiment: 'negative', suggestStatus: 'NotInterested' },
  { tag: 'callback', sentiment: 'neutral', suggestStatus: 'CallBackLater' },
  { tag: 'call back', sentiment: 'neutral', suggestStatus: 'CallBackLater' },
  { tag: 'wrong number', sentiment: 'negative', suggestStatus: 'Lost' },
  { tag: 'connected', sentiment: 'positive', suggestStatus: 'FollowUp' },
  { tag: 'busy', sentiment: 'neutral' },
  { tag: 'not answering', sentiment: 'neutral' },
  { tag: 'switched off', sentiment: 'neutral' },
];

export const MEETING_TAGS = [
  { tag: 'site visit', suggestStatus: 'SiteVisit' },
  { tag: 'met client', suggestStatus: 'SiteVisit' },
  { tag: 'demo done', suggestStatus: 'FollowUp' },
  { tag: 'visited', suggestStatus: 'SiteVisit' },
];

export const OBJECTION_TAGS = [
  { tag: 'budget issue', type: 'budget' },
  { tag: 'budget concern', type: 'budget' },
  { tag: 'too expensive', type: 'budget' },
  { tag: 'price issue', type: 'budget' },
  { tag: 'comparing', type: 'competition' },
  { tag: 'other properties', type: 'competition' },
  { tag: 'needs time', type: 'timing' },
  { tag: 'not ready', type: 'timing' },
  { tag: 'family decision', type: 'family' },
  { tag: 'loan needed', type: 'finance' },
  { tag: 'loan issue', type: 'finance' },
];

export const ACTION_TAGS = [
  { tag: 'send brochure', action: 'Send brochure' },
  { tag: 'follow up', action: 'Schedule follow-up' },
  { tag: 'share location', action: 'Share project location' },
  { tag: 'send pricing', action: 'Send pricing details' },
  { tag: 'schedule visit', action: 'Schedule site visit' },
  { tag: 'call next week', followUpDays: 7 },
  { tag: 'call tomorrow', followUpDays: 1 },
  { tag: 'call in 2 days', followUpDays: 2 },
  { tag: 'call in 3 days', followUpDays: 3 },
  { tag: 'next week', followUpDays: 7 },
];
