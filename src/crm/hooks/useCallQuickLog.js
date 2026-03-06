import { useState } from 'react';

export const useCallQuickLog = () => {
  const [quickLogState, setQuickLogState] = useState({ isOpen: false, lead: null });

  const initiateCallWithQuickLog = (lead) => {
    window.location.href = `tel:${lead.phone}`;
    setQuickLogState({ isOpen: true, lead });
  };

  const closeQuickLog = () => setQuickLogState({ isOpen: false, lead: null });

  return { quickLogState, initiateCallWithQuickLog, closeQuickLog };
};
