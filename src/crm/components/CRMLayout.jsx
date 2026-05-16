// src/crm/components/CRMLayout.jsx
// ✅ FIX: mobile overflow — overflow-x:hidden on root, min-w-0 on flex children,
//         employee <main> has p-0 so full-width pages (MyLeads) own their padding
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import CRMSidebar from './CRMSidebar';
import CRMTopNav from './CRMTopNav';
import { checkDailyDigest } from '@/lib/dailyDigestScheduler';
import { Menu } from 'lucide-react';
import SubAdminFAB from '@/components/SubAdminFAB';
import EmployeeFAB from '@/crm/components/EmployeeFAB';
import SubAdminBottomNav from '@/crm/components/SubAdminBottomNav';
import MobileBottomNav from '@/crm/components/MobileBottomNav';
import { ROLES } from '@/lib/permissions';

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.HR_MANAGER];

const CRMLayout = ({ children }) => {
  const { user } = useAuth();
  const { leads, employees } = useCRMData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role === ROLES.SUPER_ADMIN) {
      checkDailyDigest(leads, employees);
    }
  }, [user, leads, employees]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F3A5F] mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Admin / Sub-Admin / HR-Manager Layout ─────────────────────────────────
  if (ADMIN_ROLES.includes(user.role)) {
    return (
      // KEY FIX: overflow-x-hidden on root stops any child blowing past 100vw
      <div className="flex min-h-screen bg-gray-100 overflow-x-hidden">
        <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* KEY FIX: min-w-0 prevents flex child from growing beyond parent */}
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300 min-w-0 overflow-x-hidden">

          {/* ── Mobile Top Bar ── */}
          <header className="lg:hidden bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm w-full">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-base text-[#0F3A5F] tracking-tight truncate mx-2">
              {user.role === ROLES.HR_MANAGER ? '🏢 HR Portal' : 'Fanbe CRM'}
            </span>
            <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </header>

          {/* ── Page Content ── */}
          {/* overflow-x-hidden here clips anything the child pages might overflow */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden pb-20 lg:pb-8 w-full min-w-0">
            {children}
          </main>

          {user.role === ROLES.SUB_ADMIN && <SubAdminFAB />}
          {user.role === ROLES.SUB_ADMIN && (
            <SubAdminBottomNav onMenuClick={() => setSidebarOpen(true)} />
          )}
        </div>
      </div>
    );
  }

  // ── Sales Executive / Telecaller Layout ─────────────────────────────────
  // KEY FIX: p-0 on <main> — employee pages like MyLeads manage their own
  //          padding internally. Adding layout-level padding caused double-padding
  //          and made content appear wider than the screen on 360px devices.
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300 min-w-0 overflow-x-hidden">
        <CRMTopNav onMobileMenuToggle={() => setSidebarOpen(true)} />
        {/* p-0 here: full-bleed pages (MyLeads, LeadDetail) handle their own padding */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0 pb-20 lg:pb-6" style={{ padding: 0 }}>
          {children}
        </main>
        <EmployeeFAB />
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default CRMLayout;
