// src/crm/components/MobileBottomNav.jsx
// Unified bottom nav — works same on mobile and tablet
// 4 tabs: Call CRM | Leads | Bookings | Profile
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Phone, Users, Trophy, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { id: 'crm',      label: 'Call CRM',  icon: Phone,   path: '/crm/sales/crm',            activeColor: 'text-green-600',  activeBg: 'bg-green-50' },
  { id: 'leads',    label: 'Leads',     icon: Users,   path: '/crm/sales/my-leads',        activeColor: 'text-blue-600',   activeBg: 'bg-blue-50' },
  { id: 'bookings', label: 'Bookings',  icon: Trophy,  path: '/crm/sales/my-bookings',     activeColor: 'text-yellow-600', activeBg: 'bg-yellow-50' },
  { id: 'profile',  label: 'Profile',   icon: User,    path: '/crm/profile',               activeColor: 'text-gray-600',   activeBg: 'bg-gray-100' },
];

const MobileBottomNav = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-16 lg:hidden" />

      {/* Bottom Nav — mobile/tablet only */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 lg:hidden"
        style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-full">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 relative
                ${isActive ? `${item.activeColor} ${item.activeBg}` : 'text-gray-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-current rounded-b-full" />
                  )}
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
