export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SALES_MANAGER: 'sales_manager',
  SALES_EXECUTIVE: 'sales_executive',
  TELECALLER: 'telecaller',
  EMPLOYEE: 'sales_executive',
  SUB_ADMIN: 'sales_manager',
  MANAGER: 'sales_manager'
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
    canAssignLeads: true
  },
  [ROLES.SALES_MANAGER]: {
    canManageContent: false,
    canManageStaff: true,
    canManageSubAdmins: false,
    canManageSettings: false,
    canViewAllLeads: true,
    canViewAllPerformance: true,
    canViewDailyReports: true,
    canViewGlobalAnalytics: false,
    canDeleteRecords: false,
    canViewPasswords: false,
    canManageTeams: true,
    canAssignLeads: true
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
    canCreateBookings: true
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
    canScheduleAppointments: true
  }
};

const MENU_STRUCTURE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', path: '/crm/admin/dashboard', icon: 'LayoutDashboard' },
    { label: 'Projects/Inventory', path: '/crm/admin/projects', icon: 'Layers' },
    { label: 'Leads Management', path: '/crm/admin/leads', icon: 'Users' },
    { label: 'Employee Management', path: '/crm/admin/employees', icon: 'UserCheck' },
    { label: 'Sub Admin Management', path: '/crm/admin/sub-admins', icon: 'Shield' },
    { label: 'Reports & Analytics', path: '/crm/admin/daily-reports', icon: 'BarChart2' },
    { label: 'My Profile', path: '/crm/profile', icon: 'User' }
  ],
  [ROLES.SALES_MANAGER]: [
    { label: 'Dashboard', path: '/crm/manager/dashboard', icon: 'LayoutDashboard' },
    { label: 'Team Performance', path: '/crm/manager/performance', icon: 'TrendingUp' },
    { label: 'Lead Management', path: '/crm/manager/leads', icon: 'Users' },
    { label: 'Team Management', path: '/crm/manager/team', icon: 'UserCheck' },
    { label: 'Daily Reports', path: '/crm/manager/daily-reports', icon: 'FileText' },
    { label: 'My Profile', path: '/crm/profile', icon: 'User' }
  ],
  [ROLES.SALES_EXECUTIVE]: [
    { label: 'Dashboard', path: '/crm/employee/dashboard', icon: 'LayoutDashboard' },
    { label: 'My Leads', path: '/crm/employee/leads', icon: 'Users' },
    { label: 'Site Visits', path: '/crm/employee/site-visits', icon: 'MapPin' },
    { label: 'Daily Calling', path: '/crm/employee/daily-calling', icon: 'Phone' },
    { label: 'Assigned Tasks', path: '/crm/employee/tasks', icon: 'CheckSquare' },
    { label: 'EOD Report', path: '/crm/employee/eod-reports', icon: 'FileText' },
    { label: 'My Profile', path: '/crm/profile', icon: 'User' }
  ]
};

export const hasPermission = (role, permission) => PERMISSIONS[role]?.[permission] || false;

export const canAccessPage = (role, path) => {
  if (role === ROLES.SUPER_ADMIN) return true;

  if (role === ROLES.SALES_MANAGER) {
    if (path.includes('/crm/admin')) return false;
    return true;
  }

  if (role === ROLES.SALES_EXECUTIVE || role === ROLES.TELECALLER) {
    if (path.includes('/crm/admin') || path.includes('/crm/manager')) return false;
    return true;
  }

  return false;
};

export const getVisibleMenuItems = (role) => MENU_STRUCTURE[role] || [];
