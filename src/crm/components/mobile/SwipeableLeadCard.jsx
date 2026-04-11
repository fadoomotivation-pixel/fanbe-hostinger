// src/crm/components/mobile/SwipeableLeadCard.jsx
// Premium real estate CRM card — mobile-first, no overflow
import React from 'react';
import { Phone, Calendar, Clock, StickyNote, Copy, CheckCircle, PhoneCall, MapPin } from 'lucide-react';
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
    if (!d) return { text: dateStr.split('T')[0], dot: '#9ca3af' };
    if (isToday(d))     return { text: 'Today',     dot: '#f59e0b', bg: '#fffbeb', color: '#92400e' };
    if (isTomorrow(d))  return { text: 'Tomorrow',  dot: '#3b82f6', bg: '#eff6ff', color: '#1e40af' };
    if (isYesterday(d)) return { text: 'Yesterday', dot: '#f97316', bg: '#fff7ed', color: '#9a3412' };
    if (isPast(d))      return { text: 'Overdue',   dot: '#ef4444', bg: '#fef2f2', color: '#991b1b' };
    return { text: dateStr.split('T')[0], dot: '#9ca3af', bg: '#f9fafb', color: '#6b7280' };
  } catch { return { text: dateStr.split('T')[0], dot: '#9ca3af', bg: '#f9fafb', color: '#6b7280' }; }
};

const STATUS_STYLES = {
  New:           { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  Open:          { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9' },
  FollowUp:      { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' },
  SiteVisit:     { bg: '#faf5ff', color: '#7e22ce', dot: '#a855f7' },
  Booked:        { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
  NotInterested: { bg: '#f9fafb', color: '#6b7280', dot: '#d1d5db' },
  Lost:          { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
  CallBackLater: { bg: '#eef2ff', color: '#3730a3', dot: '#6366f1' },
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
}) => {
  const followUp   = lead?.follow_up_date || lead?.followUpDate || null;
  const fuLabel    = getFollowUpLabel(followUp);
  const latestNote = getLatestNote?.(lead?.notes);
  const status     = lead?.status || 'New';
  const st         = STATUS_STYLES[status] || STATUS_STYLES.New;
  const phone      = lead?.phone || '';

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
      className="bg-white rounded-2xl cursor-pointer active:scale-[0.985] transition-transform touch-manipulation"
      style={{ boxShadow: '0 1px 3px rgba(15,58,95,0.08), 0 0 0 1px rgba(15,58,95,0.06)', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* status accent bar */}
      <div style={{ height: 3, borderRadius: '12px 12px 0 0', background: st.dot }} />

      <div className="p-4">
        {/* Row 1: Name + Status pill */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight truncate flex-1">
            {lead?.name || 'Unnamed Lead'}
          </h3>
          <span
            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: st.bg, color: st.color }}
          >
            {status}
          </span>
        </div>

        {/* Row 2: Project */}
        {lead?.project && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={11} className="text-gray-400 shrink-0" />
            <p className="text-[12px] text-gray-400 truncate">{lead.project}</p>
          </div>
        )}

        {/* Row 3: Phone + copy */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[14px] font-bold tracking-wide" style={{ color: '#0F3A5F' }}>
            {formatPhone(phone)}
          </span>
          {onCopyPhone && phone && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCopyPhone(phone, lead.id); }}
              className="p-1 rounded-md active:bg-gray-100 touch-manipulation"
              aria-label="Copy phone"
            >
              {copiedId === lead?.id
                ? <CheckCircle size={13} className="text-emerald-500" />
                : <Copy size={13} className="text-gray-300" />}
            </button>
          )}
        </div>

        {/* Row 4: Follow-up chip + assigned time */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {fuLabel ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: fuLabel.bg || '#f9fafb', color: fuLabel.color || '#6b7280' }}
            >
              <Calendar size={9} />{fuLabel.text}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
              <Calendar size={9} /> No follow-up
            </span>
          )}
          {formatAssignedTime && (lead?.assignedAt || lead?.assigned_at) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={9} />
              {formatAssignedTime(lead.assignedAt || lead.assigned_at)}
            </span>
          )}
        </div>

        {/* Latest note */}
        {latestNote && (
          <div className="flex items-start gap-1.5 bg-gray-50 rounded-xl px-3 py-2 mb-3">
            <StickyNote size={11} className="mt-0.5 shrink-0 text-gray-300" />
            <p className="text-[12px] text-gray-500 line-clamp-1 leading-relaxed">{latestNote}</p>
          </div>
        )}

        {/* Action row: Quick Log | Call */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleQuickLog}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold touch-manipulation active:opacity-80"
            style={{ background: '#0F3A5F', color: '#fff' }}
          >
            <PhoneCall size={14} /> Quick Log
          </button>
          <button
            type="button"
            onClick={handleCall}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold touch-manipulation active:opacity-80"
            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
          >
            <Phone size={14} /> Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwipeableLeadCard;
