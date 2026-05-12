
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, Settings, LogOut, Bell, 
  UserCheck, FileText, X, BarChart2, ClipboardList, 
  Image as ImageIcon, Globe, Monitor, Menu as MenuIcon, 
  Layers, Shield, Phone, PhoneCall, TrendingUp, PieChart,
  User, CheckSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getVisibleMenuItems, ROLES } from '@/lib/permissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const IconMap = {
  LayoutDashboard, Users, UserPlus, Settings, LogOut, Bell,
  UserCheck, FileText, X, BarChart2, ClipboardList,
  ImageIcon, Globe, Monitor, MenuIcon, Layers, Shield,
  Phone, PhoneCall, TrendingUp, PieChart, User, CheckSquare
};

const CRMSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  
  // Dynamic replacement of labels/paths
  const menuItems = user ? getVisibleMenuItems(user.role).map(item => {
      // Replace Staff Management with Employee Management
      if (item.label === 'Staff Management' || item.path === '/crm/admin/employees') {
          return { ...item, label: 'Employee Management', path: '/crm/admin/employee-management' };
      }
      return item;
  }) : [];
  
  // Add Promotion Materials link for non-super-admins if not already present
  if (user && user.role !== ROLES.SUPER_ADMIN) {
     const hasPromo = menuItems.find(i => i.path === '/crm/sales/tools');
     if (!hasPromo) {
         menuItems.push({ label: 'Promo Materials', path: '/crm/sales/tools', icon: 'FileText' });
     }
  }

  const isActive = (path) => location.pathname.startsWith(path);

  const getRoleLabel = (role) => {
    switch(role) {
      case ROLES.SUPER_ADMIN: return 'Super Admin';
      case ROLES.SUB_ADMIN: return 'Executive CRM';
      case ROLES.EMPLOYEE: return 'Sales Executive';
      default: return 'User';
    }
  };

  const handleLogoutClick = () => {
      setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
      logout();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed left-0 top-0 bottom-0 bg-[#0F3A5F] text-white z-50 transition-transform duration-300 ease-in-out
        w-64 flex flex-col shadow-2xl overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Fanbe CRM</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
              {user ? getRoleLabel(user.role) : 'Admin'}
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = IconMap[item.icon] || LayoutDashboard;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={() => { if(window.innerWidth < 1024) onClose() }}
                className={`
                  flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 group
                  min-h-[44px]
                  ${isActive(item.path) 
                    ? 'bg-[#D4AF37] text-[#0F3A5F] font-bold shadow-lg' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon size={20} className={isActive(item.path) ? 'text-[#0F3A5F]' : 'text-gray-400 group-hover:text-white'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          
           {/* Super Admin specific link for Promo Manager */}
           {user && user.role === ROLES.SUPER_ADMIN && (
               <Link
                to="/crm/admin/cms/promotion-materials"
                onClick={() => { if(window.innerWidth < 1024) onClose() }}
                className={`
                  flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 group min-h-[44px]
                  ${isActive('/crm/admin/cms/promotion-materials') ? 'bg-[#D4AF37] text-[#0F3A5F] font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                `}
               >
                 <FileText size={20} />
                 <span className="text-sm font-medium">Promo Materials</span>
               </Link>
           )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0a2742] shrink-0">
          <div className="flex items-center space-x-3 mb-4 px-2">
             <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold uppercase text-white">
               {user?.name?.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium truncate">{user?.name}</p>
               <p className="text-xs text-gray-400 truncate">{user?.email}</p>
             </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 w-full transition-colors min-h-[44px]"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent>
              <DialogHeader><DialogTitle>Confirm Logout</DialogTitle></DialogHeader>
              <p>Are you sure you want to logout?</p>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmLogout}>Logout</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
};

export default CRMSidebar;
