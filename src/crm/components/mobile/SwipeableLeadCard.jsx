// SwipeableLeadCard.jsx — Premium Real Estate CRM
// Matches reference mockup: name + badge, phone, project, last activity, 2 action buttons
import React from 'react';
import { Phone, PhoneCall, Clock, MapPin, Activity } from 'lucide-react';
import { isToday, isTomorrow, isYesterday, isPast, differenceInDays } from 'date-fns';

const parseLocalDate = (s) => {
  if (!s) return null;
  const p = s.split('T')[0].split('-').map(Number);
  return p[0] ? new Date(p[0], p[1] - 1, p[2]) : null;
};

const INTEREST_BADGE = {
  hot:  { label: '🔥 Hot',  bg: '#FFF3EE', color: '#C2390A', border: '#FBBF9A' },
  warm: { label: '🟡 Warm', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  cold: { label: '🔵 Cold', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
};

const STATUS_DOT = {
  New:           '#3B82F6',
  Open:          '#0EA5E9',
  FollowUp:      '#F59E0B',
  SiteVisit:     '#A855F7',
  Booked:        '#22C55E',
  NotInterested: '#D1D5DB',
  Lost:          '#EF4444',
  CallBackLater: '#6366F1',
};

const getFollowUpMeta = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  if (isToday(d))     return { label: 'Today',     color: '#D97706', bg: '#FFFBEB' };
  if (isTomorrow(d))  return { label: 'Tomorrow',  color: '#2563EB', bg: '#EFF6FF' };
  if (isYesterday(d)) return { label: 'Yesterday', color: '#EA580C', bg: '#FFF7ED' };
  if (isPast(d))      return { label: 'Overdue',   color: '#DC2626', bg: '#FEF2F2' };
  const diff = differenceInDays(d, new Date());
  return { label: `${diff}d`, color: '#6B7280', bg: '#F3F4F6' };
};

const getLatestNote = (notes) => {
  if (!notes) return null;
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return lines[lines.length - 1].replace(/^\[.*?\]:\s*/, '').trim();
};

const formatPhone = (p) => {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `+91 ${d.slice(0,5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2,7)} ${d.slice(7)}`;
  return p;
};

const SwipeableLeadCard = ({ lead, onTap, onQuickLog }) => {
  const interest   = (lead?.interest_level || '').toLowerCase();
  const badge      = INTEREST_BADGE[interest];
  const status     = lead?.status || 'New';
  const dot        = STATUS_DOT[status] || '#9CA3AF';
  const phone      = lead?.phone || '';
  const fuDate     = lead?.follow_up_date || lead?.followUpDate;
  const fuMeta     = getFollowUpMeta(fuDate);
  const latestNote = getLatestNote(lead?.notes);
  const project    = lead?.project || lead?.project_name || '';

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
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.985] transition-transform touch-manipulation"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="p-4">

        {/* Row 1: Name + badge */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-[16px] font-bold text-gray-900 leading-snug truncate flex-1">
            {lead?.name || 'Unnamed Lead'}
          </h3>
          {badge ? (
            <span
              className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
            >
              {badge.label}
            </span>
          ) : (
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
              <span className="text-[11px] text-gray-400 font-medium">{status}</span>
            </span>
          )}
        </div>

        {/* Phone */}
        <p className="text-[15px] font-semibold mb-2" style={{ color: '#1C3A2F' }}>
          {formatPhone(phone)}
        </p>

        {/* Project */}
        {project && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin size={11} className="text-gray-400 shrink-0" />
            <span className="text-[12px] text-gray-500">Project: </span>
            <span className="text-[12px] font-semibold text-gray-700 truncate">{project}</span>
          </div>
        )}

        {/* Last activity / note */}
        {latestNote && (
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={11} className="text-gray-400 shrink-0" />
            <span className="text-[12px] text-gray-500">Last Activity: </span>
            <span className="text-[12px] text-gray-600 truncate">{latestNote}</span>
          </div>
        )}

        {/* Follow-up + time meta */}
        {(fuMeta || lead?.assignedAt || lead?.assigned_at) && (
          <div className="flex items-center gap-3 mb-3">
            {fuMeta && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: fuMeta.bg, color: fuMeta.color }}
              >
                <Clock size={9} /> {fuMeta.label}
              </span>
            )}
            {lead?._lastCall?.notes && (
              <span className="text-[11px] text-gray-400 truncate">{lead._lastCall.notes.split(':').pop()?.trim()}</span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: '#F3F4F6' }} />

        {/* Action buttons — Quick Log on left, Call on right (stacked below Quick Log) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleQuickLog}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold touch-manipulation active:opacity-70"
            style={{ border: '1.5px solid #D1D5DB', background: '#fff', color: '#374151' }}
          >
            <PhoneCall size={14} /> Quick Log
          </button>
          <button
            type="button"
            onClick={handleCall}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold touch-manipulation active:opacity-70"
            style={{ background: '#1C3A2F', color: '#fff' }}
          >
            <Phone size={14} /> Call
          </button>
        </div>
      </div>
    </div>
  );
};

export { formatPhone, getLatestNote };
export default SwipeableLeadCard;
