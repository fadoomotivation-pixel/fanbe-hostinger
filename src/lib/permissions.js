// src/lib/permissions.js
// ============================================================
// PRIVILEGE HIERARCHY (highest → lowest)
//   super_admin  →  sub_admin  →  hr_manager  →  manager  →  sales_executive  →  telecaller
// ============================================================
// sub_admin  = Business Ops owner — can see HR summary, CANNOT manage HR data
// hr_manager = HR department head — manages attendance, payroll, docs, leaves. CANNOT see CRM leads/sales

export const ROLES = {
  SUPER_ADMIN:     'super_admin',
  SUB_ADMIN:       'sub_admin',
  HR_MANAGER:      'hr_manager',
  MANAGER:         'manager',
  SALES_EXECUTIVE: 'sales_executive',
  TELECALLER:      'telecaller',
  EMPLOYEE:        'sales_executive',    // alias
};

const PERMISSIONS = {

  // ── Super Admin ── full control, nothing blocked
  [ROLES.SUPER_ADMIN]: {
    canManageContent:       true,
    canManageStaff:         true,
    canManageSubAdmins:     true,
    canManageHRManagers:    true,
    canManageSettings:      true,
    canViewAllLeads:        true,
    canEditLeads:           true,
    canDeleteLeads:         true,
    canViewAllPerformance:  true,
    canViewDailyReports:    true,
    canViewGlobalAnalytics: true,
    canDeleteRecords:       true,
    canViewPasswords:       true,
    canResetPasswords:      true,
    canManageTeams:         true,
    canAssignLeads:         true,
    canManageHR:            true,
    canManageProjects:      true,
    canManageCMS:           true,
    canViewBookings:        true,
    canCreateBookings:      true,
    canViewInvoices:        true,
    canManageInvoices:      true,
    canImportLeads:         true,
    canExportLeads:         true,
    canManageNotifications: true,
    // HR specific
    canMarkAttendance:      true,
    canApproveLeaves:       true,
    canGeneratePayroll:     true,
    canUploadDocuments:     true,
    canViewHRDashboard:     true,
    canManageHREmployees:   true,
  },

  // ── Sub Admin ── Business Ops owner (leads, sales, team, analytics)
  // CANNOT: CRM settings, sub-admin creation, HR write operations, delete records
  [ROLES.SUB_ADMIN]: {
    canManageContent:       false,  // ❌ No CMS
    canManageStaff:         true,   // ✅ Add/edit sales staff
    canManageSubAdmins:     false,  // ❌ Cannot create other sub-admins
    canManageHRManagers:    false,  // ❌ Cannot create HR managers
    canManageSettings:      false,  // ❌ No CRM system settings
    canViewAllLeads:        true,   // ✅ See all leads
    canEditLeads:           true,   // ✅ Edit lead details
    canDeleteLeads:         false,  // ❌ No permanent delete
    canViewAllPerformance:  true,   // ✅ Team performance
    canViewDailyReports:    true,   // ✅ Daily reports
    canViewGlobalAnalytics: true,   // ✅ Revenue/call/booking analytics
    canDeleteRecords:       false,  // ❌ No hard deletes
    canViewPasswords:       false,  // ❌ Cannot view staff passwords
    canResetPasswords:      false,  // ❌ Cannot reset staff passwords
    canManageTeams:         true,   // ✅ Assign teams
    canAssignLeads:         true,   // ✅ Assign leads to staff
    canManageHR:            false,  // ❌ HR is separate department
    canManageProjects:      true,   // ✅ View/manage projects
    canManageCMS:           false,  // ❌ No CMS
    canViewBookings:        true,   // ✅ View bookings
    canCreateBookings:      false,  // ❌ Cannot create booking directly
    canViewInvoices:        true,   // ✅ View invoices
    canManageInvoices:      false,  // ❌ Cannot create invoices
    canImportLeads:         true,   // ✅ Import leads
    canExportLeads:         true,   // ✅ Export leads
    canManageNotifications: false,  // ❌ No notification settings
    // HR specific — sub_admin can VIEW summary only
    canMarkAttendance:      false,  // ❌ Not HR's job
    canApproveLeaves:       false,  // ❌ Not HR's job
    canGeneratePayroll:     false,  // ❌ Not HR's job
    canUploadDocuments:     false,  // ❌ Not HR's job
    canViewHRDashboard:     true,   // ✅ Can VIEW HR summary dashboard (read-only)
    canManageHREmployees:   false,  // ❌ Cannot add/edit HR employees
  },

  // ── HR Manager ── ONLY HR functions, no CRM/sales access
  [ROLES.HR_MANAGER]: {
    canManageContent:       false,
    canManageStaff:         false,  // ❌ HR manages hr_employees table, NOT CRM profiles
    canManageSubAdmins:     false,
    canManageHRManagers:    false,
    canManageSettings:      false,
    canViewAllLeads:        false,  // ❌ No CRM leads
    canEditLeads:           false,
    canDeleteLeads:         false,
    canViewAllPerformance:  false,  // ❌ No sales analytics
    canViewDailyReports:    false,
    canViewGlobalAnalytics: false,
    canDeleteRecords:       false,
    canViewPasswords:       false,
    canResetPasswords:      false,
    canManageTeams:         false,
    canAssignLeads:         false,
    canManageHR:            true,   // ✅ Core HR access
    canManageProjects:      false,
    canManageCMS:           false,
    canViewBookings:        false,
    canCreateBookings:      false,
    canViewInvoices:        false,
    canManageInvoices:      false,
    canImportLeads:         false,
    canExportLeads:         false,
    canManageNotifications: false,
    // HR specific — full HR control
    canMarkAttendance:      true,   // ✅ Mark/edit attendance
    canApproveLeaves:       true,   // ✅ Approve/reject leaves
    canGeneratePayroll:     true,   // ✅ Generate salary slips
    canUploadDocuments:     true,   // ✅ Upload employee docs
    canViewHRDashboard:     true,   // ✅ Full HR analytics dashboard
    canManageHREmployees:   true,   // ✅ Add/edit/remove HR employees
  },

  // ── Manager ── team lead, CRM only
  [ROLES.MANAGER]: {
    canManageContent:       false,
    canManageStaff:         true,
    canManageSubAdmins:     false,
    canManageHRManagers:    false,
    canManageSettings:      false,
    canViewAllLeads:        false,
    canEditLeads:           true,
    canDeleteLeads:         false,
    canViewAllPerformance:  true,
    canViewDailyReports:    true,
    canViewGlobalAnalytics: false,
    canDeleteRecords:       false,
    canViewPasswords:       false,
    canResetPasswords:      false,
    canManageTeams:         true,
    canAssignLeads:         true,
    canManageHR:            false,
    canManageProjects:      true,
    canManageCMS:           false,
    canViewBookings:        true,
    canCreateBookings:      false,
    canViewInvoices:        false,
    canManageInvoices:      false,
    canImportLeads:         false,
    canExportLeads:         false,
    canManageNotifications: false,
    canMarkAttendance:      false,
    canApproveLeaves:       false,
    canGeneratePayroll:     false,
    canUploadDocuments:     false,
    canViewHRDashboard:     false,
    canManageHREmployees:   false,
  },

  // ── Sales Executive ── field sales only
  [ROLES.SALES_EXECUTIVE]: {
    canManageContent:       false,
    canManageStaff:         false,
    canManageSubAdmins:     false,
    canManageHRManagers:    false,
    canManageSettings:      false,
    canViewAllLeads:        false,
    canEditLeads:           true,
    canDeleteLeads:         false,
    canViewAllPerformance:  false,
    canViewDailyReports:    false,
    canViewGlobalAnalytics: false,
    canDeleteRecords:       false,
    canViewPasswords:       false,
    canResetPasswords:      false,
    canManageTeams:         false,
    canAssignLeads:         false,
    canManageHR:            false,
    canManageProjects:      false,
    canManageCMS:           false,
    canViewBookings:        true,
    canCreateBookings:      true,
    canViewInvoices:        false,
    canManageInvoices:      false,
    canImportLeads:         false,
    canExportLeads:         false,
    canScheduleSiteVisits:  true,
    canManageNotifications: false,
    canMarkAttendance:      false,
    canApproveLeaves:       false,
    canGeneratePayroll:     false,
    canUploadDocuments:     false,
    canViewHRDashboard:     false,
    canManageHREmployees:   false,
  },

  // ── Telecaller ── calls & appointments only
  [ROLES.TELECALLER]: {
    canManageContent:       false,
    canManageStaff:         false,
    canManageSubAdmins:     false,
    canManageHRManagers:    false,
    canManageSettings:      false,
    canViewAllLeads:        false,
    canEditLeads:           false,
    canDeleteLeads:         false,
    canViewAllPerformance:  false,
    canViewDailyReports:    false,
    canViewGlobalAnalytics: false,
    canDeleteRecords:       false,
    canViewPasswords:       false,
    canResetPasswords:      false,
    canManageTeams:         false,
    canAssignLeads:         false,
    canManageHR:            false,
    canManageProjects:      false,
    canManageCMS:           false,
    canViewBookings:        false,
    canCreateBookings:      false,
    canViewInvoices:        false,
    canManageInvoices:      false,
    canImportLeads:         false,
    canExportLeads:         false,
    canScheduleSiteVisits:  false,
    canMakeCalls:           true,
    canScheduleAppointments:true,
    canManageNotifications: false,
    canMarkAttendance:      false,
    canApproveLeaves:       false,
    canGeneratePayroll:     false,
    canUploadDocuments:     false,
    canViewHRDashboard:     false,
    canManageHREmployees:   false,
  },
};

// ── Sidebar menus ─────────────────────────────────────────────────────────────
const MENU_STRUCTURE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard',             path: '/crm/admin/dashboard',           icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory',    path: '/crm/admin/projects',            icon: 'Layers' },
    { label: 'Leads Management',      path: '/crm/admin/leads',               icon: 'Users' },
    { label: 'Import Leads',          path: '/crm/admin/import-leads',        icon: 'UserPlus' },
    { label: 'Employee Management',   path: '/crm/admin/employees',           icon: 'UserCheck' },
    { label: 'Sub Admin Management',  path: '/crm/admin/sub-admins',          icon: 'Shield' },
    { label: 'HR Manager Setup',      path: '/crm/admin/hr-managers',         icon: 'Briefcase' },
    { label: 'Customers',             path: '/crm/admin/customers',           icon: 'UserCircle' },
    { label: 'Invoices',              path: '/crm/admin/invoices',            icon: 'FileText' },
    { label: 'CRM Settings',          path: '/crm/admin/crm-settings',        icon: 'Settings' },
    { label: 'Reports & Analytics',   path: '/crm/admin/daily-reports',       icon: 'BarChart2' },
    { label: 'Performance',           path: '/crm/admin/performance',         icon: 'TrendingUp' },
    { label: 'Employee Intelligence', path: '/crm/admin/employee-intelligence', icon: 'Award' },
    { label: 'Revenue Analytics',     path: '/crm/admin/revenue-analytics',   icon: 'PieChart' },
    { label: 'Call Analytics',        path: '/crm/admin/call-analytics',      icon: 'PhoneCall' },
    { label: 'Booking Analytics',     path: '/crm/admin/booking-analytics',   icon: 'CalendarCheck' },
    { label: 'HR Dashboard',          path: '/crm/admin/hr/dashboard',        icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',       path: '/crm/admin/hr/employees',        icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',            path: '/crm/admin/hr/attendance',       icon: 'ClipboardList',   group: 'HR' },
    { label: 'Payroll',               path: '/crm/admin/hr/payroll',          icon: 'IndianRupee',     group: 'HR' },
    { label: 'Documents',             path: '/crm/admin/hr/documents',        icon: 'FolderOpen',      group: 'HR' },
    { label: 'Content Management',    path: '/crm/admin/cms',                 icon: 'Globe',           group: 'System' },
    { label: 'Import Work Logs',      path: '/crm/admin/import-work-logs',    icon: 'Upload',          group: 'System' },
    { label: 'WA Templates',          path: '/crm/admin/wa-templates',        icon: 'MessageSquare',   group: 'System' },
    { label: 'Notifications',         path: '/crm/admin/notifications',       icon: 'Bell',            group: 'System' },
    { label: 'My Profile',            path: '/crm/profile',                   icon: 'User' },
  ],

  // Sub Admin: NO HR management menu items — only a read-only HR summary
  [ROLES.SUB_ADMIN]: [
    { label: 'Dashboard',            path: '/crm/admin/dashboard',           icon: 'LayoutDashboard' },
    { label: 'Leads Management',     path: '/crm/admin/leads',               icon: 'Users' },
    { label: 'Import Leads',         path: '/crm/admin/import-leads',        icon: 'UserPlus' },
    { label: 'Projects/Inventory',   path: '/crm/admin/projects',            icon: 'Layers' },
    { label: 'Staff Management',     path: '/crm/admin/staff-management',    icon: 'UserCheck' },
    { label: 'Staff Performance',    path: '/crm/admin/staff-performance',   icon: 'TrendingUp' },
    { label: 'Employee Intelligence', path: '/crm/admin/employee-intelligence', icon: 'Award' },
    { label: 'Daily Reports',        path: '/crm/admin/daily-reports',       icon: 'FileText',        group: 'Reports' },
    { label: 'Revenue Analytics',    path: '/crm/admin/revenue-analytics',   icon: 'PieChart',        group: 'Reports' },
    { label: 'Call Logs',            path: '/crm/admin/call-analytics',      icon: 'PhoneCall',       group: 'Reports' },
    { label: 'Booking Analytics',    path: '/crm/admin/booking-analytics',   icon: 'CalendarCheck',   group: 'Reports' },
    // HR summary: READ-ONLY view only
    { label: 'HR Overview',          path: '/crm/admin/hr/dashboard',        icon: 'BarChart2',       group: 'HR Overview' },
    { label: 'My Profile',           path: '/crm/profile',                   icon: 'User' },
  ],

  // HR Manager: ONLY HR pages, no CRM navigation
  [ROLES.HR_MANAGER]: [
    { label: 'HR Dashboard',         path: '/crm/hr/dashboard',              icon: 'LayoutDashboard' },
    { label: 'Employee Master',      path: '/crm/hr/employees',              icon: 'UserPlus' },
    { label: 'Attendance',           path: '/crm/hr/attendance',             icon: 'ClipboardList' },
    { label: 'Payroll',              path: '/crm/hr/payroll',                icon: 'IndianRupee' },
    { label: 'Documents',            path: '/crm/hr/documents',              icon: 'FolderOpen' },
    { label: 'My Profile',           path: '/crm/profile',                   icon: 'User' },
  ],

  [ROLES.MANAGER]: [
    { label: 'Dashboard',            path: '/crm/admin/dashboard',           icon: 'LayoutDashboard' },
    { label: 'Team Performance',     path: '/crm/admin/staff-performance',   icon: 'TrendingUp' },
    { label: 'Lead Management',      path: '/crm/admin/leads',               icon: 'Users' },
    { label: 'Team Management',      path: '/crm/admin/staff-management',    icon: 'UserCheck' },
    { label: 'Daily Reports',        path: '/crm/admin/daily-reports',       icon: 'FileText' },
    { label: 'Call Analytics',       path: '/crm/admin/call-analytics',      icon: 'PhoneCall' },
    { label: 'Projects/Inventory',   path: '/crm/admin/projects',            icon: 'Layers' },
    { label: 'My Profile',           path: '/crm/profile',                   icon: 'User' },
  ],

  [ROLES.SALES_EXECUTIVE]: [
    { label: 'Dashboard',         path: '/crm/employee-dashboard',      icon: 'LayoutDashboard' },
    { label: 'My Leads',          path: '/crm/my-leads',                icon: 'Users' },
    { label: 'Search Leads',      path: '/crm/sales/lead-search',       icon: 'Search' },
    { label: 'Smart Guidance',    path: '/crm/sales/smart-guidance',    icon: 'Zap' },
    { label: 'Site Visits',       path: '/crm/sales/site-visits',       icon: 'MapPin' },
    { label: 'Daily Calling',     path: '/crm/sales/daily-calling',     icon: 'Phone' },
    { label: 'Assigned Tasks',    path: '/crm/sales/tasks',             icon: 'CheckSquare' },
    { label: 'EOD Report',        path: '/crm/sales/eod-reports',       icon: 'FileText' },
    { label: 'My Profile',        path: '/crm/profile',                 icon: 'User' },
  ],

  [ROLES.TELECALLER]: [
    { label: 'Dashboard',         path: '/crm/employee-dashboard',      icon: 'LayoutDashboard' },
    { label: 'My Leads',          path: '/crm/my-leads',                icon: 'Users' },
    { label: 'Search Leads',      path: '/crm/sales/lead-search',       icon: 'Search' },
    { label: 'Smart Guidance',    path: '/crm/sales/smart-guidance',    icon: 'Zap' },
    { label: 'Daily Calling',     path: '/crm/sales/daily-calling',     icon: 'Phone' },
    { label: 'Assigned Tasks',    path: '/crm/sales/tasks',             icon: 'CheckSquare' },
    { label: 'EOD Report',        path: '/crm/sales/eod-reports',       icon: 'FileText' },
    { label: 'My Profile',        path: '/crm/profile',                 icon: 'User' },
  ],
};

// ── Exports ───────────────────────────────────────────────────────────────────
export const hasPermission = (role, permission) =>
  PERMISSIONS[role]?.[permission] ?? false;

export const canAccessPage = (role, path) => {
  // Super admin: everything
  if (role === ROLES.SUPER_ADMIN) return true;

  // HR Manager: ONLY /crm/hr/* and /crm/profile
  if (role === ROLES.HR_MANAGER) {
    if (path.startsWith('/crm/hr/'))  return true;
    if (path === '/crm/profile')      return true;
    return false;   // ❌ Block all other CRM pages
  }

  // Sub Admin: blocked system pages
  if (role === ROLES.SUB_ADMIN) {
    if (path.includes('/crm-settings'))            return false;
    if (path.includes('/sub-admins'))              return false;
    if (path.includes('/hr-managers'))             return false;
    if (path.includes('/notifications'))           return false;
    if (path.includes('/wa-templates'))            return false;
    if (path.includes('/cms'))                     return false;
    if (path.includes('/import-work-logs'))        return false;
    if (path.includes('/homepage-content-editor')) return false;
    if (path.includes('/developer-console'))       return false;
    if (path.includes('/settings/security'))       return false;
    if (path.includes('/settings/account'))        return false;
    // HR write pages blocked — only hr/dashboard (read-only overview) allowed
    if (path.includes('/hr/employees'))  return false;
    if (path.includes('/hr/attendance')) return false;
    if (path.includes('/hr/payroll'))    return false;
    if (path.includes('/hr/documents'))  return false;
    return true;
  }

  if (role === ROLES.MANAGER) {
    if (path.includes('/crm-settings'))  return false;
    if (path.includes('/sub-admins'))    return false;
    if (path.includes('/hr-managers'))   return false;
    if (path.includes('/cms'))           return false;
    if (path.includes('/notifications')) return false;
    if (path.includes('/hr/'))           return false;
    if (path.includes('/import-work-logs')) return false;
    if (path.includes('/import-leads'))  return false;
    return true;
  }

  if (role === ROLES.SALES_EXECUTIVE || role === ROLES.TELECALLER) {
    if (path.includes('/admin'))  return false;
    if (path.includes('/crm/hr')) return false;
    return true;
  }

  return false;
};

export const getVisibleMenuItems = role => MENU_STRUCTURE[role] || [];

// ── Privilege comparison ──────────────────────────────────────────────────────
const ROLE_RANK = {
  super_admin:      100,
  sub_admin:         60,
  hr_manager:        55,
  manager:           50,
  sales_executive:   20,
  telecaller:        10,
};
export const roleRank      = role => ROLE_RANK[role] ?? 0;
export const isHigherRole  = (actorRole, targetRole) =>
  roleRank(actorRole) > roleRank(targetRole);
