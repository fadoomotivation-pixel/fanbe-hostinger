
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, User, Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MobileBottomNav = ({ onLogout }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const handleLogoutClick = (e) => {
      e.preventDefault();
      onLogout();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-between items-center px-6 pb-safe safe-area-pb lg:hidden h-16 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
       <NavLink 
         to="/crm/employee-dashboard" 
         className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
       >
         <LayoutDashboard size={24} />
         <span className="text-[10px] font-medium">Home</span>
       </NavLink>
       
       <NavLink 
         to="/crm/my-leads" 
         className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
       >
         <Users size={24} />
         <span className="text-[10px] font-medium">Leads</span>
       </NavLink>
       
       <NavLink 
         to="/crm/sales/tasks" 
         className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
       >
         <Calendar size={24} />
         <span className="text-[10px] font-medium">Tasks</span>
       </NavLink>

       <NavLink 
         to="/crm/profile" 
         className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
       >
         <User size={24} />
         <span className="text-[10px] font-medium">Profile</span>
       </NavLink>

       <button 
         onClick={handleLogoutClick}
         className="flex flex-col items-center gap-1 text-red-400"
       >
         <LogOut size={24} />
         <span className="text-[10px] font-medium">Logout</span>
       </button>
    </div>
  );
};

export default MobileBottomNav;
