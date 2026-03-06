// src/lib/permissions.js
// ============================================================
// PRIVILEGE HIERARCHY (highest → lowest)
//   super_admin  →  sub_admin  →  hr_manager  →  manager  →  sales_executive  →  telecaller
// ============================================================

export const ROLES = {
  SUPER_ADMIN:     'super_admin',
  SUB_ADMIN:       'sub_admin',
  HR_MANAGER:      'hr_manager',
  MANAGER:         'manager',
  SALES_EXECUTIVE: 'sales_executive',
  TELECALLER:      'telecaller',
  EMPLOYEE:        'sales_executive',
};

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canManageContent: true, canManageStaff: true, canManageSubAdmins: true,
    canManageHRManagers: true, canManageSettings: true, canViewAllLeads: true,
    canEditLeads: true, canDeleteLeads: true, canViewAllPerformance: true,
    canViewDailyReports: true, canViewGlobalAnalytics: true, canDeleteRecords: true,
    canViewPasswords: true, canResetPasswords: true, canManageTeams: true,
    canAssignLeads: true, canManageHR: true, canManageProjects: true,
    canManageCMS: true, canViewBookings: true, canCreateBookings: true,
    canViewInvoices: true, canManageInvoices: true, canImportLeads: true,
    canExportLeads: true, canManageNotifications: true,
    canMarkAttendance: true, canApproveLeaves: true, canGeneratePayroll: true,
    canUploadDocuments: true, canViewHRDashboard: true, canManageHREmployees: true,
  },
  [ROLES.SUB_ADMIN]: {
    canManageContent: false, canManageStaff: true, canManageSubAdmins: false,
    canManageHRManagers: false, canManageSettings: false, canViewAllLeads: true,
    canEditLeads: true, canDeleteLeads: false, canViewAllPerformance: true,
    canViewDailyReports: true, canViewGlobalAnalytics: true, canDeleteRecords: false,
    canViewPasswords: false, canResetPasswords: false, canManageTeams: true,
    canAssignLeads: true, canManageHR: false, canManageProjects: true,
    canManageCMS: false, canViewBookings: true, canCreateBookings: false,
    canViewInvoices: true, canManageInvoices: false, canImportLeads: true,
    canExportLeads: true, canManageNotifications: false,
    canMarkAttendance: false, canApproveLeaves: false, canGeneratePayroll: false,
    canUploadDocuments: false, canViewHRDashboard: true, canManageHREmployees: false,
  },
  [ROLES.HR_MANAGER]: {
    canManageContent: false, canManageStaff: false, canManageSubAdmins: false,
    canManageHRManagers: false, canManageSettings: false, canViewAllLeads: false,
    canEditLeads: false, canDeleteLeads: false, canViewAllPerformance: false,
    canViewDailyReports: false, canViewGlobalAnalytics: false, canDeleteRecords: false,
    canViewPasswords: false, canResetPasswords: false, canManageTeams: false,
    canAssignLeads: false, canManageHR: true, canManageProjects: false,
    canManageCMS: false, canViewBookings: false, canCreateBookings: false,
    canViewInvoices: false, canManageInvoices: false, canImportLeads: false,
    canExportLeads: false, canManageNotifications: false,
    canMarkAttendance: true, canApproveLeaves: true, canGeneratePayroll: true,
    canUploadDocuments: true, canViewHRDashboard: true, canManageHREmployees: true,
  },
  [ROLES.MANAGER]: {
    canManageContent: false, canManageStaff: true, canManageSubAdmins: false,
    canManageHRManagers: false, canManageSettings: false, canViewAllLeads: false,
    canEditLeads: true, canDeleteLeads: false, canViewAllPerformance: true,
    canViewDailyReports: true, canViewGlobalAnalytics: false, canDeleteRecords: false,
    canViewPasswords: false, canResetPasswords: false, canManageTeams: true,
    canAssignLeads: true, canManageHR: false, canManageProjects: true,
    canManageCMS: false, canViewBookings: true, canCreateBookings: false,
    canViewInvoices: false, canManageInvoices: false, canImportLeads: false,
    canExportLeads: false, canManageNotifications: false,
    canMarkAttendance: false, canApproveLeaves: false, canGeneratePayroll: false,
    canUploadDocuments: false, canViewHRDashboard: false, canManageHREmployees: false,
  },
  [ROLES.SALES_EXECUTIVE]: {
    canManageContent: false, canManageStaff: false, canManageSubAdmins: false,
    canManageHRManagers: false, canManageSettings: false, canViewAllLeads: false,
    canEditLeads: true, canDeleteLeads: false, canViewAllPerformance: false,
    canViewDailyReports: false, canViewGlobalAnalytics: false, canDeleteRecords: false,
    canViewPasswords: false, canResetPasswords: false, canManageTeams: false,
    canAssignLeads: false, canManageHR: false, canManageProjects: false,
    canManageCMS: false, canViewBookings: true, canCreateBookings: true,
    canViewInvoices: false, canManageInvoices: false, canImportLeads: false,
    canExportLeads: false, canScheduleSiteVisits: true, canManageNotifications: false,
    canMarkAttendance: false, canApproveLeaves: false, canGeneratePayroll: false,
    canUploadDocuments: false, canViewHRDashboard: false, canManageHREmployees: false,
  },
  [ROLES.TELECALLER]: {
    canManageContent: false, canManageStaff: false, canManageSubAdmins: false,
    canManageHRManagers: false, canManageSettings: false, canViewAllLeads: false,
    canEditLeads: false, canDeleteLeads: false, canViewAllPerformance: false,
    canViewDailyReports: false, canViewGlobalAnalytics: false, canDeleteRecords: false,
    canViewPasswords: false, canResetPasswords: false, canManageTeams: false,
    canAssignLeads: false, canManageHR: false, canManageProjects: false,
    canManageCMS: false, canViewBookings: false, canCreateBookings: false,
    canViewInvoices: false, canManageInvoices: false, canImportLeads: false,
    canExportLeads: false, canScheduleSiteVisits: false,
    canMakeCalls: true, canScheduleAppointments: true, canManageNotifications: false,
    canMarkAttendance: false, canApproveLeaves: false, canGeneratePayroll: false,
    canUploadDocuments: false, canViewHRDashboard: false, canManageHREmployees: false,
  },
};

// ── Sidebar menus ─────────────────────────────────────────
const MENU_STRUCTURE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard',             path: '/crm/admin/dashboard',              icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory',    path: '/crm/admin/projects',               icon: 'Layers' },
    { label: 'Leads Management',      path: '/crm/admin/leads',                  icon: 'Users' },
    { label: 'Import Leads',          path: '/crm/admin/import-leads',           icon: 'UserPlus' },
    { label: 'Employee Management',   path: '/crm/admin/employees',              icon: 'UserCheck' },
    { label: 'Sub Admin Management',  path: '/crm/admin/sub-admins',             icon: 'Shield' },
    { label: 'HR Manager Setup',      path: '/crm/admin/hr-managers',            icon: 'Briefcase' },
    { label: 'Customers',             path: '/crm/admin/customers',              icon: 'UserCircle' },
    { label: 'Invoices',              path: '/crm/admin/invoices',               icon: 'FileText' },
    { label: 'CRM Settings',          path: '/crm/admin/crm-settings',           icon: 'Settings' },
    { label: 'Reports & Analytics',   path: '/crm/admin/daily-reports',          icon: 'BarChart2' },
    { label: 'Performance',           path: '/crm/admin/performance',            icon: 'TrendingUp' },
    { label: 'Employee Intelligence', path: '/crm/admin/employee-intelligence',  icon: 'Award' },
    { label: 'Revenue Analytics',     path: '/crm/admin/revenue-analytics',      icon: 'PieChart' },
    { label: 'Call Analytics',        path: '/crm/admin/call-analytics',         icon: 'PhoneCall' },
    { label: 'Booking Analytics',     path: '/crm/admin/booking-analytics',      icon: 'CalendarCheck' },
    { label: 'HR Dashboard',          path: '/crm/admin/hr/dashboard',           icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',       path: '/crm/admin/hr/employees',           icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',            path: '/crm/admin/hr/attendance',          icon: 'ClipboardList',   group: 'HR' },
    { label: 'Payroll',               path: '/crm/admin/hr/payroll',             icon: 'IndianRupee',     group: 'HR' },
    { label: 'Documents',             path: '/crm/admin/hr/documents',           icon: 'FolderOpen',      group: 'HR' },
    { label: 'Content Management',    path: '/crm/admin/cms',                    icon: 'Globe',           group: 'System' },
    { label: 'Import Work Logs',      path: '/crm/admin/import-work-logs',       icon: 'Upload',          group: 'System' },
    { label: 'WA Templates',          path: '/crm/admin/wa-templates',           icon: 'MessageSquare',   group: 'System' },
    { label: 'Notifications',         path: '/crm/admin/notifications',          icon: 'Bell',            group: 'System' },
    { label: 'My Profile',            path: '/crm/profile',                      icon: 'User' },
  ],

  [ROLES.SUB_ADMIN]: [
    { label: 'Dashboard',             path: '/crm/admin/dashboard',              icon: 'LayoutDashboard' },
    { label: 'Leads Management',      path: '/crm/admin/leads',                  icon: 'Users' },
    { label: 'Import Leads',          path: '/crm/admin/import-leads',           icon: 'UserPlus' },
    { label: 'Projects/Inventory',    path: '/crm/admin/projects',               icon: 'Layers' },
    { label: 'Staff Management',      path: '/crm/admin/staff-management',       icon: 'UserCheck' },
    { label: 'Staff Performance',     path: '/crm/admin/staff-performance',      icon: 'TrendingUp' },
    { label: 'Employee Intelligence', path: '/crm/admin/employee-intelligence',  icon: 'Award' },
    { label: 'Daily Reports',         path: '/crm/admin/daily-reports',          icon: 'FileText',        group: 'Reports' },
    { label: 'Revenue Analytics',     path: '/crm/admin/revenue-analytics',      icon: 'PieChart',        group: 'Reports' },
    { label: 'Call Logs',             path: '/crm/admin/call-analytics',         icon: 'PhoneCall',       group: 'Reports' },
    { label: 'Booking Analytics',     path: '/crm/admin/booking-analytics',      icon: 'CalendarCheck',   group: 'Reports' },
    { label: 'HR Overview',           path: '/crm/admin/hr/dashboard',           icon: 'BarChart2',       group: 'HR Overview' },
    { label: 'My Profile',            path: '/crm/profile',                      icon: 'User' },
  ],

  [ROLES.HR_MANAGER]: [
    { label: 'HR Dashboard',  path: '/crm/hr/dashboard',   icon: 'LayoutDashboard' },
    { label: 'Employee Master', path: '/crm/hr/employees', icon: 'UserPlus' },
    { label: 'Attendance',    path: '/crm/hr/attendance',  icon: 'ClipboardList' },
    { label: 'Payroll',       path: '/crm/hr/payroll',     icon: 'IndianRupee' },
    { label: 'Documents',     path: '/crm/hr/documents',   icon: 'FolderOpen' },
    { label: 'My Profile',    path: '/crm/profile',        icon: 'User' },
  ],

  [ROLES.MANAGER]: [
    { label: 'Dashboard',          path: '/crm/admin/dashboard',          icon: 'LayoutDashboard' },
    { label: 'Team Performance',   path: '/crm/admin/staff-performance',  icon: 'TrendingUp' },
    { label: 'Lead Management',    path: '/crm/admin/leads',              icon: 'Users' },
    { label: 'Team Management',    path: '/crm/admin/staff-management',   icon: 'UserCheck' },
    { label: 'Daily Reports',      path: '/crm/admin/daily-reports',      icon: 'FileText' },
    { label: 'Call Analytics',     path: '/crm/admin/call-analytics',     icon: 'PhoneCall' },
    { label: 'Projects/Inventory', path: '/crm/admin/projects',           icon: 'Layers' },
    { label: 'My Profile',         path: '/crm/profile',                  icon: 'User' },
  ],

  // ✅ SIMPLIFIED Employee Menu — 6 items, Call CRM first
  [ROLES.SALES_EXECUTIVE]: [
    { label: '📞 Call CRM',    path: '/crm/sales/crm',           icon: 'PhoneCall' },
    { label: 'My Leads',       path: '/crm/sales/my-leads',      icon: 'Users' },
    { label: 'Site Visits',    path: '/crm/sales/site-visits',   icon: 'MapPin' },
    { label: 'Bookings',       path: '/crm/sales/bookings',      icon: 'CalendarCheck' },
    { label: 'EOD Report',     path: '/crm/sales/eod-reports',   icon: 'FileText' },
    { label: 'My Profile',     path: '/crm/profile',             icon: 'User' },
  ],

  // ✅ SIMPLIFIED Telecaller Menu — call-focused
  [ROLES.TELECALLER]: [
    { label: '📞 Call CRM',    path: '/crm/sales/crm',           icon: 'PhoneCall' },
    { label: 'My Leads',       path: '/crm/sales/my-leads',      icon: 'Users' },
    { label: 'EOD Report',     path: '/crm/sales/eod-reports',   icon: 'FileText' },
    { label: 'My Profile',     path: '/crm/profile',             icon: 'User' },
  ],
};

// ── Exports ───────────────────────────────────────────────
export const hasPermission = (role, permission) =>
  PERMISSIONS[role]?.[permission] ?? false;

export const canAccessPage = (role, path) => {
  if (role === ROLES.SUPER_ADMIN) return true;
  if (role === ROLES.HR_MANAGER) {
    if (path.startsWith('/crm/hr/')) return true;
    if (path === '/crm/profile')    return true;
    return false;
  }
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
    if (path.includes('/hr/employees'))  return false;
    if (path.includes('/hr/attendance')) return false;
    if (path.includes('/hr/payroll'))    return false;
    if (path.includes('/hr/documents'))  return false;
    return true;
  }
  if (role === ROLES.MANAGER) {
    if (path.includes('/crm-settings'))     return false;
    if (path.includes('/sub-admins'))       return false;
    if (path.includes('/hr-managers'))      return false;
    if (path.includes('/cms'))              return false;
    if (path.includes('/notifications'))    return false;
    if (path.includes('/hr/'))              return false;
    if (path.includes('/import-work-logs')) return false;
    if (path.includes('/import-leads'))     return false;
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

const ROLE_RANK = {
  super_admin: 100, sub_admin: 60, hr_manager: 55,
  manager: 50, sales_executive: 20, telecaller: 10,
};
export const roleRank     = role => ROLE_RANK[role] ?? 0;
export const isHigherRole = (actorRole, targetRole) =>
  roleRank(actorRole) > roleRank(targetRole);
