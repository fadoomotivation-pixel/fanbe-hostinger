import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BarChart3 } from 'lucide-react';

const SubAdminBottomNav = () => {
  const location = useLocation();

  const navItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
      path: '/crm/admin/dashboard',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Leads',
      path: '/crm/admin/leads',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Staff',
      path: '/crm/admin/staff-management',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Reports',
      path: '/crm/admin/staff-performance',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default SubAdminBottomNav;
