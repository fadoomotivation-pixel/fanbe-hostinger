// src/crm/components/MobileBottomNav.jsx
// ✅ PALETTE: Premium real estate — Navy #0F3A5F, Gold #C9A84C, Forest Green #1C3A2F
// Active tab: gold indicator line + navy icon/label
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Phone, Users, MapPin, Trophy, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { id: 'crm',      label: 'Call CRM',    icon: Phone,  path: '/crm/sales/crm' },
  { id: 'leads',    label: 'Leads',       icon: Users,  path: '/crm/sales/my-leads' },
  { id: 'visits',   label: 'Site Visits', icon: MapPin, path: '/crm/sales/site-visits' },
  { id: 'bookings', label: 'Booked',      icon: Trophy, path: '/crm/sales/bookings' },
  { id: 'profile',  label: 'Profile',     icon: User,   path: '/crm/profile' },
];

const MobileBottomNav = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-16 lg:hidden" />

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E5E1DB',
          height: '60px',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 12px rgba(15,58,95,0.08)',
        }}
      >
        <div className="flex h-full">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 relative touch-manipulation"
              style={({ isActive }) => ({
                color: isActive ? '#0F3A5F' : '#9CA3AF',
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Gold top indicator bar */}
                  {isActive && (
                    <div
                      className="absolute top-0 inset-x-2 rounded-b-full"
                      style={{ height: '3px', background: '#C9A84C' }}
                    />
                  )}
                  {/* Subtle navy highlight behind active icon */}
                  {isActive && (
                    <div
                      className="absolute inset-x-1 inset-y-1 rounded-xl"
                      style={{ background: 'rgba(15,58,95,0.06)' }}
                    />
                  )}
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                  <span
                    className="text-[10px] font-medium"
                    style={{
                      position: 'relative', zIndex: 1,
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
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
