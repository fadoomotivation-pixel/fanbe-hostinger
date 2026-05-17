// src/crm/components/mobile/LeadCardMobile.jsx
// Mobile-optimized lead card wrapper with swipe gestures and larger touch targets
import React from 'react';
import SwipeableLeadCard from './SwipeableLeadCard';

const LeadCardMobile = ({ lead, children, onCall, onQuickAction }) => {
  const handleCall = (lead) => {
    if (onCall) {
      onCall(lead);
    } else if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
  };

  return (
    <SwipeableLeadCard
      lead={lead}
      onCall={handleCall}
      onQuickAction={onQuickAction}
    >
      {children}
    </SwipeableLeadCard>
  );
};

export default LeadCardMobile;
