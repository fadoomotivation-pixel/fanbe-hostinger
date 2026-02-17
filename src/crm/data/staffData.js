/**
 * FANBE REAL ESTATE CRM - USER DATABASE
 * Created: February 14, 2026
 * Mobile-First Real Estate Management System
 * 
 * ROLES:
 * - super_admin: Full system access, analytics, team management
 * - manager: Team management, lead assignment, performance tracking  
 * - sales_executive: Lead management, calling, site visits, bookings
 * - telecaller: Lead calling, follow-ups, appointment scheduling
 */

export const staffData = [
  // ============== SUPER ADMIN ==============
  {
    id: 'SA001',
    username: 'admin',
    password: 'Admin@2026!Secure',
    name: 'System Administrator',
    role: 'super_admin',
    email: 'admin@fanbegroup.com',
    phone: '+91-9876543210',
    department: 'Management',
    joiningDate: '2024-01-01',
    status: 'Active',
    permissions: ['all'],
    avatar: 'https://ui-avatars.com/api/?name=System+Admin&background=0F3A5F&color=fff',
    metrics: {
      totalLeads: 0,
      totalCalls: 0,
      connectedCalls: 0,
      siteVisits: 0,
      bookings: 0,
      conversionRate: 0,
      revenue: 0
    },
    settings: {
      notifications: true,
      emailAlerts: true,
      whatsappAlerts: true,
      darkMode: false
    }
  },

  // ============== SUB ADMIN ==============
  {
    id: 'SUBADM001',
    username: 'subadmin',
    password: 'SubAdmin@2026',
    name: 'Sub Administrator',
    role: 'sub_admin',
    email: 'subadmin@fanbegroup.com',
    phone: '+91-9876543211',
    department: 'Management',
    joiningDate: '2024-01-15',
    status: 'Active',
    permissions: ['view_reports', 'view_analytics', 'manage_staff', 'view_leads'],
    avatar: 'https://ui-avatars.com/api/?name=Sub+Admin&background=7c3aed&color=fff',
    metrics: {
      totalLeads: 0,
      totalCalls: 0,
      connectedCalls: 0,
      siteVisits: 0,
      bookings: 0,
      conversionRate: 0,
      revenue: 0
    },
    settings: {
      notifications: true,
      emailAlerts: true,
      whatsappAlerts: true,
      darkMode: false
    }
  },

  // ============== MANAGERS ==============
  {
    id: 'MGR001',
    username: 'rajesh.manager',
    password: 'Manager@2026',
    name: 'Rajesh Kumar',
    role: 'manager',
    email: 'rajesh@fanbegroup.com',
    phone: '+91-9876543221',
    department: 'Sales',
    joiningDate: '2024-02-15',
    status: 'Active',
    permissions: ['manage_team', 'assign_leads', 'view_reports', 'manage_properties'],
    avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=2563eb&color=fff',
    teamMembers: ['SE001', 'SE002', 'TC001'],
    metrics: {
      teamSize: 3,
      totalLeads: 150,
      teamBookings: 25,
      teamRevenue: 7500000,
      conversionRate: 17
    },
    settings: {
      notifications: true,
      emailAlerts: true,
      whatsappAlerts: true,
      darkMode: false
    }
  },

  {
    id: 'MGR002',
    username: 'priya.manager',
    password: 'Manager@2026',
    name: 'Priya Sharma',
    role: 'manager',
    email: 'priya@fanbegroup.com',
    phone: '+91-9876543222',
    department: 'Sales',
    joiningDate: '2024-03-01',
    status: 'Active',
    permissions: ['manage_team', 'assign_leads', 'view_reports', 'manage_properties'],
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=7c3aed&color=fff',
    teamMembers: ['SE003', 'SE004', 'TC002'],
    metrics: {
      teamSize: 3,
      totalLeads: 180,
      teamBookings: 32,
      teamRevenue: 9600000,
      conversionRate: 18
    },
    settings: {
      notifications: true,
      emailAlerts: true,
      whatsappAlerts: true,
      darkMode: false
    }
  },

  // ============== SALES EXECUTIVES (Field Staff) ==============
  {
    id: 'SE001',
    username: 'amit.sales',
    password: 'Sales@2026',
    name: 'Amit Verma',
    role: 'sales_executive',
    email: 'amit@fanbegroup.com',
    phone: '+91-9876543231',
    department: 'Sales',
    joiningDate: '2024-04-01',
    status: 'Active',
    manager: 'MGR001',
    permissions: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    avatar: 'https://ui-avatars.com/api/?name=Amit+Verma&background=16a34a&color=fff',
    metrics: {
      totalLeads: 45,
      totalCalls: 385,
      connectedCalls: 280,
      siteVisits: 28,
      bookings: 8,
      conversionRate: 18,
      revenue: 2400000,
      avgResponseTime: 12,
      customerRating: 4.5
    },
    targets: {
      monthly: {
        calls: 500,
        siteVisits: 30,
        bookings: 10
      }
    },
    settings: {
      notifications: true,
      emailAlerts: false,
      whatsappAlerts: true,
      darkMode: true,
      gpsTracking: true,
      autoCallLog: true
    }
  },

  {
    id: 'SE002',
    username: 'neha.sales',
    password: 'Sales@2026',
    name: 'Neha Gupta',
    role: 'sales_executive',
    email: 'neha@fanbegroup.com',
    phone: '+91-9876543232',
    department: 'Sales',
    joiningDate: '2024-04-15',
    status: 'Active',
    manager: 'MGR001',
    permissions: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    avatar: 'https://ui-avatars.com/api/?name=Neha+Gupta&background=dc2626&color=fff',
    metrics: {
      totalLeads: 52,
      totalCalls: 420,
      connectedCalls: 315,
      siteVisits: 35,
      bookings: 11,
      conversionRate: 21,
      revenue: 3300000,
      avgResponseTime: 8,
      customerRating: 4.7
    },
    targets: {
      monthly: {
        calls: 500,
        siteVisits: 30,
        bookings: 10
      }
    },
    settings: {
      notifications: true,
      emailAlerts: false,
      whatsappAlerts: true,
      darkMode: false,
      gpsTracking: true,
      autoCallLog: true
    }
  },

  {
    id: 'SE003',
    username: 'rahul.sales',
    password: 'Sales@2026',
    name: 'Rahul Singh',
    role: 'sales_executive',
    email: 'rahul@fanbegroup.com',
    phone: '+91-9876543233',
    department: 'Sales',
    joiningDate: '2024-05-01',
    status: 'Active',
    manager: 'MGR002',
    permissions: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    avatar: 'https://ui-avatars.com/api/?name=Rahul+Singh&background=ea580c&color=fff',
    metrics: {
      totalLeads: 38,
      totalCalls: 350,
      connectedCalls: 245,
      siteVisits: 22,
      bookings: 7,
      conversionRate: 18,
      revenue: 2100000,
      avgResponseTime: 15,
      customerRating: 4.3
    },
    targets: {
      monthly: {
        calls: 500,
        siteVisits: 30,
        bookings: 10
      }
    },
    settings: {
      notifications: true,
      emailAlerts: false,
      whatsappAlerts: true,
      darkMode: true,
      gpsTracking: true,
      autoCallLog: true
    }
  },

  {
    id: 'SE004',
    username: 'pooja.sales',
    password: 'Sales@2026',
    name: 'Pooja Patel',
    role: 'sales_executive',
    email: 'pooja@fanbegroup.com',
    phone: '+91-9876543234',
    department: 'Sales',
    joiningDate: '2024-05-15',
    status: 'Active',
    manager: 'MGR002',
    permissions: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    avatar: 'https://ui-avatars.com/api/?name=Pooja+Patel&background=0891b2&color=fff',
    metrics: {
      totalLeads: 48,
      totalCalls: 395,
      connectedCalls: 290,
      siteVisits: 30,
      bookings: 9,
      conversionRate: 19,
      revenue: 2700000,
      avgResponseTime: 10,
      customerRating: 4.6
    },
    targets: {
      monthly: {
        calls: 500,
        siteVisits: 30,
        bookings: 10
      }
    },
    settings: {
      notifications: true,
      emailAlerts: false,
      whatsappAlerts: true,
      darkMode: false,
      gpsTracking: true,
      autoCallLog: true
    }
  },

  // ============== TELECALLERS ==============
  {
    id: 'TC001',
    username: 'sonia.caller',
    password: 'Caller@2026',
    name: 'Sonia Reddy',
    role: 'telecaller',
    email: 'sonia@fanbegroup.com',
    phone: '+91-9876543241',
    department: 'Telecalling',
    joiningDate: '2024-06-01',
    status: 'Active',
    manager: 'MGR001',
    permissions: ['call_leads', 'update_status', 'schedule_appointments'],
    avatar: 'https://ui-avatars.com/api/?name=Sonia+Reddy&background=8b5cf6&color=fff',
    metrics: {
      totalLeads: 120,
      totalCalls: 850,
      connectedCalls: 520,
      appointmentsScheduled: 45,
      conversionRate: 5.3,
      avgCallDuration: 3.5,
      customerRating: 4.4
    },
    targets: {
      monthly: {
        calls: 1000,
        connected: 600,
        appointments: 50
      }
    },
    settings: {
      notifications: true,
      emailAlerts: false,
      whatsappAlerts: true,
      darkMode: false,
      autoCallLog: true,
      callRecording: true
    }
  },

  {
    id: 'TC002',
    username: 'vikram.caller',
    password: 'Caller@2026',
    name: 'Vikram Malhotra',
    role: 'telecaller',
    email: 'vikram@fanbegroup.com',
    phone: '+91-9876543242',
    department: 'Telecalling',
    joiningDate: '2024-06-15',
    status: 'Active',
    manager: 'MGR002',
    permissions: ['call_leads', 'update_status', 'schedule_appointments'],
    avatar: 'https://ui-avatars.com/api/?name=Vikram+Malhotra&background=ec4899&color=fff',
    metrics: {
      totalLeads: 135,
      totalCalls: 920,
      connectedCalls: 580,
      appointmentsScheduled: 52,
      conversionRate: 5.8,
      avgCallDuration: 4.2,
      customerRating: 4.5
    },
    targets: {
      monthly: {
        calls: 1000,
        connected: 600,
        appointments: 50
      }
    },
    settings: {
      notifications: true,
      emailAlerts: false,
      whatsappAlerts: true,
      darkMode: true,
      autoCallLog: true,
      callRecording: true
    }
  }
];

/**
 * QUICK LOGIN CREDENTIALS REFERENCE
 *
 * Super Admin:
 * Username: admin
 * Password: Admin@2026!Secure
 *
 * Sub Admin:
 * Username: subadmin
 * Password: SubAdmin@2026
 *
 * Managers:
 * Username: rajesh.manager / priya.manager
 * Password: Manager@2026
 *
 * Sales Executives (Mobile Users / Employees):
 * Username: amit.sales / neha.sales / rahul.sales / pooja.sales
 * Password: Sales@2026
 *
 * Telecallers:
 * Username: sonia.caller / vikram.caller
 * Password: Caller@2026
 */