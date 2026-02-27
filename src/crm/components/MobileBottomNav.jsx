import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MobileBottomNav = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const employeeNavItems = [
    {
      id: 'home',
      label: 'Home',
      icon: LayoutDashboard,
      path: '/crm/employee-dashboard',
      color: 'text-blue-600'
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      path: '/crm/my-leads',
      color: 'text-blue-600'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: Calendar,
      path: '/crm/sales/tasks',
      color: 'text-blue-600'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/crm/profile',
      color: 'text-blue-600'
    }
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 lg:hidden" />
      
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] safe-area-pb">
        <div className="flex justify-around items-center h-full px-2">
          {employeeNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 ${
                  isActive ? item.color : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    size={isActive ? 24 : 22} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all"
                  />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
