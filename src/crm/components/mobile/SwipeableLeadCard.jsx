// src/crm/components/mobile/SwipeableLeadCard.jsx
// Swipeable lead card — swipe right to call, swipe left for quick actions
import React, { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Phone, Calendar, Clock, CheckCircle } from 'lucide-react';

const SWIPE_THRESHOLD = 80;

const SwipeableLeadCard = ({ children, lead, onCall, onQuickAction }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);

  // Background colors based on swipe direction
  const rightBg = useTransform(x, [0, SWIPE_THRESHOLD], ['rgba(16,185,129,0)', 'rgba(16,185,129,0.15)']);
  const leftBg = useTransform(x, [-SWIPE_THRESHOLD, 0], ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0)']);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD], [0.5, 0.8, 1]);
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD / 2, 0], [1, 0.8, 0.5]);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe right → Call
      onCall?.(lead);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe left → Quick action menu
      onQuickAction?.(lead);
    }
    setIsRevealed(false);
  }, [lead, onCall, onQuickAction]);

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
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableLeadCard;
