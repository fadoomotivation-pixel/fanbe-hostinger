<?php
// Common header with navigation
// Usage: $pageTitle = 'Dashboard'; include __DIR__ . '/../includes/header.php';
if (!defined('PAGE_TITLE')) define('PAGE_TITLE', 'Fanbe CRM');
$currentRole = getUserRole();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title><?= sanitize(PAGE_TITLE) ?> - Fanbe CRM</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f0f2f5;
  color: #1a1a2e;
  min-height: 100vh;
}

/* Top Navigation */
.topnav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(102,126,234,0.3);
}
.topnav-brand {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.topnav-brand small {
  font-size: 0.7rem;
  font-weight: 400;
  opacity: 0.8;
  display: block;
  margin-top: -2px;
}
.topnav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}
.topnav-user {
  font-size: 0.85rem;
  opacity: 0.9;
}
.topnav-btn {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}
.topnav-btn:hover { background: rgba(255,255,255,0.3); }
.hamburger {
  display: none;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
}

/* Layout */
.app-layout {
  display: flex;
  min-height: calc(100vh - 60px);
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 15px 0;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  flex-shrink: 0;
  transition: transform 0.3s;
}
.sidebar-section {
  padding: 8px 20px;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #9ca3af;
  font-weight: 600;
  margin-top: 10px;
}
.sidebar a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: #4b5563;
  text-decoration: none;
  font-size: 0.88rem;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}
.sidebar a:hover {
  background: #f3f0ff;
  color: #667eea;
}
.sidebar a.active {
  background: #f3f0ff;
  color: #667eea;
  border-left-color: #667eea;
  font-weight: 600;
}
.sidebar a .icon {
  width: 20px;
  text-align: center;
  font-size: 1rem;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 20px;
  max-width: 100%;
  overflow-x: hidden;
}

/* Cards */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}
.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
}

/* Stat Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  text-align: center;
}
.stat-card .stat-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}
.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
}
.stat-card .stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}
.stat-card.purple { border-top: 3px solid #667eea; }
.stat-card.green { border-top: 3px solid #10b981; }
.stat-card.blue { border-top: 3px solid #3b82f6; }
.stat-card.orange { border-top: 3px solid #f59e0b; }
.stat-card.red { border-top: 3px solid #ef4444; }
.stat-card.pink { border-top: 3px solid #ec4899; }

/* Tables */
.table-wrap { overflow-x: auto; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}
th {
  background: #f9fafb;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
tr:hover { background: #fafbff; }

/* Badges */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-new { background: #dbeafe; color: #1e40af; }
.badge-hot { background: #fee2e2; color: #b91c1c; }
.badge-warm { background: #fef3c7; color: #92400e; }
.badge-cold { background: #e0e7ff; color: #3730a3; }
.badge-converted { background: #d1fae5; color: #065f46; }
.badge-lost { background: #f3f4f6; color: #6b7280; }
.badge-active { background: #d1fae5; color: #065f46; }
.badge-upcoming { background: #dbeafe; color: #1e40af; }
.badge-sold-out { background: #f3f4f6; color: #6b7280; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-completed { background: #d1fae5; color: #065f46; }
.badge-missed { background: #fee2e2; color: #b91c1c; }
.badge-scheduled { background: #dbeafe; color: #1e40af; }
.badge-cancelled { background: #f3f4f6; color: #6b7280; }
.badge-token { background: #fef3c7; color: #92400e; }
.badge-partial { background: #dbeafe; color: #1e40af; }
.badge-full { background: #d1fae5; color: #065f46; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-success { background: #10b981; color: #fff; }
.btn-success:hover { background: #059669; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-outline {
  background: #fff;
  color: #667eea;
  border: 1.5px solid #667eea;
}
.btn-outline:hover { background: #f3f0ff; }
.btn-sm { padding: 5px 12px; font-size: 0.78rem; }
.btn-lg { padding: 12px 28px; font-size: 1rem; }
.btn-block { width: 100%; justify-content: center; }

/* Forms */
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}
.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.15s;
  background: #fff;
}
.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}
select.form-control { cursor: pointer; }
textarea.form-control { resize: vertical; min-height: 80px; }
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Quick Action Cards */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  background: #fff;
  border-radius: 12px;
  border: 1.5px solid #f0f0f0;
  text-decoration: none;
  color: #1a1a2e;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.quick-action:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102,126,234,0.15);
}
.quick-action .qa-icon {
  font-size: 1.8rem;
}

/* Flash Messages */
.flash {
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}
.flash-success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.flash-error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
.flash-info { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }

/* Section Title */
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1a1a2e;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}
.empty-state .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
.empty-state p { font-size: 0.9rem; }

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.page-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-bar .form-control {
  width: auto;
  min-width: 150px;
}

/* Mobile Bottom Nav */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 5px 0;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}
.mobile-nav-items {
  display: flex;
  justify-content: space-around;
}
.mobile-nav-items a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.65rem;
  font-weight: 600;
}
.mobile-nav-items a .nav-icon { font-size: 1.3rem; }
.mobile-nav-items a.active { color: #667eea; }

/* FAB (Floating Action Button) */
.fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 1.5rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102,126,234,0.4);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: transform 0.2s;
}
.fab:hover { transform: scale(1.1); }

/* Utility */
.text-muted { color: #9ca3af; }
.text-sm { font-size: 0.8rem; }
.text-center { text-align: center; }
.mt-10 { margin-top: 10px; }
.mt-20 { margin-top: 20px; }
.mb-10 { margin-bottom: 10px; }
.mb-20 { margin-bottom: 20px; }
.flex { display: flex; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-10 { gap: 10px; }

/* Responsive */
@media (max-width: 768px) {
  .hamburger { display: block; }
  .sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    box-shadow: 2px 0 15px rgba(0,0,0,0.1);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay {
    display: none;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.3);
    z-index: 998;
  }
  .sidebar-overlay.open { display: block; }
  .main-content { padding: 15px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-actions { grid-template-columns: repeat(2, 1fr); }
  .form-row { grid-template-columns: 1fr; }
  .mobile-nav { display: block; }
  .fab { display: flex; }
  body { padding-bottom: 65px; }
  .page-header h1 { font-size: 1.2rem; }
  .topnav-user { display: none; }
  table { font-size: 0.78rem; }
  th, td { padding: 8px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat-card { padding: 12px; }
  .stat-card .stat-value { font-size: 1.2rem; }
  .quick-actions { grid-template-columns: 1fr 1fr; gap: 8px; }
}
</style>
</head>
<body>

<!-- Top Navigation -->
<nav class="topnav">
  <div style="display:flex;align-items:center;gap:12px;">
    <button class="hamburger" onclick="toggleSidebar()" aria-label="Menu">&#9776;</button>
    <div class="topnav-brand">
      Fanbe CRM
      <small><?php
        switch($currentRole) {
          case 'super_admin': echo 'Admin Panel'; break;
          case 'manager':
          case 'sub_admin': echo 'Manager Panel'; break;
          default: echo 'Employee Panel';
        }
      ?></small>
    </div>
  </div>
  <div class="topnav-right">
    <span class="topnav-user"><?= sanitize(getUserName()) ?></span>
    <a href="/admin/logout.php" class="topnav-btn">Logout</a>
  </div>
</nav>

<!-- App Layout -->
<div class="app-layout">

<!-- Sidebar Overlay (mobile) -->
<div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
<?php if ($currentRole === 'super_admin'): ?>
  <div class="sidebar-section">Main</div>
  <a href="/admin/dashboard.php" class="<?= $currentPage === 'dashboard' && strpos($_SERVER['PHP_SELF'], '/admin/') !== false ? 'active' : '' ?>">
    <span class="icon">&#128202;</span> Dashboard
  </a>
  <div class="sidebar-section">Management</div>
  <a href="/admin/users/list.php" class="<?= $currentPage === 'list' && strpos($_SERVER['PHP_SELF'], '/users/') !== false ? 'active' : '' ?>">
    <span class="icon">&#128101;</span> Users
  </a>
  <a href="/admin/projects/list.php" class="<?= $currentPage === 'list' && strpos($_SERVER['PHP_SELF'], '/projects/') !== false ? 'active' : '' ?>">
    <span class="icon">&#127970;</span> Projects
  </a>
  <a href="/admin/leads/list.php" class="<?= $currentPage === 'list' && strpos($_SERVER['PHP_SELF'], '/leads/') !== false ? 'active' : '' ?>">
    <span class="icon">&#128203;</span> All Leads
  </a>
  <div class="sidebar-section">Reports</div>
  <a href="/admin/reports/sales.php" class="<?= $currentPage === 'sales' ? 'active' : '' ?>">
    <span class="icon">&#128176;</span> Sales Report
  </a>
  <a href="/admin/reports/employees.php" class="<?= $currentPage === 'employees' ? 'active' : '' ?>">
    <span class="icon">&#128200;</span> Performance
  </a>
  <a href="/admin/reports/leads.php" class="<?= $currentPage === 'leads' && strpos($_SERVER['PHP_SELF'], '/reports/') !== false ? 'active' : '' ?>">
    <span class="icon">&#128202;</span> Lead Analytics
  </a>
  <div class="sidebar-section">Settings</div>
  <a href="/admin/settings/profile.php" class="<?= $currentPage === 'profile' ? 'active' : '' ?>">
    <span class="icon">&#9881;</span> Profile
  </a>

<?php elseif ($currentRole === 'manager' || $currentRole === 'sub_admin'): ?>
  <div class="sidebar-section">Main</div>
  <a href="/manager/dashboard.php" class="<?= $currentPage === 'dashboard' ? 'active' : '' ?>">
    <span class="icon">&#128202;</span> Dashboard
  </a>
  <div class="sidebar-section">Team</div>
  <a href="/manager/team.php" class="<?= $currentPage === 'team' ? 'active' : '' ?>">
    <span class="icon">&#128101;</span> My Team
  </a>
  <a href="/manager/leads.php" class="<?= $currentPage === 'leads' ? 'active' : '' ?>">
    <span class="icon">&#128203;</span> Team Leads
  </a>
  <a href="/manager/reports.php" class="<?= $currentPage === 'reports' ? 'active' : '' ?>">
    <span class="icon">&#128200;</span> Reports
  </a>
  <div class="sidebar-section">Settings</div>
  <a href="/admin/settings/profile.php" class="<?= $currentPage === 'profile' ? 'active' : '' ?>">
    <span class="icon">&#9881;</span> Profile
  </a>

<?php else: ?>
  <div class="sidebar-section">Main</div>
  <a href="/employee/dashboard.php" class="<?= $currentPage === 'dashboard' ? 'active' : '' ?>">
    <span class="icon">&#128202;</span> Dashboard
  </a>
  <div class="sidebar-section">Actions</div>
  <a href="/employee/leads/add.php" class="<?= $currentPage === 'add' && strpos($_SERVER['PHP_SELF'], '/leads/') !== false ? 'active' : '' ?>">
    <span class="icon">&#10133;</span> Add Lead
  </a>
  <a href="/employee/leads/my-leads.php" class="<?= $currentPage === 'my-leads' ? 'active' : '' ?>">
    <span class="icon">&#128203;</span> My Leads
  </a>
  <a href="/employee/followup/today.php" class="<?= $currentPage === 'today' ? 'active' : '' ?>">
    <span class="icon">&#128222;</span> Follow-ups
  </a>
  <a href="/employee/site-visits/upcoming.php" class="<?= $currentPage === 'upcoming' ? 'active' : '' ?>">
    <span class="icon">&#127968;</span> Site Visits
  </a>
  <a href="/employee/bookings/create.php" class="<?= $currentPage === 'create' ? 'active' : '' ?>">
    <span class="icon">&#128176;</span> Bookings
  </a>
  <div class="sidebar-section">Settings</div>
  <a href="/admin/settings/profile.php" class="<?= $currentPage === 'profile' ? 'active' : '' ?>">
    <span class="icon">&#9881;</span> Profile
  </a>
<?php endif; ?>
</aside>

<!-- Main Content -->
<main class="main-content">

<?php
$flash = getFlash();
if ($flash) {
    echo '<div class="flash flash-' . sanitize($flash['type']) . '">' . sanitize($flash['message']) . '</div>';
}
?>
