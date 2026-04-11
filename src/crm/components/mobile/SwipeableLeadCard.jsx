// src/crm/components/mobile/SwipeableLeadCard.jsx
// ✅ Swipe REMOVED — was causing accidental call/quick-log triggers while scrolling
// ✅ New design: large text, bold phone, coloured status pill, two big action buttons
import React from 'react';
import { Phone, Calendar, Clock, StickyNote, Copy, CheckCircle, ChevronRight, PhoneCall } from 'lucide-react';
import { isPast, isToday, isTomorrow, isYesterday } from 'date-fns';

const parseLocalDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

const getFollowUpLabel = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = parseLocalDate(dateStr);
    if (!d) return dateStr.split('T')[0];
    if (isToday(d))     return { text: 'Today', color: 'text-amber-700 bg-amber-100' };
    if (isTomorrow(d))  return { text: 'Tomorrow', color: 'text-blue-700 bg-blue-100' };
    if (isYesterday(d)) return { text: 'Yesterday', color: 'text-orange-700 bg-orange-100' };
    if (isPast(d))      return { text: `Overdue: ${dateStr.split('T')[0]}`, color: 'text-red-700 bg-red-100' };
    return { text: dateStr.split('T')[0], color: 'text-gray-600 bg-gray-100' };
  } catch { return { text: dateStr.split('T')[0], color: 'text-gray-600 bg-gray-100' }; }
};

const statusColors = {
  New:           'bg-blue-500 text-white',
  Open:          'bg-sky-500 text-white',
  FollowUp:      'bg-amber-500 text-white',
  SiteVisit:     'bg-purple-500 text-white',
  Booked:        'bg-emerald-500 text-white',
  NotInterested: 'bg-gray-400 text-white',
  Lost:          'bg-red-500 text-white',
  CallBackLater: 'bg-indigo-500 text-white',
};

const SwipeableLeadCard = ({
  lead,
  onTap,
  onQuickLog,
  formatPhone = (v) => v,
  formatAssignedTime,
  getLatestNote,
  copiedId,
  onCopyPhone,
  // legacy props — kept for compatibility, not used
  onCall,
  onQuickAction,
  statusColors: propStatusColors,
}) => {
  const colors = propStatusColors || statusColors;
  const followUp = lead?.follow_up_date || lead?.followUpDate || null;
  const fuLabel = getFollowUpLabel(followUp);
  const latestNote = getLatestNote?.(lead?.notes);
  const statusStyle = colors[lead?.status] || 'bg-gray-400 text-white';
  const phone = lead?.phone || '';

  const handleCall = (e) => {
    e.stopPropagation();
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleQuickLog = (e) => {
    e.stopPropagation();
    onQuickLog?.(lead);
  };

  return (
    <div
      onClick={onTap}
      className="bg-white rounded-2xl border border-gray-150 shadow-sm active:scale-[0.985] transition-transform touch-manipulation cursor-pointer"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* ── Top row: name + status badge ── */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-1">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-extrabold text-gray-900 leading-snug truncate">
            {lead?.name || 'Unnamed Lead'}
          </h3>
          {lead?.project && (
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{lead.project}</p>
          )}
        </div>
        <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full leading-none ${statusStyle}`}>
          {lead?.status || 'New'}
        </span>
      </div>

      {/* ── Phone row ── */}
      <div className="flex items-center gap-2 px-4 py-1">
        <span className="text-[15px] font-bold text-[#0F3A5F] tracking-wide">
          {formatPhone(phone)}
        </span>
        {onCopyPhone && phone && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCopyPhone(phone, lead.id); }}
            className="p-1.5 rounded-lg active:bg-gray-100 touch-manipulation"
            aria-label="Copy phone"
          >
            {copiedId === lead?.id
              ? <CheckCircle size={15} className="text-emerald-500" />
              : <Copy size={15} className="text-gray-400" />}
          </button>
        )}
      </div>

      {/* ── Follow-up + assigned time row ── */}
      <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
        {fuLabel ? (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${fuLabel.color}`}>
            <Calendar size={10} />
            {fuLabel.text}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 px-2 py-0.5">
            <Calendar size={10} /> No follow-up
          </span>
        )}
        {formatAssignedTime && (lead?.assignedAt || lead?.assigned_at) && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <Clock size={10} />
            {formatAssignedTime(lead.assignedAt || lead.assigned_at)}
          </span>
        )}
      </div>

      {/* ── Latest note ── */}
      {latestNote && (
        <div className="mx-4 mb-2 flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
          <StickyNote size={12} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="line-clamp-2 leading-relaxed">{latestNote}</p>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={handleQuickLog}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0F3A5F] text-white text-sm font-bold active:bg-[#0c2e4a] touch-manipulation"
        >
          <PhoneCall size={15} />
          Quick Log
        </button>
        <button
          type="button"
          onClick={handleCall}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold active:bg-emerald-600 touch-manipulation"
        >
          <Phone size={15} />
          Call
        </button>
      </div>
    </div>
  );
};

export default SwipeableLeadCard;
