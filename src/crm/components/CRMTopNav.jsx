// src/crm/components/CRMTopNav.jsx
// ✅ PALETTE: Premium real estate — Navy #0F3A5F, Gold #C9A84C, Forest Green #1C3A2F
// Desktop top bar for all roles
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ListTodo, TrendingUp, User, LogOut, Menu, X, FileText, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const CRMTopNav = ({ onMobileMenuToggle }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => { logout(); };

  const getRoleTitle = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN: return 'Admin Console';
      case ROLES.SUB_ADMIN:   return 'Executive CRM Portal';
      case ROLES.EMPLOYEE:    return 'Sales Dashboard';
      default:                return 'CRM';
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 h-16"
        style={{
          background: '#0F3A5F',
          boxShadow: '0 2px 8px rgba(15,58,95,0.20)',
        }}
      >
        <div className="px-5 h-full flex items-center justify-between">

          {/* Left: menu toggle + title */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-1 rounded-lg touch-manipulation active:opacity-70"
              style={{ color: '#C9A84C' }}
              onClick={onMobileMenuToggle}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Fanbe wordmark */}
            <div className="flex items-center gap-2">
              <span className="font-black text-[17px] tracking-tight" style={{ color: '#FFFFFF' }}>
                Fanbe
              </span>
              <span
                className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                {getRoleTitle(user?.role)}
              </span>
            </div>
          </div>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold" style={{ color: '#F0EDE8' }}>{user?.name}</span>
              <span className="text-xs" style={{ color: 'rgba(201,168,76,0.75)' }}>
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
              </span>
            </div>

            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: '#C9A84C', color: '#0F3A5F' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className="p-2 rounded-full transition-colors touch-manipulation active:opacity-70"
              style={{ color: 'rgba(201,168,76,0.7)' }}
              title="Logout"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Logout</DialogTitle></DialogHeader>
          <p className="text-gray-600 text-sm">Are you sure you want to sign out?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmLogout}>Sign Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CRMTopNav;
