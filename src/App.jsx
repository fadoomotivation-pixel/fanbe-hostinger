
import React, { useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import SiteVisitModal from './components/SiteVisitModal';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsListingPage from './pages/ProjectsListingPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import WhyInvestPage from './pages/WhyInvestPage';
import ContactPage from './pages/ContactPage';

// CRM Imports
import ProtectedRoute from './components/ProtectedRoute';
import CRMLayout from './crm/components/CRMLayout';
import CRMLogin from './crm/pages/CRMLogin';
import ForgotPassword from './crm/pages/ForgotPassword';
import CRMAdminDashboard from './crm/pages/CRMAdminDashboard';
import SalesExecutiveDashboard from './crm/pages/SalesExecutiveDashboard';
import SalesExecutivePerformance from './crm/pages/SalesExecutivePerformance';
import DailyWorkLog from './crm/pages/DailyWorkLog';
import EmployeeManagement from './crm/pages/EmployeeManagement';
import LeadManagement from './crm/pages/LeadManagement';
import CustomerManagement from './crm/pages/CustomerManagement';
import InvoiceManagement from './crm/pages/InvoiceManagement';
import MasterSettings from './crm/pages/MasterSettings';
import CRMProfile from './crm/pages/CRMProfile';
import NotificationSettings from './crm/pages/NotificationSettings';
import WhatsAppTemplates from './crm/pages/WhatsAppTemplates';
import EmployeeWorkHistory from './crm/pages/EmployeeWorkHistory';
import AdminDailyReports from './crm/pages/AdminDailyReports';
import AdminPerformanceDashboard from './crm/pages/AdminPerformanceDashboard';
import ProjectManagement from './crm/pages/ProjectManagement';

// New Sub Admin Imports
import SubAdminDashboard from './crm/pages/SubAdminDashboard';
import SubAdminManagement from './crm/pages/SubAdminManagement';
import StaffManagementSubAdmin from './crm/pages/StaffManagementSubAdmin';
import StaffPerformanceSubAdmin from './crm/pages/StaffPerformanceSubAdmin';
import RevenueAnalytics from './crm/pages/RevenueAnalytics';
import CallAnalytics from './crm/pages/CallAnalytics';
import BookingAnalytics from './crm/pages/BookingAnalytics';

// New Sales Executive Imports
import MyLeads from './crm/pages/MyLeads';
import EmployeeLeadList from './crm/pages/EmployeeLeadList';
import EmployeeLeadDetails from './crm/pages/EmployeeLeadDetails';
import EmployeeDashboard from './crm/pages/EmployeeDashboard';
import DailyCalling from './crm/pages/DailyCalling';
import SiteVisits from './crm/pages/SiteVisits';
import Bookings from './crm/pages/Bookings';
import Tasks from './crm/pages/Tasks';
import EODReports from './crm/pages/EODReports';
import SalesTools from './crm/pages/SalesTools';

// Mobile Optimized Pages
import MobileEmployeeDashboard from './crm/pages/MobileEmployeeDashboard';
import MobileLeadList from './crm/pages/MobileLeadList';
import MobileLeadDetails from './crm/pages/MobileLeadDetails';
import MobileBottomNav from './crm/components/MobileBottomNav';
import { useMobile } from '@/lib/useMobile';
import { useAuth } from '@/context/AuthContext';

// CMS Imports
import ContentManagementDashboard from './crm/pages/ContentManagementDashboard';
import HomepageSettings from './crm/pages/HomepageSettings';
import ProjectPagesEditor from './crm/pages/ProjectPagesEditor';
import NavigationMenuEditor from './crm/pages/NavigationMenuEditor';
import CRMSettings from './crm/pages/CRMSettings';
import PromotionMaterialsManager from './crm/pages/PromotionMaterialsManager';
import PromotionMaterialsViewer from './crm/pages/PromotionMaterialsViewer';
import HomepageContentEditor from './crm/pages/HomepageContentEditor';
import DeveloperConsole from './crm/pages/DeveloperConsole';

// New Settings Imports
import SuperAdminSettings from './crm/pages/SuperAdminSettings';
// StaffManagement removed, replaced by EmployeeManagement
import SecuritySettings from './crm/pages/SecuritySettings';

const AppRoutes = ({ onBookSiteVisit }) => {
  const location = useLocation();
  const isMobile = useMobile();
  const { user } = useAuth();
  const isCRM = location.pathname.startsWith('/crm') || location.pathname === '/forgot-password';

  if (isCRM) {
    return (
      <>
      <Routes>
        <Route path="/crm/login" element={<CRMLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected CRM Routes */}
        <Route path="/crm/*" element={
          <ProtectedRoute>
             {/* Special route for Developer Console (no standard layout) */}
             {location.pathname === '/crm/developer-console' ? (
                 <DeveloperConsole />
             ) : (
             <CRMLayout>
                <Routes>
                   {/* Mobile Specific Routes for Employees */}
                   {isMobile && user?.role === 'sales_executive' && (
                       <>
                           <Route path="employee-dashboard" element={<MobileEmployeeDashboard />} />
                           <Route path="my-leads" element={<MobileLeadList />} />
                           <Route path="lead/:leadId" element={<MobileLeadDetails />} />
                       </>
                   )}

                   {/* Super Admin Routes */}
                   <Route path="admin/dashboard" element={
                      <ProtectedRoute allowedRoles={['super_admin', 'sub_admin', 'manager']}>
                         <SmartDashboard />
                      </ProtectedRoute>
                   } />
                   
                   {/* Renamed Route */}
                   <Route path="admin/employees" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><EmployeeManagement /></ProtectedRoute>
                   } />
                   <Route path="admin/employee-management" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><EmployeeManagement /></ProtectedRoute>
                   } />

                   <Route path="admin/sub-admins" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><SubAdminManagement /></ProtectedRoute>
                   } />
                   
                   <Route path="admin/leads" element={<LeadManagement />} />
                   <Route path="admin/customers" element={<CustomerManagement />} />
                   <Route path="admin/invoices" element={<InvoiceManagement />} />
                   <Route path="admin/settings" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><MasterSettings /></ProtectedRoute>
                   } />
                   <Route path="admin/crm-settings" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><CRMSettings /></ProtectedRoute>
                   } />
                   
                   {/* New Settings Routes */}
                   <Route path="admin/settings/account" element={<SuperAdminSettings />} />
                   
                   {/* Renamed setting route */}
                   <Route path="admin/settings/staff" element={<EmployeeManagement />} />
                   <Route path="admin/settings/employee" element={<EmployeeManagement />} />

                   <Route path="admin/settings/security" element={<SecuritySettings />} />
                   
                   <Route path="admin/notifications" element={<NotificationSettings />} />
                   <Route path="admin/wa-templates" element={<WhatsAppTemplates />} />
                   <Route path="admin/work-history" element={<EmployeeWorkHistory />} />
                   <Route path="admin/daily-reports" element={<AdminDailyReports />} />
                   <Route path="admin/performance" element={<AdminPerformanceDashboard />} />
                   <Route path="admin/projects" element={<ProjectManagement />} />
                   
                   {/* CMS Routes */}
                   <Route path="admin/cms" element={<ContentManagementDashboard />} />
                   <Route path="admin/cms/homepage" element={<HomepageSettings />} />
                   <Route path="admin/cms/projects" element={<ProjectPagesEditor />} />
                   <Route path="admin/cms/navigation" element={<NavigationMenuEditor />} />
                   <Route path="admin/cms/promotion-materials" element={<PromotionMaterialsManager />} />
                   <Route path="homepage-content-editor" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><HomepageContentEditor /></ProtectedRoute>
                   } />
                   
                   {/* Fallback check for dev console if nested */}
                   <Route path="developer-console" element={
                      <ProtectedRoute allowedRoles={['super_admin']}><DeveloperConsole /></ProtectedRoute>
                   } />

                   {/* Sub Admin / Manager Routes */}
                   <Route path="admin/staff-management" element={
                      <ProtectedRoute allowedRoles={['sub_admin', 'super_admin', 'manager']}><StaffManagementSubAdmin /></ProtectedRoute>
                   } />
                   <Route path="admin/staff-performance" element={
                      <ProtectedRoute allowedRoles={['sub_admin', 'super_admin', 'manager']}><StaffPerformanceSubAdmin /></ProtectedRoute>
                   } />
                   <Route path="admin/revenue-analytics" element={
                      <ProtectedRoute allowedRoles={['sub_admin', 'super_admin', 'manager']}><RevenueAnalytics /></ProtectedRoute>
                   } />
                   <Route path="admin/call-analytics" element={
                      <ProtectedRoute allowedRoles={['sub_admin', 'super_admin', 'manager']}><CallAnalytics /></ProtectedRoute>
                   } />
                   <Route path="admin/booking-analytics" element={
                      <ProtectedRoute allowedRoles={['sub_admin', 'super_admin', 'manager']}><BookingAnalytics /></ProtectedRoute>
                   } />

                   {/* Sales Routes */}
                   <Route path="sales/dashboard" element={<SalesExecutiveDashboard />} />
                   {/* Fallback to desktop dash if not mobile */}
                   {!isMobile && <Route path="employee-dashboard" element={<EmployeeDashboard />} />}
                   
                   <Route path="sales/my-leads" element={<MyLeads />} />
                   {!isMobile && <Route path="my-leads" element={<EmployeeLeadList />} />}
                   {!isMobile && <Route path="lead/:leadId" element={<EmployeeLeadDetails />} />}

                   <Route path="sales/daily-calling" element={<DailyCalling />} />
                   <Route path="sales/site-visits" element={<SiteVisits />} />
                   <Route path="sales/bookings" element={<Bookings />} />
                   <Route path="sales/tasks" element={<Tasks />} />
                   <Route path="sales/eod-reports" element={<EODReports />} />
                   <Route path="sales/tools" element={user?.role === 'super_admin' ? <PromotionMaterialsManager /> : <PromotionMaterialsViewer />} />
                   <Route path="sales/performance" element={<SalesExecutivePerformance />} />
                   <Route path="sales/daily-log" element={<DailyWorkLog />} />

                   {/* Shared */}
                   <Route path="profile" element={<CRMProfile />} />
                </Routes>
             </CRMLayout>
             )}
          </ProtectedRoute>
        } />
      </Routes>
      
      {/* Mobile Bottom Nav (Visible only on mobile for logged-in users) */}
      {isMobile && user && <MobileBottomNav onLogout={() => { window.location.href = '/crm/login'; localStorage.removeItem('crm_user'); }} />}
      </>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage onBookSiteVisit={onBookSiteVisit} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/projects" element={<ProjectsListingPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/why-invest" element={<WhyInvestPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </AnimatePresence>
  );
};

// Simple wrapper to serve correct dashboard
const SmartDashboard = () => {
   const { user } = useAuth();
   if (user?.role === 'sub_admin') return <SubAdminDashboard />;
   // super_admin and manager both use the admin dashboard
   return <CRMAdminDashboard />;
}

function App() {
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const location = useLocation();
  const isCRM = location.pathname.startsWith('/crm') || location.pathname === '/forgot-password';

  const handleOpenSiteVisitModal = () => {
    setIsSiteVisitModalOpen(true);
  };

  const handleCloseSiteVisitModal = () => {
    setIsSiteVisitModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      <ScrollToTop />
      {!isCRM && <Header onBookSiteVisit={handleOpenSiteVisitModal} />}
      <main className="flex-grow">
        <AppRoutes onBookSiteVisit={handleOpenSiteVisitModal} />
      </main>
      {!isCRM && <Footer />}
      {!isCRM && <FloatingWhatsAppButton />}
      <SiteVisitModal isOpen={isSiteVisitModalOpen} onClose={handleCloseSiteVisitModal} />
      <Toaster />
    </div>
  );
}

export default App;
