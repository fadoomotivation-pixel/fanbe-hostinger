// src/crm/components/mobile/BottomSheet.jsx
// Draggable bottom sheet for mobile — uses framer-motion for swipe-to-dismiss
import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

const BottomSheet = ({ open, onClose, title, subtitle, children, maxHeight = '92vh' }) => {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 touch-none"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
            style={{ maxHeight, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between px-4 mb-3">
                <div>
                  {title && <p className="font-black text-[#0F3A5F] text-lg leading-tight">{title}</p>}
                  {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-gray-100 active:bg-gray-200 touch-manipulation"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
