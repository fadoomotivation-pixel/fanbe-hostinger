export const ADMIN_ROUTES = [
  { label: 'Dashboard', path: '/broker/admin', icon: 'LayoutDashboard' },
  { label: 'Projects', path: '/broker/admin/projects', icon: 'Building2' },
  { label: 'Inventory / Plots', path: '/broker/admin/inventory', icon: 'MapPinned' },
  { label: 'Bookings', path: '/broker/admin/bookings', icon: 'FileText' },
  { label: 'Customers', path: '/broker/admin/customers', icon: 'Users' },
  { label: 'Brokers', path: '/broker/admin/brokers', icon: 'UserCog' },
  { label: 'Payout Queue', path: '/broker/admin/payouts', icon: 'IndianRupee' },
  { label: 'Commission Rules', path: '/broker/admin/commission-rules', icon: 'Percent' },
  { label: 'Reports', path: '/broker/admin/reports', icon: 'BarChart3' },
  { label: 'Settings / Audit / Notifications', path: '/broker/admin/settings', icon: 'Settings' },
];

export const BOOKING_STAGES = ['token', 'booking', 'full_payment', 'registry_done', 'cancelled'];
export const COMMISSION_STATUS = ['pending', 'approved', 'paid', 'hold'];
export const PAYOUT_STATUS = ['pending', 'approved', 'paid', 'rejected', 'hold'];
