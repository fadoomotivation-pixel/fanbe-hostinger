
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import CRMSidebar from './CRMSidebar';
import CRMTopNav from './CRMTopNav';
import { checkDailyDigest } from '@/lib/dailyDigestScheduler';
import { Menu } from 'lucide-react';
import SubAdminFAB from '@/components/SubAdminFAB';
import EmployeeFAB from '@/crm/components/EmployeeFAB';
import { ROLES } from '@/lib/permissions';

const CRMLayout = ({ children }) => {
  const { user } = useAuth();
  const { leads, employees } = useCRMData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Run schedulers when layout loads
    if (user?.role === 'super_admin') {
      checkDailyDigest(leads, employees);
    }
  }, [user, leads, employees]);

  if (!user) return null;

  // --- Admin Layout (Super Admin & Sub Admin) ---
  if ([ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN].includes(user.role)) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300 relative">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white shadow-sm h-16 flex items-center px-4 sticky top-0 z-30">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Menu size={24} />
            </button>
            <span className="ml-3 font-semibold text-lg text-[#0F3A5F]">Fanbe CRM</span>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
            {children}
          </main>

          {/* Sub Admin Floating Action Button */}
          {user.role === ROLES.SUB_ADMIN && <SubAdminFAB />}
        </div>
      </div>
    );
  }

  // --- Sales Executive Layout ---
  return (
    <div className="flex min-h-screen bg-gray-50">
      <CRMSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen transition-all duration-300 relative">
        <CRMTopNav onMobileMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden max-w-7xl mx-auto w-full">
          {children}
        </main>
        <EmployeeFAB />
      </div>
    </div>
  );
};

export default CRMLayout;
