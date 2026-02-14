import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Clock, StickyNote, Calendar, ArrowUp } from 'lucide-react';
import ActionButtonGroup from './ActionButtonGroup';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const LeadActionCard = ({ lead, onAction, onStatusChange }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const cardRef = useRef(null);

  // Background colors based on drag
  const background = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    ['#FEE2E2', '#FEE2E2', '#FFFFFF', '#ECFDF5', '#ECFDF5']
  );

  const handleDragEnd = async (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      // Swipe Right -> Follow Up
      onStatusChange(lead, 'FollowUp');
    } else if (offset < -100 || velocity < -500) {
      // Swipe Left -> Lost
      onStatusChange(lead, 'Lost');
    }
    
    // Reset animation
    controls.start({ x: 0 });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Open': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Open</Badge>;
      case 'FollowUp': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Follow-up</Badge>;
      case 'Booked': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Booked</Badge>;
      case 'Lost': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Lost</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const daysSince = lead.assignmentTimestamp 
    ? Math.floor((new Date() - new Date(lead.assignmentTimestamp)) / (1000 * 60 * 60 * 24)) 
    : 0;

  const lastNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;

  return (
    <motion.div
      style={{ background }}
      className="relative overflow-hidden rounded-xl mb-4 mx-3 md:mx-0 shadow-sm border border-gray-100 touch-pan-y"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="bg-white p-4 rounded-xl relative z-10"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
            <a 
              href={`tel:${lead.phone}`} 
              onClick={(e) => e.stopPropagation()}
              className="text-[#1E88E5] font-medium text-base mt-0.5 block"
            >
              {lead.phone}
            </a>
          </div>
          {getStatusBadge(lead.status)}
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs flex items-center">
            {lead.project}
          </span>
          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs flex items-center">
            <Clock size={10} className="mr-1" /> {daysSince} days ago
          </span>
          {lead.followUpDate && (
            <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs flex items-center">
              <Calendar size={10} className="mr-1" /> {new Date(lead.followUpDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Note Preview */}
        <div 
          onClick={() => onAction('viewNotes', lead)}
          className="bg-gray-50 p-2 rounded-lg mb-3 cursor-pointer border border-gray-100 active:bg-gray-100 transition-colors"
        >
          {lastNote ? (
            <div className="flex gap-2">
              <StickyNote size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 italic line-clamp-2">{lastNote.text}</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <StickyNote size={14} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-400 italic">Tap to add notes...</p>
            </div>
          )}
        </div>

        <ActionButtonGroup lead={lead} onAction={onAction} onStatusChange={onStatusChange} />
        
        {/* Swipe Indicators Hints */}
        <div className="flex justify-between text-[10px] text-gray-300 mt-2 select-none">
          <span>← Swipe to Lose</span>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => onAction('viewNotes', lead)}>
             <ArrowUp size={10} /> Notes
          </div>
          <span>Swipe to Follow-up →</span>
        </div>
      </motion.div>

      {/* Background Action Labels */}
      <div className="absolute inset-0 flex items-center justify-between px-6 z-0">
        <span className="text-red-600 font-bold flex items-center gap-2">Mark Lost</span>
        <span className="text-green-600 font-bold flex items-center gap-2">Follow Up</span>
      </div>
    </motion.div>
  );
};

export default LeadActionCard;