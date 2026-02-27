// src/crm/components/CRMLayout.jsx
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
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300">

          {/* ── Mobile Top Bar ── */}
          <header className="lg:hidden bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-base text-[#0F3A5F] tracking-tight">
              {user.role === ROLES.HR_MANAGER ? '🏢 HR Portal' : 'Fanbe CRM'}
            </span>
            {/* Avatar badge top-right */}
            <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </header>

          {/* ── Page Content ── */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden pb-20 lg:pb-8">
            {children}
          </main>

          {/* Sub Admin FAB only (for desktop quick actions) */}
          {user.role === ROLES.SUB_ADMIN && <SubAdminFAB />}
          
          {/* SubAdmin Mobile Bottom Navigation */}
          {user.role === ROLES.SUB_ADMIN && (
            <SubAdminBottomNav onMenuClick={() => setSidebarOpen(true)} />
          )}
        </div>
      </div>
    );
  }

  // ── Sales Executive / Telecaller Layout ─────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300">
        <CRMTopNav onMobileMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden max-w-7xl mx-auto w-full pb-20 lg:pb-6">
          {children}
        </main>
        <EmployeeFAB />
        
        {/* Employee Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default CRMLayout;
