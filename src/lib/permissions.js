
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SUB_ADMIN: 'sub_admin',
  EMPLOYEE: 'sales_executive'
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
  },
  [ROLES.SUB_ADMIN]: {
    canManageContent: false,
    canManageStaff: false, // View only
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: false, // Assigned only
    canViewAllPerformance: false, // Team metrics
    canViewDailyReports: true,
    canViewGlobalAnalytics: true,
    canDeleteRecords: false,
    canViewPasswords: false,
  },
  [ROLES.EMPLOYEE]: {
    canManageContent: false,
    canManageStaff: false,
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: false, // Own only
    canViewAllPerformance: false, // Own only
    canViewDailyReports: false,
    canViewGlobalAnalytics: false,
    canDeleteRecords: false,
    canViewPasswords: false,
  }
};

const MENU_STRUCTURE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', path: '/crm/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory', path: '/crm/admin/projects', icon: 'Layers' },
    { label: 'Leads Management', path: '/crm/admin/leads', icon: 'Users' },
    { label: 'Employee Management', path: '/crm/admin/employees', icon: 'UserCheck' },
    { label: 'Sub Admin Management', path: '/crm/admin/sub-admins', icon: 'Shield' },
    { label: 'CRM Settings', path: '/crm/admin/crm-settings', icon: 'Settings' },
    { label: 'Reports & Analytics', path: '/crm/admin/daily-reports', icon: 'BarChart2' },
    { label: 'My Profile', path: '/crm/profile', icon: 'User' },
  ],
  [ROLES.SUB_ADMIN]: [
    { label: 'Dashboard', path: '/crm/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory', path: '/crm/admin/projects', icon: 'Layers' },
    { label: 'Leads Management', path: '/crm/admin/leads', icon: 'Users' },
    { label: 'Staff Management', path: '/crm/admin/staff-management', icon: 'UserCheck' },
    { label: 'Staff Performance', path: '/crm/admin/staff-performance', icon: 'TrendingUp' },
    { label: 'Daily Reports', path: '/crm/admin/daily-reports', icon: 'FileText' },
    { label: 'Call Logs', path: '/crm/admin/call-analytics', icon: 'PhoneCall' },
    { label: 'Analytics', path: '/crm/admin/revenue-analytics', icon: 'PieChart' },
    { label: 'My Profile', path: '/crm/profile', icon: 'User' },
  ],
  [ROLES.EMPLOYEE]: [
    { label: 'Dashboard', path: '/crm/employee-dashboard', icon: 'LayoutDashboard' },
    { label: 'My Leads', path: '/crm/my-leads', icon: 'Users' },
    { label: 'Assigned Tasks', path: '/crm/sales/tasks', icon: 'CheckSquare' },
    { label: 'EOD Report', path: '/crm/sales/eod-reports', icon: 'FileText' },
    { label: 'My Profile', path: '/crm/profile', icon: 'User' },
  ]
};

export const hasPermission = (role, permission) => {
  return PERMISSIONS[role]?.[permission] || false;
};

export const canAccessPage = (role, path) => {
  if (role === ROLES.SUPER_ADMIN) return true;
  
  if (role === ROLES.SUB_ADMIN) {
     if (path.includes('/crm-settings')) return false;
     if (path.includes('/sub-admins')) return false;
     if (path.includes('/employees') && path.includes('edit')) return false; // View only for generic route, specific logic in component
     return true;
  }
  
  if (role === ROLES.EMPLOYEE) {
     if (path.includes('/admin')) return false;
     return true;
  }
  return false;
};

export const getVisibleMenuItems = (role) => {
  return MENU_STRUCTURE[role] || [];
};
