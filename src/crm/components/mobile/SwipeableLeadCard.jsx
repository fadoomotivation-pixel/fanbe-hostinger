// SwipeableLeadCard.jsx — Premium Real Estate CRM
// Palette: Navy #0F3A5F | Gold #C9A84C | Forest Green #1C3A2F | Warm Cream bg
// Compact action buttons: py-1.5, text-[12px], icon size 13
import React from 'react';
import { Phone, PhoneCall, Clock, MapPin, Activity } from 'lucide-react';
import { isToday, isTomorrow, isYesterday, isPast, differenceInDays } from 'date-fns';

const parseLocalDate = (s) => {
  if (!s) return null;
  const p = s.split('T')[0].split('-').map(Number);
  return p[0] ? new Date(p[0], p[1] - 1, p[2]) : null;
};

const INTEREST_BADGE = {
  hot:  { label: '🔥 Hot',  bg: '#FFF3EE', color: '#B83A0E', border: '#FBBF9A' },
  warm: { label: '🟡 Warm', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  cold: { label: '🔵 Cold', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
};

const STATUS_DOT = {
  New:           '#0F3A5F',
  Open:          '#2563EB',
  FollowUp:      '#C9A84C',
  SiteVisit:     '#7C3AED',
  Booked:        '#1C3A2F',
  NotInterested: '#D1D5DB',
  Lost:          '#EF4444',
  CallBackLater: '#6366F1',
};

const getFollowUpMeta = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  if (isToday(d))     return { label: 'Today',     color: '#92400E', bg: '#FFFBEB' };
  if (isTomorrow(d))  return { label: 'Tomorrow',  color: '#0F3A5F', bg: '#EFF6FF' };
  if (isYesterday(d)) return { label: 'Yesterday', color: '#B83A0E', bg: '#FFF3EE' };
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
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.985] transition-transform touch-manipulation"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(15,58,95,0.08), 0 0 0 1px rgba(15,58,95,0.06)',
      }}
    >
      <div className="p-4">

        {/* Row 1: Name + badge */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-[15px] font-bold leading-snug truncate flex-1" style={{ color: '#0F3A5F' }}>
            {lead?.name || 'Unnamed Lead'}
          </h3>
          {badge ? (
            <span
              className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
            >
              {badge.label}
            </span>
          ) : (
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
              <span className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>{status}</span>
            </span>
          )}
        </div>

        {/* Phone — forest green, premium feel */}
        <p className="text-[14px] font-semibold mb-2" style={{ color: '#1C3A2F' }}>
          {formatPhone(phone)}
        </p>

        {/* Project */}
        {project && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin size={11} style={{ color: '#C9A84C' }} className="shrink-0" />
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>Project: </span>
            <span className="text-[11px] font-semibold truncate" style={{ color: '#374151' }}>{project}</span>
          </div>
        )}

        {/* Last activity */}
        {latestNote && (
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={11} style={{ color: '#9CA3AF' }} className="shrink-0" />
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>Last: </span>
            <span className="text-[11px] truncate" style={{ color: '#6B7280' }}>{latestNote}</span>
          </div>
        )}

        {/* Follow-up pill */}
        {fuMeta && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: fuMeta.bg, color: fuMeta.color }}
            >
              <Clock size={9} /> {fuMeta.label}
            </span>
            {lead?._lastCall?.notes && (
              <span className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>
                {lead._lastCall.notes.split(':').pop()?.trim()}
              </span>
            )}
          </div>
        )}

        {/* Divider — gold-tinted */}
        <div className="h-px mb-2.5" style={{ background: 'rgba(201,168,76,0.18)' }} />

        {/* Action buttons — compact, premium palette */}
        <div className="grid grid-cols-2 gap-2">

          {/* Quick Log — outlined navy */}
          <button
            type="button"
            onClick={handleQuickLog}
            className="flex items-center justify-center gap-1.5 rounded-lg touch-manipulation active:opacity-60"
            style={{
              padding: '6px 0',
              fontSize: '12px',
              fontWeight: 700,
              border: '1.5px solid rgba(15,58,95,0.22)',
              background: 'rgba(15,58,95,0.04)',
              color: '#0F3A5F',
            }}
          >
            <PhoneCall size={13} /> Quick Log
          </button>

          {/* Call — solid gold */}
          <button
            type="button"
            onClick={handleCall}
            className="flex items-center justify-center gap-1.5 rounded-lg touch-manipulation active:opacity-60"
            style={{
              padding: '6px 0',
              fontSize: '12px',
              fontWeight: 700,
              background: '#C9A84C',
              color: '#0F3A5F',
              border: 'none',
            }}
          >
            <Phone size={13} /> Call
          </button>
        </div>
      </div>
    </div>
  );
};

export { formatPhone, getLatestNote };
export default SwipeableLeadCard;
