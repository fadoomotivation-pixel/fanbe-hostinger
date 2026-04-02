// src/crm/components/mobile/SwipeableLeadCard.jsx
// Swipeable lead card — swipe right to call, swipe left for quick actions
import React, { useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Phone, Calendar, Clock, StickyNote, Copy, CheckCircle, ChevronRight } from 'lucide-react';

const SWIPE_THRESHOLD = 80;

const getLeadFollowUp = (lead) => lead?.follow_up_date || lead?.followUpDate || null;

const SwipeableLeadCard = ({
  children,
  lead,
  onCall,
  onQuickAction,
  onTap,
  onQuickLog,
  statusColors = {},
  formatPhone = (v) => v,
  formatAssignedTime,
  getLatestNote,
  copiedId,
  onCopyPhone,
}) => {
  const x = useMotionValue(0);

  // Backwards compatibility for MyLeads page prop names
  const handleCall = onCall || (() => {
    if (lead?.phone) window.location.href = `tel:${lead.phone}`;
  });
  const handleQuickAction = onQuickAction || onQuickLog;

  // Background colors based on swipe direction
  const rightBg = useTransform(x, [0, SWIPE_THRESHOLD], ['rgba(16,185,129,0)', 'rgba(16,185,129,0.15)']);
  const leftBg = useTransform(x, [-SWIPE_THRESHOLD, 0], ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0)']);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD], [0.5, 0.8, 1]);
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0], [1, 0.8, 0.5]);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe right → Call
      handleCall?.(lead);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe left → Quick action menu
      handleQuickAction?.(lead);
    }
  }, [lead, handleCall, handleQuickAction]);

  const followUp = getLeadFollowUp(lead);
  const latestNote = getLatestNote?.(lead?.notes);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe-right background (Call) */}
      <motion.div
        style={{ background: rightBg }}
        className="absolute inset-0 flex items-center pl-6 rounded-2xl"
      >
        <motion.div style={{ scale: rightIconScale }} className="flex items-center gap-2 text-emerald-600">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
            <Phone size={18} />
          </div>
          <span className="text-sm font-bold">Call</span>
        </motion.div>
      </motion.div>

      {/* Swipe-left background (Quick Action) */}
      <motion.div
        style={{ background: leftBg }}
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-2xl"
      >
        <motion.div style={{ scale: leftIconScale }} className="flex items-center gap-2 text-blue-600">
          <span className="text-sm font-bold">Follow-up</span>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
            <Calendar size={18} />
          </div>
        </motion.div>
      </motion.div>

      {/* Card content — draggable */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        className="relative z-10 touch-manipulation"
      >
        {children || (
          <div onClick={onTap} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm active:scale-[0.99] transition-transform">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 truncate">{lead?.name || 'Unnamed Lead'}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <span>{formatPhone(lead?.phone || '')}</span>
                  {onCopyPhone && lead?.phone && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCopyPhone(lead.phone, lead.id); }}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label="Copy phone"
                    >
                      {copiedId === lead?.id ? <CheckCircle size={14} className="text-emerald-600" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  )}
                </div>
                {lead?.project && <p className="text-xs text-gray-500 mt-1 truncate">{lead.project}</p>}
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusColors[lead?.status] || 'bg-gray-100 text-gray-700'}`}>
                {lead?.status || 'New'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1 min-w-0">
                <Clock size={12} className="shrink-0" />
                <span className="truncate">{formatAssignedTime?.(lead?.assignedAt || lead?.assigned_at || lead?.createdAt || lead?.created_at) || 'Recently assigned'}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <Calendar size={12} className="shrink-0" />
                <span className="truncate">{followUp ? `FU: ${followUp.split('T')[0]}` : 'No follow-up'}</span>
              </div>
            </div>

            {latestNote && (
              <div className="mt-2 flex items-start gap-1 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                <StickyNote size={12} className="mt-0.5 shrink-0 text-gray-400" />
                <p className="line-clamp-2">{latestNote}</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleQuickAction?.(lead); }}
                className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg"
              >
                Quick Log
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCall?.(lead); }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg"
              >
                <Phone size={12} /> Call
              </button>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SwipeableLeadCard;
