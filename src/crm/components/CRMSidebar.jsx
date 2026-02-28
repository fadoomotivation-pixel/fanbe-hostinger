// src/crm/components/CRMSidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Settings, LogOut, Bell,
  UserCheck, FileText, X, BarChart2, ClipboardList,
  Image as ImageIcon, Globe, Monitor, Menu as MenuIcon,
  Layers, Shield, Phone, PhoneCall, TrendingUp, PieChart,
  User, CheckSquare, CalendarCheck, IndianRupee, FolderOpen,
  Briefcase, MapPin, MessageSquare, UserCircle, Upload,
  Search, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getVisibleMenuItems, ROLES } from '@/lib/permissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const IconMap = {
  LayoutDashboard, Users, UserPlus, Settings, LogOut, Bell,
  UserCheck, FileText, X, BarChart2, ClipboardList,
  ImageIcon, Globe, Monitor, MenuIcon, Layers, Shield,
  Phone, PhoneCall, TrendingUp, PieChart, User, CheckSquare,
  CalendarCheck, IndianRupee, FolderOpen,
  // ✅ New icons added for HR & new menu items
  Briefcase, MapPin, MessageSquare, UserCircle, Upload,
  Search, Zap,
};

// Group header visual config
const GROUP_CONFIG = {
  HR:          { label: '— HR & Payroll —',    color: 'text-yellow-400' },
  'HR Overview': { label: '— HR Overview —',   color: 'text-yellow-400' },
  Reports:     { label: '— Reports —',          color: 'text-blue-300'  },
  System:      { label: '— System —',           color: 'text-gray-400'  },
};

const CRMSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const rawItems = user
    ? getVisibleMenuItems(user.role).map(item => {
        if (
          item.label === 'Staff Management' ||
          item.path  === '/crm/admin/employees'
        ) {
          return { ...item, label: 'Employee Management', path: '/crm/admin/employee-management' };
        }
        return item;
      })
    : [];

  // Promo Materials for non-super-admin roles (not HR)
  if (user && user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.HR_MANAGER) {
    const hasPromo = rawItems.find(i => i.path === '/crm/sales/tools');
    if (!hasPromo) rawItems.push({ label: 'Promo Materials', path: '/crm/sales/tools', icon: 'FileText' });
  }

  const isActive = path => location.pathname === path || location.pathname.startsWith(path + '/');

  const getRoleLabel = role => ({
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.SUB_ADMIN]:   'Business Ops',
    [ROLES.HR_MANAGER]:  'HR Manager',
    [ROLES.MANAGER]:     'Manager',
    [ROLES.SALES_EXECUTIVE]: 'Sales Executive',
    [ROLES.TELECALLER]:  'Telecaller',
  }[role] || 'User');

  // Role accent colors for sidebar header
  const getRoleAccent = role => ({
    [ROLES.SUPER_ADMIN]: 'bg-[#D4AF37]',
    [ROLES.SUB_ADMIN]:   'bg-purple-500',
    [ROLES.HR_MANAGER]:  'bg-amber-500',
    [ROLES.MANAGER]:     'bg-indigo-500',
    [ROLES.SALES_EXECUTIVE]: 'bg-blue-500',
    [ROLES.TELECALLER]:  'bg-pink-500',
  }[role] || 'bg-blue-500');

  const renderMenu = () => {
    let lastGroup = null;
    return rawItems.map((item, idx) => {
      const Icon = IconMap[item.icon] || LayoutDashboard;
      const groupChanged = item.group && item.group !== lastGroup;
      const groupHeader  = groupChanged ? (
        <div key={`grp-${item.group}-${idx}`} className="px-4 pt-5 pb-1.5">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${
            GROUP_CONFIG[item.group]?.color || 'text-gray-400'
          }`}>
            {GROUP_CONFIG[item.group]?.label || item.group}
          </p>
        </div>
      ) : null;
      if (groupChanged) lastGroup = item.group;
      return (
        <React.Fragment key={idx}>
          {groupHeader}
          <Link
            to={item.path}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              min-h-[48px] touch-manipulation
              ${ isActive(item.path)
                  ? 'bg-[#D4AF37] text-[#0F3A5F] font-bold shadow-md'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white active:bg-white/20'
              }
            `}
          >
            <Icon
              size={19}
              className={`shrink-0 ${
                isActive(item.path) ? 'text-[#0F3A5F]' : 'text-gray-400 group-hover:text-white'
              }`}
            />
            <span className="text-sm font-medium leading-tight">{item.label}</span>
          </Link>
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed left-0 top-0 bottom-0 bg-[#0F3A5F] text-white z-50
        transition-transform duration-300 ease-in-out
        w-[72vw] max-w-[260px] min-w-[220px]
        flex flex-col shadow-2xl overscroll-contain
        ${ isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0' }
      `}>

        {/* Logo / Role header */}
        <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 ${
              getRoleAccent(user?.role)
            }`}>
              {user?.name?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold leading-tight truncate">{user?.name || 'Fanbe CRM'}</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                {getRoleLabel(user?.role)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 overscroll-contain">
          {renderMenu()}

          {/* Promo Materials for super admin */}
          {user?.role === ROLES.SUPER_ADMIN && (
            <Link
              to="/crm/admin/cms/promotion-materials"
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group min-h-[48px] touch-manipulation
                ${ isActive('/crm/admin/cms/promotion-materials')
                    ? 'bg-[#D4AF37] text-[#0F3A5F] font-bold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              <FileText size={19} className="shrink-0" />
              <span className="text-sm font-medium">Promo Materials</span>
            </Link>
          )}
        </nav>

        {/* Footer: user info + logout */}
        <div className="px-3 py-4 border-t border-white/10 bg-[#0a2742] shrink-0">
          <div className="px-2 mb-3">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-300
              hover:bg-red-500/10 hover:text-red-200 active:bg-red-500/20
              transition-colors min-h-[48px] touch-manipulation"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Logout confirm dialog */}
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
    </>
  );
};

export default CRMSidebar;
