// src/context/CRMDataContext.jsx
// ✅ SINGLETON: useCRMData hook now reads from this context.
//    fetchLeads() runs ONCE for the entire app — not once per component.
//    Before this fix: every component calling useCRMData() spawned its own
//    independent fetch, causing 2377 leads to load 2-3x on every page load.
import React, { createContext, useContext } from 'react';
import { useCRMDataInternal } from '@/crm/hooks/useCRMData';

const CRMDataContext = createContext(null);

export const CRMDataProvider = ({ children }) => {
  const value = useCRMDataInternal();
  return (
    <CRMDataContext.Provider value={value}>
      {children}
    </CRMDataContext.Provider>
  );
};

// This is the public hook all components import — reads from shared context.
export const useCRMData = () => {
  const ctx = useContext(CRMDataContext);
  if (!ctx) throw new Error('useCRMData must be used inside <CRMDataProvider>');
  return ctx;
};
