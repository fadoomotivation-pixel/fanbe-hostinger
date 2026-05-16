import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

const FollowUpBadge = ({ followUpDate, followUpTime, size = 'default' }) => {
  if (!followUpDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const followUp = new Date(followUpDate);
  followUp.setHours(0, 0, 0, 0);
  
  const diffTime = followUp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isSmall = size === 'small';
  const iconSize = isSmall ? 10 : 14;
  const textSize = isSmall ? 'text-[10px]' : 'text-xs';

  // Overdue (past date)
  if (diffDays < 0) {
    return (
      <Badge className={`bg-red-100 text-red-700 hover:bg-red-200 ${textSize} flex items-center gap-1`}>
        <AlertCircle size={iconSize} />
        Overdue {Math.abs(diffDays)}d
        {followUpTime && <span className="ml-1">• {followUpTime}</span>}
      </Badge>
    );
  }

  // Today
  if (diffDays === 0) {
    return (
      <Badge className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-200 ${textSize} flex items-center gap-1 animate-pulse`}>
        <Clock size={iconSize} />
        Today
        {followUpTime && <span className="ml-1">@ {followUpTime}</span>}
      </Badge>
    );
  }

  // Tomorrow
  if (diffDays === 1) {
    return (
      <Badge className={`bg-blue-100 text-blue-700 hover:bg-blue-200 ${textSize} flex items-center gap-1`}>
        <Calendar size={iconSize} />
        Tomorrow
        {followUpTime && <span className="ml-1">• {followUpTime}</span>}
      </Badge>
    );
  }

  // This week (2-7 days)
  if (diffDays <= 7) {
    return (
      <Badge className={`bg-indigo-100 text-indigo-700 hover:bg-indigo-200 ${textSize} flex items-center gap-1`}>
        <Calendar size={iconSize} />
        In {diffDays} days
        {followUpTime && <span className="ml-1">• {followUpTime}</span>}
      </Badge>
    );
  }

  // Future (more than a week)
  const formattedDate = new Date(followUpDate).toLocaleDateString('en-IN', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return (
    <Badge className={`bg-gray-100 text-gray-600 hover:bg-gray-200 ${textSize} flex items-center gap-1`}>
      <Calendar size={iconSize} />
      {formattedDate}
      {followUpTime && <span className="ml-1">• {followUpTime}</span>}
    </Badge>
  );
};

export default FollowUpBadge;
