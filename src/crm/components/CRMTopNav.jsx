
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

  const confirmLogout = () => {
     logout();
  };

  const getRoleTitle = (role) => {
      switch(role) {
          case ROLES.SUPER_ADMIN: return 'Admin Console';
          case ROLES.SUB_ADMIN: return 'Executive CRM Portal';
          case ROLES.EMPLOYEE: return 'Sales Dashboard';
          default: return 'CRM';
      }
  };

  return (
    <>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 h-16 shadow-sm">
      <div className="px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
           <button 
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md mr-2"
            onClick={onMobileMenuToggle}
          >
            <Menu size={24} />
          </button>
          
          <h1 className="text-lg font-semibold text-[#0F3A5F] hidden sm:block">
            {getRoleTitle(user?.role)}
          </h1>
        </div>

        <div className="flex items-center gap-4">
           {/* User Info */}
           <div className="flex flex-col items-end hidden md:flex">
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              <span className="text-xs text-gray-500">
                Last Login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Today'}
              </span>
           </div>
           
           <div className="flex items-center gap-2">
             <div className="h-9 w-9 bg-[#0F3A5F] text-white rounded-full flex items-center justify-center font-bold">
               {user?.name?.charAt(0).toUpperCase()}
             </div>
             <button 
               onClick={handleLogoutClick}
               className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
               title="Logout"
             >
               <LogOut size={20} />
             </button>
           </div>
        </div>
      </div>
    </header>

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

export default CRMTopNav;
