import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, BarChart3, Menu } from 'lucide-react';

const SubAdminBottomNav = ({ onMenuClick }) => {
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/crm/dashboard',
      color: 'text-blue-600'
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      path: '/crm/leads',
      color: 'text-blue-600'
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: UserCog,
      path: '/crm/staff',
      color: 'text-blue-600'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      path: '/crm/reports',
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
          {navItems.map((item) => (
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
          
          {/* More/Menu Button */}
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-400 hover:text-gray-600 transition-all duration-200 active:scale-95"
          >
            <Menu size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SubAdminBottomNav;
