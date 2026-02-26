export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  SUB_ADMIN: 'sub_admin',
  SALES_EXECUTIVE: 'sales_executive',
  TELECALLER: 'telecaller',
  EMPLOYEE: 'sales_executive' // Alias for backward compatibility
};

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canManageContent: true,
    canManageStaff: true,
    canManageSubAdmins: true,
    canManageSettings: true,
    canViewAllLeads: true,
    canViewAllPerformance: true,
    canViewDailyReports: true,
    canViewGlobalAnalytics: true,
    canDeleteRecords: true,
    canViewPasswords: true,
    canManageTeams: true,
    canAssignLeads: true,
  },
  [ROLES.MANAGER]: {
    canManageContent: false,
    canManageStaff: true,
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: false,
    canViewAllPerformance: true,
    canViewDailyReports: true,
    canViewGlobalAnalytics: false,
    canDeleteRecords: false,
    canViewPasswords: false,
    canManageTeams: true,
    canAssignLeads: true,
  },
  [ROLES.SUB_ADMIN]: {
    canManageContent: false,
    canManageStaff: false,
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: false,
    canViewAllPerformance: false,
    canViewDailyReports: true,
    canViewGlobalAnalytics: true,
    canDeleteRecords: false,
    canViewPasswords: false,
    canManageTeams: false,
    canAssignLeads: false,
  },
  [ROLES.SALES_EXECUTIVE]: {
    canManageContent: false,
    canManageStaff: false,
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: false,
    canViewAllPerformance: false,
    canViewDailyReports: false,
    canViewGlobalAnalytics: false,
    canDeleteRecords: false,
    canViewPasswords: false,
    canManageTeams: false,
    canAssignLeads: false,
    canScheduleSiteVisits: true,
    canCreateBookings: true,
  },
  [ROLES.TELECALLER]: {
    canManageContent: false,
    canManageStaff: false,
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: false,
    canViewAllPerformance: false,
    canViewDailyReports: false,
    canViewGlobalAnalytics: false,
    canDeleteRecords: false,
    canViewPasswords: false,
    canManageTeams: false,
    canAssignLeads: false,
    canScheduleSiteVisits: false,
    canCreateBookings: false,
    canMakeCalls: true,
    canScheduleAppointments: true,
  }
};

const MENU_STRUCTURE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard',           path: '/crm/admin/dashboard',        icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory',  path: '/crm/admin/projects',          icon: 'Layers' },
    { label: 'Leads Management',    path: '/crm/admin/leads',             icon: 'Users' },
    { label: 'Employee Management', path: '/crm/admin/employees',         icon: 'UserCheck' },
    { label: 'Sub Admin Management',path: '/crm/admin/sub-admins',        icon: 'Shield' },
    { label: 'CRM Settings',        path: '/crm/admin/crm-settings',      icon: 'Settings' },
    { label: 'Reports & Analytics', path: '/crm/admin/daily-reports',     icon: 'BarChart2' },
    // ✅ HR Module
    { label: 'HR Dashboard',        path: '/crm/admin/hr/dashboard',      icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',     path: '/crm/admin/hr/employees',      icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',          path: '/crm/admin/hr/attendance',     icon: 'ClipboardList',   group: 'HR' },
    { label: 'My Profile',          path: '/crm/profile',                 icon: 'User' },
  ],
  [ROLES.MANAGER]: [
    { label: 'Dashboard',         path: '/crm/admin/dashboard',          icon: 'LayoutDashboard' },
    { label: 'Team Performance',  path: '/crm/admin/staff-performance',  icon: 'TrendingUp' },
    { label: 'Lead Management',   path: '/crm/admin/leads',              icon: 'Users' },
    { label: 'Team Management',   path: '/crm/admin/staff-management',   icon: 'UserCheck' },
    { label: 'Daily Reports',     path: '/crm/admin/daily-reports',      icon: 'FileText' },
    { label: 'Call Analytics',    path: '/crm/admin/call-analytics',     icon: 'PhoneCall' },
    { label: 'Projects/Inventory',path: '/crm/admin/projects',           icon: 'Layers' },
    // ✅ HR Module (view)
    { label: 'HR Dashboard',      path: '/crm/admin/hr/dashboard',       icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',   path: '/crm/admin/hr/employees',       icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',        path: '/crm/admin/hr/attendance',      icon: 'ClipboardList',   group: 'HR' },
    { label: 'My Profile',        path: '/crm/profile',                  icon: 'User' },
  ],
  [ROLES.SUB_ADMIN]: [
    { label: 'Dashboard',         path: '/crm/admin/dashboard',          icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory',path: '/crm/admin/projects',           icon: 'Layers' },
    { label: 'Leads Management',  path: '/crm/admin/leads',              icon: 'Users' },
    { label: 'Staff Management',  path: '/crm/admin/staff-management',   icon: 'UserCheck' },
    { label: 'Staff Performance', path: '/crm/admin/staff-performance',  icon: 'TrendingUp' },
    { label: 'Daily Reports',     path: '/crm/admin/daily-reports',      icon: 'FileText' },
    { label: 'Call Logs',         path: '/crm/admin/call-analytics',     icon: 'PhoneCall' },
    { label: 'Analytics',         path: '/crm/admin/revenue-analytics',  icon: 'PieChart' },
    // ✅ HR Module (view)
    { label: 'HR Dashboard',      path: '/crm/admin/hr/dashboard',       icon: 'LayoutDashboard', group: 'HR' },
    { label: 'Employee Master',   path: '/crm/admin/hr/employees',       icon: 'UserPlus',        group: 'HR' },
    { label: 'Attendance',        path: '/crm/admin/hr/attendance',      icon: 'ClipboardList',   group: 'HR' },
    { label: 'My Profile',        path: '/crm/profile',                  icon: 'User' },
  ],
  [ROLES.SALES_EXECUTIVE]: [
    { label: 'Dashboard',      path: '/crm/employee-dashboard',      icon: 'LayoutDashboard' },
    { label: 'My Leads',       path: '/crm/my-leads',                icon: 'Users' },
    { label: 'Site Visits',    path: '/crm/sales/site-visits',       icon: 'MapPin' },
    { label: 'Daily Calling',  path: '/crm/sales/daily-calling',     icon: 'Phone' },
    { label: 'Assigned Tasks', path: '/crm/sales/tasks',             icon: 'CheckSquare' },
    { label: 'EOD Report',     path: '/crm/sales/eod-reports',       icon: 'FileText' },
    { label: 'My Profile',     path: '/crm/profile',                 icon: 'User' },
  ],
  [ROLES.TELECALLER]: [
    { label: 'Dashboard',      path: '/crm/employee-dashboard',      icon: 'LayoutDashboard' },
    { label: 'My Leads',       path: '/crm/my-leads',                icon: 'Users' },
    { label: 'Daily Calling',  path: '/crm/sales/daily-calling',     icon: 'Phone' },
    { label: 'Assigned Tasks', path: '/crm/sales/tasks',             icon: 'CheckSquare' },
    { label: 'EOD Report',     path: '/crm/sales/eod-reports',       icon: 'FileText' },
    { label: 'My Profile',     path: '/crm/profile',                 icon: 'User' },
  ]
};

export const hasPermission = (role, permission) => {
  return PERMISSIONS[role]?.[permission] || false;
};

export const canAccessPage = (role, path) => {
  if (role === ROLES.SUPER_ADMIN) return true;
  if (role === ROLES.MANAGER) {
     if (path.includes('/crm-settings')) return false;
     if (path.includes('/sub-admins')) return false;
     if (path.includes('/employees') && path.includes('edit')) return false;
     return true;
  }
  if (role === ROLES.SUB_ADMIN) {
     if (path.includes('/crm-settings')) return false;
     if (path.includes('/sub-admins')) return false;
     if (path.includes('/employees') && path.includes('edit')) return false;
     return true;
  }
  if (role === ROLES.SALES_EXECUTIVE || role === ROLES.TELECALLER) {
     if (path.includes('/admin')) return false;
     return true;
  }
  return false;
};

export const getVisibleMenuItems = (role) => {
  return MENU_STRUCTURE[role] || [];
};
