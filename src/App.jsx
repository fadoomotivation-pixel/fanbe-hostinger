// src/App.jsx
// ✅ PERF: All CRM pages are lazy-loaded with React.lazy + Suspense
//          This reduces initial JS parse from ~2MB to ~150KB for non-CRM visitors
//          and for CRM users only loads the current page bundle on demand.
import React, { useState, Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from './components/ScrollToTop';
import { Loader2 } from 'lucide-react';

// ── Public pages (small, eagerly loaded) ────────────────────────────────────────
import Header from './components/Header';
import Footer from './components/Footer';
import SiteVisitModal from './components/SiteVisitModal';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import SocialProofToast from './components/SocialProofToast';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsListingPage from './pages/ProjectsListingPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import WhyInvestPage from './pages/WhyInvestPage';
import ContactPage from './pages/ContactPage';

// ── CRM shell (always needed for CRM routes) ─────────────────────────────
import ProtectedRoute from './components/ProtectedRoute';
import CRMLayout from './crm/components/CRMLayout';
import MobileBottomNav from './crm/components/MobileBottomNav';
import { CRMDataProvider } from '@/context/CRMDataContext';
import { useMobile } from '@/lib/useMobile';
import { useAuth } from '@/context/AuthContext';

// ── CRM pages — ALL lazy loaded ──────────────────────────────────────────
const CRMLogin                  = lazy(() => import('./crm/pages/CRMLogin'));
const ForgotPassword            = lazy(() => import('./crm/pages/ForgotPassword'));
const CRMAdminDashboard         = lazy(() => import('./crm/pages/CRMAdminDashboard'));
const SalesExecutiveDashboard   = lazy(() => import('./crm/pages/SalesExecutiveDashboard'));
const SalesExecutivePerformance = lazy(() => import('./crm/pages/SalesExecutivePerformance'));
const DailyWorkLog              = lazy(() => import('./crm/pages/DailyWorkLog'));
const EmployeeManagement        = lazy(() => import('./crm/pages/EmployeeManagement'));
const LeadManagement            = lazy(() => import('./crm/pages/LeadManagement'));
const CustomerManagement        = lazy(() => import('./crm/pages/CustomerManagement'));
const InvoiceManagement         = lazy(() => import('./crm/pages/InvoiceManagement'));
const MasterSettings            = lazy(() => import('./crm/pages/MasterSettings'));
const CRMProfile                = lazy(() => import('./crm/pages/CRMProfile'));
const NotificationSettings      = lazy(() => import('./crm/pages/NotificationSettings'));
const WhatsAppTemplates         = lazy(() => import('./crm/pages/WhatsAppTemplates'));
const EmployeeWorkHistory       = lazy(() => import('./crm/pages/EmployeeWorkHistory'));
const AdminDailyReports         = lazy(() => import('./crm/pages/AdminDailyReports'));
const AdminPerformanceDashboard = lazy(() => import('./crm/pages/AdminPerformanceDashboard'));
const ProjectManagement         = lazy(() => import('./crm/pages/ProjectManagement'));
const SubAdminDashboard         = lazy(() => import('./crm/pages/SubAdminDashboard'));
const SubAdminManagement        = lazy(() => import('./crm/pages/SubAdminManagement'));
const HRManagerManagement       = lazy(() => import('./crm/pages/HRManagerManagement'));
const StaffManagementSubAdmin   = lazy(() => import('./crm/pages/StaffManagementSubAdmin'));
const StaffPerformanceSubAdmin  = lazy(() => import('./crm/pages/StaffPerformanceSubAdmin'));
const RevenueAnalytics          = lazy(() => import('./crm/pages/RevenueAnalytics'));
const CallAnalytics             = lazy(() => import('./crm/pages/CallAnalytics'));
const BookingAnalytics          = lazy(() => import('./crm/pages/BookingAnalytics'));
const MyLeads                   = lazy(() => import('./crm/pages/MyLeads'));
const LeadDetail                = lazy(() => import('./crm/pages/LeadDetail'));
const EditLead                  = lazy(() => import('./crm/pages/EditLead'));
const CreateManualLead          = lazy(() => import('./crm/pages/CreateManualLead'));
const UpdateLeadStatus          = lazy(() => import('./crm/pages/UpdateLeadStatus'));
const DailyCalling              = lazy(() => import('./crm/pages/DailyCalling'));
const LeadSearch                = lazy(() => import('./crm/pages/LeadSearch'));
const SmartGuidance             = lazy(() => import('./crm/pages/SmartGuidance'));
const EmployeeIntelligence      = lazy(() => import('./crm/pages/EmployeeIntelligence'));
const SiteVisits                = lazy(() => import('./crm/pages/SiteVisits'));
const Bookings                  = lazy(() => import('./crm/pages/Bookings'));
const Tasks                     = lazy(() => import('./crm/pages/Tasks'));
const EODReports                = lazy(() => import('./crm/pages/EODReports'));
const SalesTools                = lazy(() => import('./crm/pages/SalesTools'));
const MobileEmployeeDashboard   = lazy(() => import('./crm/pages/MobileEmployeeDashboard'));
const EmployeeCRMHome           = lazy(() => import('./crm/pages/EmployeeCRMHome'));
const MobileLeadList            = lazy(() => import('./crm/pages/MobileLeadList'));
const MobileLeadDetails         = lazy(() => import('./crm/pages/MobileLeadDetails'));
const ContentManagementDashboard= lazy(() => import('./crm/pages/ContentManagementDashboard'));
const HomepageSettings          = lazy(() => import('./crm/pages/HomepageSettings'));
const ProjectPagesEditor        = lazy(() => import('./crm/pages/ProjectPagesEditor'));
const NavigationMenuEditor      = lazy(() => import('./crm/pages/NavigationMenuEditor'));
const CRMSettings               = lazy(() => import('./crm/pages/CRMSettings'));
const PromotionMaterialsManager = lazy(() => import('./crm/pages/PromotionMaterialsManager'));
const PromotionMaterialsViewer  = lazy(() => import('./crm/pages/PromotionMaterialsViewer'));
const HomepageContentEditor     = lazy(() => import('./crm/pages/HomepageContentEditor'));
const DeveloperConsole          = lazy(() => import('./crm/pages/DeveloperConsole'));
const ProjectDocumentsPage      = lazy(() => import('./pages/crm/admin/cms/ProjectDocumentsPage'));
const SuperAdminSettings        = lazy(() => import('./crm/pages/SuperAdminSettings'));
const SecuritySettings          = lazy(() => import('./crm/pages/SecuritySettings'));
const ImportWorkLogs            = lazy(() => import('./crm/pages/ImportWorkLogs'));
const ImportLeads               = lazy(() => import('./crm/pages/ImportLeads'));
const ClearCacheUtility         = lazy(() => import('./crm/pages/ClearCacheUtility'));
const LeadsAssignmentDebug      = lazy(() => import('./crm/pages/LeadsAssignmentDebug'));
const EmployeeAddLead           = lazy(() => import('./crm/pages/EmployeeAddLead'));
const EmployeeSubmittedLeads    = lazy(() => import('./crm/pages/EmployeeSubmittedLeads'));
const AdminEmployeeLeads        = lazy(() => import('./crm/pages/AdminEmployeeLeads'));

// HR Module — lazy loaded
const HREmployeeMaster = lazy(() => import('./crm/pages/hr/HREmployeeMaster'));
const HRDashboard      = lazy(() => import('./crm/pages/hr/HRDashboard'));
const HRAttendance     = lazy(() => import('./crm/pages/hr/HRAttendance'));
const HRPayroll        = lazy(() => import('./crm/pages/hr/HRPayroll'));
const HRDocuments      = lazy(() => import('./crm/pages/hr/HRDocuments'));

// ── Page fallback ────────────────────────────────────────────────────────────
const PageFallback = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-[#0F3A5F]" />
  </div>
);

const EMPLOYEE_ROLES = ['sales_executive', 'telecaller', 'manager'];

const SmartDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'sub_admin') return <SubAdminDashboard />;
  return <CRMAdminDashboard />;
};

const EmployeeLanding = () => <Navigate to="/crm/sales/crm" replace />;

const AppRoutes = ({ onBookSiteVisit }) => {
  const location  = useLocation();
  const isMobile  = useMobile();
  const { user }  = useAuth();
  const isCRM     = location.pathname.startsWith('/crm') || location.pathname === '/forgot-password';

  if (isCRM) {
    return (
      <>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/crm/login" element={<CRMLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/crm/*" element={
              <ProtectedRoute>
                {location.pathname === '/crm/developer-console' ? <DeveloperConsole /> : (
                  <CRMLayout>
                    <Routes>
                      <Route path="dashboard"        element={<Navigate to="/crm/admin/dashboard" replace />} />
                      <Route path="leads"            element={<Navigate to="/crm/admin/leads" replace />} />
                      <Route path="staff"            element={<Navigate to="/crm/admin/staff-management" replace />} />
                      <Route path="reports"          element={<Navigate to="/crm/admin/staff-performance" replace />} />
                      <Route path="employee-dashboard" element={<Navigate to="/crm/sales/crm" replace />} />
                      <Route path="my-leads"         element={<Navigate to="/crm/sales/my-leads" replace />} />
                      <Route path="debug/lead-assignments" element={<LeadsAssignmentDebug />} />

                      <Route path="admin/dashboard"           element={<ProtectedRoute allowedRoles={['super_admin','sub_admin']}><SmartDashboard /></ProtectedRoute>} />
                      <Route path="admin/employees"           element={<ProtectedRoute allowedRoles={['super_admin']}><EmployeeManagement /></ProtectedRoute>} />
                      <Route path="admin/employee-management" element={<ProtectedRoute allowedRoles={['super_admin']}><EmployeeManagement /></ProtectedRoute>} />
                      <Route path="admin/sub-admins"          element={<ProtectedRoute allowedRoles={['super_admin']}><SubAdminManagement /></ProtectedRoute>} />
                      <Route path="admin/hr-managers"         element={<ProtectedRoute allowedRoles={['super_admin']}><HRManagerManagement /></ProtectedRoute>} />
                      <Route path="admin/leads"               element={<LeadManagement />} />
                      <Route path="admin/customers"           element={<CustomerManagement />} />
                      <Route path="admin/invoices"            element={<InvoiceManagement />} />
                      <Route path="admin/settings"            element={<ProtectedRoute allowedRoles={['super_admin']}><MasterSettings /></ProtectedRoute>} />
                      <Route path="admin/crm-settings"        element={<ProtectedRoute allowedRoles={['super_admin']}><CRMSettings /></ProtectedRoute>} />
                      <Route path="admin/settings/account"    element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminSettings /></ProtectedRoute>} />
                      <Route path="admin/settings/staff"      element={<ProtectedRoute allowedRoles={['super_admin']}><EmployeeManagement /></ProtectedRoute>} />
                      <Route path="admin/settings/employee"   element={<ProtectedRoute allowedRoles={['super_admin']}><EmployeeManagement /></ProtectedRoute>} />
                      <Route path="admin/settings/security"   element={<ProtectedRoute allowedRoles={['super_admin']}><SecuritySettings /></ProtectedRoute>} />
                      <Route path="admin/notifications"       element={<ProtectedRoute allowedRoles={['super_admin','sub_admin']}><NotificationSettings /></ProtectedRoute>} />
                      <Route path="admin/wa-templates"        element={<WhatsAppTemplates />} />
                      <Route path="admin/work-history"        element={<EmployeeWorkHistory />} />
                      <Route path="admin/daily-reports"       element={<ProtectedRoute allowedRoles={['super_admin','sub_admin','manager']}><AdminDailyReports /></ProtectedRoute>} />
                      <Route path="admin/performance"         element={<ProtectedRoute allowedRoles={['super_admin','sub_admin','manager']}><AdminPerformanceDashboard /></ProtectedRoute>} />
                      <Route path="admin/projects"            element={<ProjectManagement />} />
                      <Route path="admin/import-work-logs"    element={<ProtectedRoute allowedRoles={['super_admin']}><ImportWorkLogs /></ProtectedRoute>} />
                      <Route path="admin/import-leads"        element={<ProtectedRoute allowedRoles={['super_admin','sub_admin']}><ImportLeads /></ProtectedRoute>} />
                      <Route path="clear-cache"               element={<ProtectedRoute allowedRoles={['super_admin']}><ClearCacheUtility /></ProtectedRoute>} />
                      <Route path="admin/cms"                 element={<ContentManagementDashboard />} />
                      <Route path="admin/cms/homepage"        element={<HomepageSettings />} />
                      <Route path="admin/cms/projects"        element={<ProjectPagesEditor />} />
                      <Route path="admin/cms/navigation"      element={<NavigationMenuEditor />} />
                      <Route path="admin/cms/promotion-materials" element={<PromotionMaterialsManager />} />
                      <Route path="admin/cms/project-documents"   element={<ProjectDocumentsPage />} />
                      <Route path="homepage-content-editor"   element={<ProtectedRoute allowedRoles={['super_admin']}><HomepageContentEditor /></ProtectedRoute>} />
                      <Route path="developer-console"         element={<ProtectedRoute allowedRoles={['super_admin']}><DeveloperConsole /></ProtectedRoute>} />
                      <Route path="admin/staff-management"    element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><StaffManagementSubAdmin /></ProtectedRoute>} />
                      <Route path="admin/staff-performance"   element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><StaffPerformanceSubAdmin /></ProtectedRoute>} />
                      <Route path="admin/revenue-analytics"   element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><RevenueAnalytics /></ProtectedRoute>} />
                      <Route path="admin/call-analytics"      element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><CallAnalytics /></ProtectedRoute>} />
                      <Route path="admin/booking-analytics"   element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><BookingAnalytics /></ProtectedRoute>} />
                      <Route path="admin/employee-intelligence" element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><EmployeeIntelligence /></ProtectedRoute>} />
                      <Route path="admin/employee-leads"      element={<ProtectedRoute allowedRoles={['sub_admin','super_admin']}><AdminEmployeeLeads /></ProtectedRoute>} />

                      <Route path="admin/hr/dashboard"  element={<ProtectedRoute allowedRoles={['super_admin','sub_admin']}><HRDashboard /></ProtectedRoute>} />
                      <Route path="admin/hr/employees"  element={<ProtectedRoute allowedRoles={['super_admin']}><HREmployeeMaster /></ProtectedRoute>} />
                      <Route path="admin/hr/attendance" element={<ProtectedRoute allowedRoles={['super_admin']}><HRAttendance /></ProtectedRoute>} />
                      <Route path="admin/hr/payroll"    element={<ProtectedRoute allowedRoles={['super_admin']}><HRPayroll /></ProtectedRoute>} />
                      <Route path="admin/hr/documents"  element={<ProtectedRoute allowedRoles={['super_admin']}><HRDocuments /></ProtectedRoute>} />
                      <Route path="hr/dashboard"  element={<ProtectedRoute allowedRoles={['hr_manager','super_admin']}><HRDashboard /></ProtectedRoute>} />
                      <Route path="hr/employees"  element={<ProtectedRoute allowedRoles={['hr_manager','super_admin']}><HREmployeeMaster /></ProtectedRoute>} />
                      <Route path="hr/attendance" element={<ProtectedRoute allowedRoles={['hr_manager','super_admin']}><HRAttendance /></ProtectedRoute>} />
                      <Route path="hr/payroll"    element={<ProtectedRoute allowedRoles={['hr_manager','super_admin']}><HRPayroll /></ProtectedRoute>} />
                      <Route path="hr/documents"  element={<ProtectedRoute allowedRoles={['hr_manager','super_admin']}><HRDocuments /></ProtectedRoute>} />

                      <Route path="sales/crm"                element={<EmployeeCRMHome />} />
                      <Route path="sales/dashboard"          element={<EmployeeLanding />} />
                      <Route path="sales/my-leads"           element={<MyLeads />} />
                      <Route path="sales/lead/:id"           element={<LeadDetail />} />
                      <Route path="sales/edit-lead/:id"      element={<EditLead />} />
                      <Route path="sales/lead-search"        element={<LeadSearch />} />
                      <Route path="sales/smart-guidance"     element={<SmartGuidance />} />
                      <Route path="sales/daily-calling"      element={<DailyCalling />} />
                      <Route path="sales/site-visits"        element={<SiteVisits />} />
                      <Route path="sales/bookings"           element={<Bookings />} />
                      <Route path="sales/tasks"              element={<Tasks />} />
                      <Route path="sales/add-lead"           element={<EmployeeAddLead />} />
                      <Route path="sales/my-submitted-leads" element={<EmployeeSubmittedLeads />} />
                      <Route path="sales/eod-reports"        element={<EODReports />} />
                      <Route path="sales/tools"              element={user?.role === 'super_admin' ? <PromotionMaterialsManager /> : <PromotionMaterialsViewer />} />
                      <Route path="sales/performance"        element={<SalesExecutivePerformance />} />
                      <Route path="sales/daily-log"          element={<DailyWorkLog />} />

                      <Route path="lead/:leadId"        element={<MobileLeadDetails />} />
                      <Route path="lead/:leadId/update" element={<UpdateLeadStatus />} />
                      <Route path="lead/new"            element={<CreateManualLead />} />
                      <Route path="profile"             element={<CRMProfile />} />
                    </Routes>
                  </CRMLayout>
                )}
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
        {isMobile && user && <MobileBottomNav />}
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

const AuthAwareCRMProvider = ({ children }) => {
  const { user } = useAuth();
  return (
    <CRMDataProvider userId={user?.id} role={user?.role}>
      {children}
    </CRMDataProvider>
  );
};

function App() {
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const location = useLocation();
  const isCRM = location.pathname.startsWith('/crm') || location.pathname === '/forgot-password';

  return (
    <AuthAwareCRMProvider>
      <div className="flex flex-col min-h-screen font-sans bg-gray-50">
        <ScrollToTop />
        {!isCRM && <Header onBookSiteVisit={() => setIsSiteVisitModalOpen(true)} />}
        <main className="flex-grow">
          <AppRoutes onBookSiteVisit={() => setIsSiteVisitModalOpen(true)} />
        </main>
        {!isCRM && <Footer />}
        {!isCRM && <FloatingWhatsAppButton />}
        {!isCRM && <SocialProofToast />}
        <SiteVisitModal isOpen={isSiteVisitModalOpen} onClose={() => setIsSiteVisitModalOpen(false)} />
        <Toaster />
      </div>
    </AuthAwareCRMProvider>
  );
}

export default App;
