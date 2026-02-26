// src/lib/permissions.js
// ✅ Privilege hierarchy: super_admin > sub_admin > sales_executive / telecaller
// sub_admin = owner-level CRM user: can manage staff, leads, analytics, HR
// sub_admin CANNOT: access CRM settings, create/delete sub-admins, view passwords, delete records

export const ROLES = {
  SUPER_ADMIN:     'super_admin',
  MANAGER:         'manager',
  SUB_ADMIN:       'sub_admin',
  SALES_EXECUTIVE: 'sales_executive',
  TELECALLER:      'telecaller',
  EMPLOYEE:        'sales_executive',
};

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    // Full control — nothing blocked
    canManageContent:     true,
    canManageStaff:       true,
    canManageSubAdmins:   true,
    canManageSettings:    true,
    canViewAllLeads:      true,
    canEditLeads:         true,
    canDeleteLeads:       true,
    canViewAllPerformance:true,
    canViewDailyReports:  true,
    canViewGlobalAnalytics:true,
    canDeleteRecords:     true,
    canViewPasswords:     true,
    canResetPasswords:    true,
    canManageTeams:       true,
    canAssignLeads:       true,
    canManageHR:          true,
    canManageProjects:    true,
    canManageCMS:         true,
    canViewBookings:      true,
    canCreateBookings:    true,
    canViewInvoices:      true,
    canManageInvoices:    true,
    canImportLeads:       true,
    canExportLeads:       true,
    canManageNotifications: true,
  },
  [ROLES.SUB_ADMIN]: {
    // Owner-level: can operate the business, cannot touch system settings
    canManageContent:     false,  // ❌ No CMS editing
    canManageStaff:       true,   // ✅ Add/edit sales staff
    canManageSubAdmins:   false,  // ❌ Cannot create other sub-admins
    canManageSettings:    false,  // ❌ No CRM settings / security
    canViewAllLeads:      true,   // ✅ See all leads
    canEditLeads:         true,   // ✅ Edit lead details
    canDeleteLeads:       false,  // ❌ Cannot permanently delete leads
    canViewAllPerformance:true,   // ✅ Team performance
    canViewDailyReports:  true,   // ✅ Daily reports
    canViewGlobalAnalytics:true,  // ✅ Revenue / call / booking analytics
    canDeleteRecords:     false,  // ❌ No hard deletes
    canViewPasswords:     false,  // ❌ Cannot view staff passwords
    canResetPasswords:    false,  // ❌ Cannot reset staff passwords
    canManageTeams:       true,   // ✅ Assign teams
    canAssignLeads:       true,   // ✅ Assign leads to staff
    canManageHR:          true,   // ✅ HR: attendance, payroll, docs
    canManageProjects:    true,   // ✅ View/manage projects
    canManageCMS:         false,  // ❌ No CMS
    canViewBookings:      true,   // ✅ View bookings
    canCreateBookings:    false,  // ❌ Cannot create booking directly
    canViewInvoices:      true,   // ✅ View invoices
    canManageInvoices:    false,  // ❌ Cannot create invoices
    canImportLeads:       true,   // ✅ Can import leads
    canExportLeads:       true,   // ✅ Can export leads
    canManageNotifications: false,// ❌ No notification settings
  },
  [ROLES.MANAGER]: {
    canManageContent:     false,
    canManageStaff:       true,
    canManageSubAdmins:   false,
    canManageSettings:    false,
    canViewAllLeads:      false,
    canEditLeads:         true,
    canDeleteLeads:       false,
    canViewAllPerformance:true,
    canViewDailyReports:  true,
    canViewGlobalAnalytics:false,
    canDeleteRecords:     false,
    canViewPasswords:     false,
    canResetPasswords:    false,
    canManageTeams:       true,
    canAssignLeads:       true,
    canManageHR:          true,
    canManageProjects:    true,
    canManageCMS:         false,
    canViewBookings:      true,
    canCreateBookings:    false,
    canViewInvoices:      false,
    canManageInvoices:    false,
    canImportLeads:       false,
    canExportLeads:       false,
    canManageNotifications: false,
  },
  [ROLES.SALES_EXECUTIVE]: {
    canManageContent:     false,
    canManageStaff:       false,
    canManageSubAdmins:   false,
    canManageSettings:    false,
    canViewAllLeads:      false,
    canEditLeads:         true,
    canDeleteLeads:       false,
    canViewAllPerformance:false,
    canViewDailyReports:  false,
    canViewGlobalAnalytics:false,
    canDeleteRecords:     false,
    canViewPasswords:     false,
    canResetPasswords:    false,
    canManageTeams:       false,
    canAssignLeads:       false,
    canManageHR:          false,
    canManageProjects:    false,
    canManageCMS:         false,
    canViewBookings:      true,
    canCreateBookings:    true,
    canViewInvoices:      false,
    canManageInvoices:    false,
    canImportLeads:       false,
    canExportLeads:       false,
    canScheduleSiteVisits:true,
    canManageNotifications: false,
  },
  [ROLES.TELECALLER]: {
    canManageContent:     false,
    canManageStaff:       false,
    canManageSubAdmins:   false,
    canManageSettings:    false,
    canViewAllLeads:      false,
    canEditLeads:         false,
    canDeleteLeads:       false,
    canViewAllPerformance:false,
    canViewDailyReports:  false,
    canViewGlobalAnalytics:false,
    canDeleteRecords:     false,
    canViewPasswords:     false,
    canResetPasswords:    false,
    canManageTeams:       false,
    canAssignLeads:       false,
    canManageHR:          false,
    canManageProjects:    false,
    canManageCMS:         false,
    canViewBookings:      false,
    canCreateBookings:    false,
    canViewInvoices:      false,
    canManageInvoices:    false,
    canImportLeads:       false,
    canExportLeads:       false,
    canScheduleSiteVisits:false,
    canMakeCalls:         true,
    canScheduleAppointments: true,
    canManageNotifications: false,
  },
};

// ─── Sidebar menus ───────────────────────────────────────────────────────────
const MENU_STRUCTURE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard',            path: '/crm/admin/dashboard',         icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory',   path: '/crm/admin/projects',          icon: 'Layers' },
    { label: 'Leads Management',     path: '/crm/admin/leads',             icon: 'Users' },
    { label: 'Employee Management',  path: '/crm/admin/employees',         icon: 'UserCheck' },
    { label: 'Sub Admin Management', path: '/crm/admin/sub-admins',        icon: 'Shield' },
    { label: 'Customers',            path: '/crm/admin/customers',         icon: 'UserCircle' },
    { label: 'Invoices',             path: '/crm/admin/invoices',          icon: 'FileText' },
    { label: 'CRM Settings',         path: '/crm/admin/crm-settings',      icon: 'Settings' },
    { label: 'Reports & Analytics',  path: '/crm/admin/daily-reports',     icon: 'BarChart2' },
    { label: 'Performance',          path: '/crm/admin/performance',       icon: 'TrendingUp' },
    { label: 'Revenue Analytics',    path: '/crm/admin/revenue-analytics', icon: 'PieChart' },
    { label: 'Call Analytics',       path: '/crm/admin/call-analytics',    icon: 'PhoneCall' },
    { label: 'Booking Analytics',    path: '/crm/admin/booking-analytics', icon: 'CalendarCheck' },
    // HR
    { label: 'HR Dashboard',         path: '/crm/admin/hr/dashboard',      icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',      path: '/crm/admin/hr/employees',      icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',           path: '/crm/admin/hr/attendance',     icon: 'ClipboardList',   group: 'HR' },
    { label: 'Payroll',              path: '/crm/admin/hr/payroll',        icon: 'IndianRupee',     group: 'HR' },
    { label: 'Documents',            path: '/crm/admin/hr/documents',      icon: 'FolderOpen',      group: 'HR' },
    // System (super_admin only)
    { label: 'Content Management',   path: '/crm/admin/cms',               icon: 'Globe',           group: 'System' },
    { label: 'WA Templates',         path: '/crm/admin/wa-templates',      icon: 'MessageSquare',   group: 'System' },
    { label: 'Notifications',        path: '/crm/admin/notifications',     icon: 'Bell',            group: 'System' },
    { label: 'My Profile',           path: '/crm/profile',                 icon: 'User' },
  ],
  [ROLES.SUB_ADMIN]: [
    // ── Core ──
    { label: 'Dashboard',            path: '/crm/admin/dashboard',         icon: 'LayoutDashboard' },
    { label: 'Leads Management',     path: '/crm/admin/leads',             icon: 'Users' },
    { label: 'Projects/Inventory',   path: '/crm/admin/projects',          icon: 'Layers' },
    { label: 'Staff Management',     path: '/crm/admin/staff-management',  icon: 'UserCheck' },
    { label: 'Staff Performance',    path: '/crm/admin/staff-performance', icon: 'TrendingUp' },
    // ── Reports ──
    { label: 'Daily Reports',        path: '/crm/admin/daily-reports',     icon: 'FileText',        group: 'Reports' },
    { label: 'Revenue Analytics',    path: '/crm/admin/revenue-analytics', icon: 'PieChart',        group: 'Reports' },
    { label: 'Call Logs',            path: '/crm/admin/call-analytics',    icon: 'PhoneCall',       group: 'Reports' },
    { label: 'Booking Analytics',    path: '/crm/admin/booking-analytics', icon: 'CalendarCheck',   group: 'Reports' },
    // ── HR ──
    { label: 'HR Dashboard',         path: '/crm/admin/hr/dashboard',      icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',      path: '/crm/admin/hr/employees',      icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',           path: '/crm/admin/hr/attendance',     icon: 'ClipboardList',   group: 'HR' },
    { label: 'Payroll',              path: '/crm/admin/hr/payroll',        icon: 'IndianRupee',     group: 'HR' },
    { label: 'Documents',            path: '/crm/admin/hr/documents',      icon: 'FolderOpen',      group: 'HR' },
    // ── Profile ──
    { label: 'My Profile',           path: '/crm/profile',                 icon: 'User' },
  ],
  [ROLES.MANAGER]: [
    { label: 'Dashboard',            path: '/crm/admin/dashboard',         icon: 'LayoutDashboard' },
    { label: 'Team Performance',     path: '/crm/admin/staff-performance', icon: 'TrendingUp' },
    { label: 'Lead Management',      path: '/crm/admin/leads',             icon: 'Users' },
    { label: 'Team Management',      path: '/crm/admin/staff-management',  icon: 'UserCheck' },
    { label: 'Daily Reports',        path: '/crm/admin/daily-reports',     icon: 'FileText' },
    { label: 'Call Analytics',       path: '/crm/admin/call-analytics',    icon: 'PhoneCall' },
    { label: 'Projects/Inventory',   path: '/crm/admin/projects',          icon: 'Layers' },
    { label: 'HR Dashboard',         path: '/crm/admin/hr/dashboard',      icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',      path: '/crm/admin/hr/employees',      icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',           path: '/crm/admin/hr/attendance',     icon: 'ClipboardList',   group: 'HR' },
    { label: 'Payroll',              path: '/crm/admin/hr/payroll',        icon: 'IndianRupee',     group: 'HR' },
    { label: 'Documents',            path: '/crm/admin/hr/documents',      icon: 'FolderOpen',      group: 'HR' },
    { label: 'My Profile',           path: '/crm/profile',                 icon: 'User' },
  ],
  [ROLES.SALES_EXECUTIVE]: [
    { label: 'Dashboard',      path: '/crm/employee-dashboard',   icon: 'LayoutDashboard' },
    { label: 'My Leads',       path: '/crm/my-leads',             icon: 'Users' },
    { label: 'Site Visits',    path: '/crm/sales/site-visits',    icon: 'MapPin' },
    { label: 'Daily Calling',  path: '/crm/sales/daily-calling',  icon: 'Phone' },
    { label: 'Assigned Tasks', path: '/crm/sales/tasks',          icon: 'CheckSquare' },
    { label: 'EOD Report',     path: '/crm/sales/eod-reports',    icon: 'FileText' },
    { label: 'My Profile',     path: '/crm/profile',              icon: 'User' },
  ],
  [ROLES.TELECALLER]: [
    { label: 'Dashboard',      path: '/crm/employee-dashboard',   icon: 'LayoutDashboard' },
    { label: 'My Leads',       path: '/crm/my-leads',             icon: 'Users' },
    { label: 'Daily Calling',  path: '/crm/sales/daily-calling',  icon: 'Phone' },
    { label: 'Assigned Tasks', path: '/crm/sales/tasks',          icon: 'CheckSquare' },
    { label: 'EOD Report',     path: '/crm/sales/eod-reports',    icon: 'FileText' },
    { label: 'My Profile',     path: '/crm/profile',              icon: 'User' },
  ],
};

// ─── Exports ─────────────────────────────────────────────────────────────────
export const hasPermission = (role, permission) =>
  PERMISSIONS[role]?.[permission] ?? false;

export const canAccessPage = (role, path) => {
  if (role === ROLES.SUPER_ADMIN) return true;

  if (role === ROLES.SUB_ADMIN) {
    // Blocked pages for sub_admin
    if (path.includes('/crm-settings'))   return false; // CRM system settings
    if (path.includes('/sub-admins'))     return false; // Sub-admin management
    if (path.includes('/notifications'))  return false; // Notification settings
    if (path.includes('/wa-templates'))   return false; // WA templates
    if (path.includes('/cms'))            return false; // Content management
    if (path.includes('/homepage-content-editor')) return false;
    if (path.includes('/developer-console'))       return false;
    if (path.includes('/settings/security'))       return false;
    if (path.includes('/settings/account'))        return false;
    return true; // Everything else is accessible
  }

  if (role === ROLES.MANAGER) {
    if (path.includes('/crm-settings'))  return false;
    if (path.includes('/sub-admins'))    return false;
    if (path.includes('/cms'))           return false;
    if (path.includes('/notifications')) return false;
    if (path.includes('/employees') && path.includes('edit')) return false;
    return true;
  }

  if (role === ROLES.SALES_EXECUTIVE || role === ROLES.TELECALLER) {
    if (path.includes('/admin')) return false;
    return true;
  }

  return false;
};

export const getVisibleMenuItems = role => MENU_STRUCTURE[role] || [];

// ─── Privilege comparison helper ─────────────────────────────────────────────
const ROLE_RANK = {
  super_admin:     100,
  sub_admin:        60,
  manager:          50,
  sales_executive:  20,
  telecaller:       10,
};
export const roleRank = role => ROLE_RANK[role] ?? 0;
export const isHigherRole = (actorRole, targetRole) =>
  roleRank(actorRole) > roleRank(targetRole);
