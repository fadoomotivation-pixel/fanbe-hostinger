// src/crm/components/CRMLayout.jsx
// ✅ FIX: Employee mobile top bar restored (menu button was missing)
// ✅ PALETTE: Premium real estate — Navy #0F3A5F, Gold #C9A84C, Forest Green #1C3A2F
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import CRMSidebar from './CRMSidebar';
import CRMTopNav from './CRMTopNav';
import { checkDailyDigest } from '@/lib/dailyDigestScheduler';
import { Menu, LogOut } from 'lucide-react';
import SubAdminFAB from '@/components/SubAdminFAB';
import EmployeeFAB from '@/crm/components/EmployeeFAB';
import SubAdminBottomNav from '@/crm/components/SubAdminBottomNav';
import MobileBottomNav from '@/crm/components/MobileBottomNav';
import { ROLES } from '@/lib/permissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN, ROLES.HR_MANAGER];

const CRMLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { leads, employees } = useCRMData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user?.role === ROLES.SUPER_ADMIN) {
      checkDailyDigest(leads, employees);
    }
  }, [user, leads, employees]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: '#C9A84C' }} />
          <p className="mt-4 text-sm" style={{ color: '#6B7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ── Admin / Sub-Admin / HR-Manager Layout ─────────────────────────────────
  if (ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen" style={{ background: '#F3F0EB' }}>
        <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300">

          {/* ── Admin Mobile Top Bar ── */}
          <header
            className="lg:hidden h-14 flex items-center justify-between px-4 sticky top-0 z-30"
            style={{
              background: '#0F3A5F',
              boxShadow: '0 2px 8px rgba(15,58,95,0.18)',
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-1 rounded-lg touch-manipulation active:opacity-70"
              style={{ color: '#C9A84C' }}
            >
              <Menu size={22} />
            </button>

            {/* Fanbe wordmark */}
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight" style={{ color: '#FFFFFF' }}>
                Fanbe
              </span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#C9A84C', color: '#0F3A5F' }}
              >
                {user.role === ROLES.HR_MANAGER ? 'HR' : 'CRM'}
              </span>
            </div>

            {user.role === ROLES.SUPER_ADMIN ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                aria-label="Sign out"
                className="h-8 w-8 rounded-full flex items-center justify-center transition-colors touch-manipulation active:opacity-70"
                style={{ background: 'rgba(201,168,76,0.18)', color: '#C9A84C' }}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#C9A84C', color: '#0F3A5F' }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden pb-20 lg:pb-8">
            {children}
          </main>

          {user.role === ROLES.SUB_ADMIN && <SubAdminFAB />}
          {user.role === ROLES.SUB_ADMIN && (
            <SubAdminBottomNav onMenuClick={() => setSidebarOpen(true)} />
          )}
        </div>

        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm Logout</DialogTitle></DialogHeader>
            <p className="text-gray-600 text-sm">Are you sure you want to sign out?</p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => logout()}>Sign Out</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Sales Executive / Telecaller Layout ──────────────────────────────────
  return (
    <div className="flex min-h-screen" style={{ background: '#F7F5F0' }}>
      <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300">

        {/*
          ✅ FIXED: Employee mobile top bar — menu button always visible.
          Hidden on lg+ where the full CRMTopNav takes over.
        */}
        <header
          className="lg:hidden h-14 flex items-center justify-between px-4 sticky top-0 z-30"
          style={{
            background: '#0F3A5F',
            boxShadow: '0 2px 8px rgba(15,58,95,0.18)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-1 rounded-lg touch-manipulation active:opacity-70"
            style={{ color: '#C9A84C' }}
          >
            <Menu size={22} />
          </button>

          {/* Fanbe wordmark */}
          <div className="flex items-center gap-2">
            <span className="font-black text-base tracking-tight" style={{ color: '#FFFFFF' }}>
              Fanbe
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#C9A84C', color: '#0F3A5F' }}
            >
              Sales
            </span>
          </div>

          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: '#C9A84C', color: '#0F3A5F' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Desktop top nav */}
        <div className="hidden lg:block">
          <CRMTopNav onMobileMenuToggle={() => setSidebarOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 lg:p-6 lg:max-w-7xl lg:mx-auto lg:w-full">
          {children}
        </main>

        <EmployeeFAB />
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default CRMLayout;
