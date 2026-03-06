/**
 * Lead Status Management Utilities
 * Ensures consistency between CSV imports, UI, and database
 */

// ============================================
// CANONICAL STATUS VALUES
// ============================================

export const LEAD_STATUS = {
  OPEN: 'Open',
  FOLLOW_UP: 'FollowUp',
  BOOKED: 'Booked',
  LOST: 'Lost'
};

export const INTEREST_LEVEL = {
  HOT: 'Hot',
  WARM: 'Warm',
  COLD: 'Cold'
};

export const CALL_STATUS = {
  CONNECTED: 'Connected',
  NOT_ANSWERED: 'Not Answered',
  BUSY: 'Busy',
  SWITCHED_OFF: 'Switched Off',
  INVALID_NUMBER: 'Invalid Number',
  CALL_BACK: 'Call Back Requested'
};

// ============================================
// NORMALIZATION FUNCTIONS
// ============================================

/**
 * Normalize status from CSV/import format to canonical format
 * Handles: "follow up", "follow_up", "site visit", "not interested"
 * Returns: "Open", "FollowUp", "Booked", "Lost"
 */
export const normalizeLeadStatus = (status) => {
  if (!status) return LEAD_STATUS.OPEN;
  
  const cleaned = String(status)
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');
  
  // Map variations to canonical values
  if (cleaned === 'open' || cleaned === 'new' || cleaned === 'active') {
    return LEAD_STATUS.OPEN;
  }
  if (cleaned === 'followup' || cleaned === 'sitevisit' || cleaned === 'pending') {
    return LEAD_STATUS.FOLLOW_UP;
  }
  if (cleaned === 'booked' || cleaned === 'confirmed' || cleaned === 'closed' || cleaned === 'won') {
    return LEAD_STATUS.BOOKED;
  }
  if (cleaned === 'lost' || cleaned === 'notinterested' || cleaned === 'rejected' || cleaned === 'cancelled') {
    return LEAD_STATUS.LOST;
  }
  
  // Default fallback
  return LEAD_STATUS.OPEN;
};

/**
 * Normalize interest level
 */
export const normalizeInterestLevel = (interest) => {
  if (!interest) return INTEREST_LEVEL.WARM;
  
  const cleaned = String(interest).toLowerCase().trim();
  
  if (cleaned === 'hot') return INTEREST_LEVEL.HOT;
  if (cleaned === 'warm') return INTEREST_LEVEL.WARM;
  if (cleaned === 'cold') return INTEREST_LEVEL.COLD;
  
  return INTEREST_LEVEL.WARM;
};

/**
 * Normalize call status
 */
export const normalizeCallStatus = (status) => {
  if (!status) return '';
  
  const cleaned = String(status)
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');
  
  // Check "not" variations first so they don't accidentally match CONNECTED
  if (cleaned.includes('notanswer') || cleaned.includes('noanswer') || cleaned.includes('notreach') || cleaned.includes('notconnect')) {
    return CALL_STATUS.NOT_ANSWERED;
  }
  if (cleaned.includes('connect') || (cleaned.includes('answer') && !cleaned.includes('not'))) {
    return CALL_STATUS.CONNECTED;
  }
  if (cleaned.includes('busy')) {
    return CALL_STATUS.BUSY;
  }
  if (cleaned.includes('switch') || cleaned.includes('off')) {
    return CALL_STATUS.SWITCHED_OFF;
  }
  if (cleaned.includes('invalid') || cleaned.includes('wrong')) {
    return CALL_STATUS.INVALID_NUMBER;
  }
  if (cleaned.includes('callback') || cleaned.includes('callback')) {
    return CALL_STATUS.CALL_BACK;
  }
  
  return CALL_STATUS.NOT_ANSWERED;
};

// ============================================
// STATUS VALIDATION
// ============================================

/**
 * Check if a status value is valid
 */
export const isValidLeadStatus = (status) => {
  return Object.values(LEAD_STATUS).includes(status);
};

export const isValidInterestLevel = (interest) => {
  return Object.values(INTEREST_LEVEL).includes(interest);
};

// ============================================
// STATUS TRANSITION GUARDS
// ============================================

/**
 * Check if a status transition is allowed
 * Returns: { allowed: boolean, reason?: string, warning?: string }
 */
export const validateStatusTransition = (currentStatus, newStatus, lead, calls = []) => {
  // Normalize both statuses
  const from = normalizeLeadStatus(currentStatus);
  const to = normalizeLeadStatus(newStatus);
  
  // Same status is always ok
  if (from === to) {
    return { allowed: true };
  }
  
  // Get lead's call history
  const leadCalls = calls.filter(c => c.leadId === lead.id || c.lead_id === lead.id);
  const hasBeenContacted = leadCalls.length > 0;
  const hasConnectedCall = leadCalls.some(c => 
    c.status === 'Connected' || c.status === 'connected' || c.status === CALL_STATUS.CONNECTED
  );
  
  // RULE 1: Cannot mark as Lost without any contact attempt
  if (to === LEAD_STATUS.LOST && !hasBeenContacted) {
    return {
      allowed: false,
      reason: 'Cannot mark as Lost without attempting contact. Please add a call log first.'
    };
  }
  
  // RULE 2: Warning when booking without connected call
  if (to === LEAD_STATUS.BOOKED && !hasConnectedCall) {
    return {
      allowed: true,
      warning: 'This lead has no successful connected calls. Are you sure about the booking?'
    };
  }
  
  // RULE 3: Cannot go from Booked back to Open/FollowUp (data integrity)
  if (from === LEAD_STATUS.BOOKED && (to === LEAD_STATUS.OPEN || to === LEAD_STATUS.FOLLOW_UP)) {
    return {
      allowed: false,
      reason: 'Cannot revert a Booked lead to Open/FollowUp. If booking was cancelled, mark as Lost.'
    };
  }
  
  // RULE 4: Warning when moving from Lost to active status
  if (from === LEAD_STATUS.LOST && to !== LEAD_STATUS.LOST) {
    return {
      allowed: true,
      warning: 'Reopening a Lost lead. Make sure this is intentional.'
    };
  }
  
  // All other transitions are allowed
  return { allowed: true };
};

/**
 * Get status badge color for UI display
 */
export const getStatusColor = (status) => {
  const normalized = normalizeLeadStatus(status);
  
  switch (normalized) {
    case LEAD_STATUS.OPEN:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case LEAD_STATUS.FOLLOW_UP:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case LEAD_STATUS.BOOKED:
      return 'bg-green-100 text-green-800 border-green-300';
    case LEAD_STATUS.LOST:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

/**
 * Get interest level color for UI display
 */
export const getInterestColor = (interest) => {
  const normalized = normalizeInterestLevel(interest);
  
  switch (normalized) {
    case INTEREST_LEVEL.HOT:
      return 'bg-red-100 text-red-800 border-red-300';
    case INTEREST_LEVEL.WARM:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case INTEREST_LEVEL.COLD:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

// ============================================
// REQUIRED FIELDS BY STATUS
// ============================================

/**
 * Get required fields for a given status
 */
export const getRequiredFieldsForStatus = (status) => {
  const normalized = normalizeLeadStatus(status);
  
  const baseFields = ['name', 'phone', 'notes'];
  
  switch (normalized) {
    case LEAD_STATUS.FOLLOW_UP:
      return [...baseFields, 'followUpDate'];
    case LEAD_STATUS.BOOKED:
      return [...baseFields, 'tokenAmount', 'bookingAmount'];
    case LEAD_STATUS.LOST:
      return [...baseFields]; // Just need reason in notes
    default:
      return baseFields;
  }
};

/**
 * Validate if lead has all required fields for its status
 */
export const validateLeadData = (lead) => {
  const status = normalizeLeadStatus(lead.status);
  const requiredFields = getRequiredFieldsForStatus(status);
  const errors = [];
  
  requiredFields.forEach(field => {
    if (field === 'followUpDate' && status === LEAD_STATUS.FOLLOW_UP) {
      if (!lead.followUpDate && !lead.follow_up_date) {
        errors.push('Follow-up date is required for Follow Up status');
      }
    }
    if (field === 'tokenAmount' && status === LEAD_STATUS.BOOKED) {
      if (!lead.tokenAmount && !lead.token_amount) {
        errors.push('Token amount is required for Booked status');
      }
    }
    if (field === 'bookingAmount' && status === LEAD_STATUS.BOOKED) {
      if (!lead.bookingAmount && !lead.booking_amount) {
        errors.push('Booking amount is required for Booked status');
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// STATUS HISTORY TRACKING
// ============================================

/**
 * Create a status change note for audit trail
 */
export const createStatusChangeNote = (oldStatus, newStatus, user, additionalInfo = {}) => {
  const from = normalizeLeadStatus(oldStatus);
  const to = normalizeLeadStatus(newStatus);
  
  let note = `Status changed: ${from} → ${to}`;
  
  if (additionalInfo.interest) {
    note += ` | Interest: ${normalizeInterestLevel(additionalInfo.interest)}`;
  }
  
  if (additionalInfo.followUpDate) {
    note += ` | Follow-up: ${additionalInfo.followUpDate}`;
    if (additionalInfo.followUpTime) {
      note += ` at ${additionalInfo.followUpTime}`;
    }
  }
  
  if (additionalInfo.tokenAmount || additionalInfo.bookingAmount) {
    note += ` | Token: ₹${additionalInfo.tokenAmount || 0} | Booking: ₹${additionalInfo.bookingAmount || 0}`;
  }
  
  if (additionalInfo.reason) {
    note += ` | Reason: ${additionalInfo.reason}`;
  }
  
  note += ` | By: ${user}`;
  
  return note;
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  LEAD_STATUS,
  INTEREST_LEVEL,
  CALL_STATUS,
  normalizeLeadStatus,
  normalizeInterestLevel,
  normalizeCallStatus,
  isValidLeadStatus,
  isValidInterestLevel,
  validateStatusTransition,
  getStatusColor,
  getInterestColor,
  getRequiredFieldsForStatus,
  validateLeadData,
  createStatusChangeNote
};
