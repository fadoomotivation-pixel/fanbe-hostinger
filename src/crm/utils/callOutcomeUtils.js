import { format, addDays, addHours } from 'date-fns';

export const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected - Spoke with Client', icon: '✅', color: 'green', needsFollowUp: false },
  { value: 'not_answered', label: 'Not Answered - No Pickup', icon: '📵', color: 'amber', needsFollowUp: true },
  { value: 'callback_requested', label: 'Callback Requested - Call Back Later', icon: '📞', color: 'blue', needsFollowUp: true },
  { value: 'wrong_number', label: 'Wrong Number - Invalid Contact', icon: '❌', color: 'red', needsFollowUp: false },
  { value: 'busy', label: 'Busy - Line Was Busy', icon: '📶', color: 'amber', needsFollowUp: true },
  { value: 'switched_off', label: 'Switched Off - Phone Was Off', icon: '🔌', color: 'gray', needsFollowUp: true },
  { value: 'voicemail', label: 'Voicemail - Left Message', icon: '💬', color: 'purple', needsFollowUp: true },
];

export const QUICK_LOG_OUTCOMES = [
  { value: 'connected', label: 'Connected', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-700', hoverBg: 'hover:bg-green-100', needsFollowUp: false },
  { value: 'not_answered', label: 'Not Answered', color: 'amber', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700', hoverBg: 'hover:bg-amber-100', needsFollowUp: true },
  { value: 'busy', label: 'Busy', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700', hoverBg: 'hover:bg-orange-100', needsFollowUp: true },
  { value: 'callback_requested', label: 'Callback', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700', hoverBg: 'hover:bg-blue-100', needsFollowUp: true },
  { value: 'switched_off', label: 'Switched Off', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700', hoverBg: 'hover:bg-gray-100', needsFollowUp: true },
  { value: 'wrong_number', label: 'Wrong Number', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', hoverBg: 'hover:bg-red-100', needsFollowUp: false },
];

export const getSmartFollowUpSuggestion = (outcome) => {
  const now = new Date();

  switch (outcome) {
    case 'connected':
      return {
        date: format(addDays(now, 2), 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        suggestion: 'Follow up in 2 days to maintain engagement'
      };
    case 'not_answered':
      return {
        date: format(addHours(now, 4), 'yyyy-MM-dd'),
        time: format(addHours(now, 4), 'HH:mm'),
        suggestion: 'Retry in 4 hours - different time may work better'
      };
    case 'callback_requested':
      return {
        date: format(addHours(now, 2), 'yyyy-MM-dd'),
        time: format(addHours(now, 2), 'HH:mm'),
        suggestion: 'Call back in 2 hours as requested'
      };
    case 'busy':
      return {
        date: format(addHours(now, 2), 'yyyy-MM-dd'),
        time: format(addHours(now, 2), 'HH:mm'),
        suggestion: 'Retry in 2 hours when line may be free'
      };
    case 'switched_off':
      return {
        date: format(addHours(now, 6), 'yyyy-MM-dd'),
        time: format(addHours(now, 6), 'HH:mm'),
        suggestion: 'Try again in 6 hours - phone may be on'
      };
    case 'voicemail':
      return {
        date: format(addDays(now, 1), 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        suggestion: 'Follow up tomorrow - they may return call'
      };
    case 'wrong_number':
      return {
        date: '',
        time: '',
        suggestion: 'Update lead with correct phone number'
      };
    default:
      return {
        date: format(addDays(now, 1), 'yyyy-MM-dd'),
        time: format(now, 'HH:mm'),
        suggestion: 'Follow up tomorrow'
      };
  }
};
