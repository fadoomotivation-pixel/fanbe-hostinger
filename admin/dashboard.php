<?php
require_once __DIR__ . '/config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Admin Dashboard');

// Stats
$totalUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn();
$totalLeads = $pdo->query("SELECT COUNT(*) FROM leads")->fetchColumn();
$hotLeads = $pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'Hot'")->fetchColumn();
$totalBookings = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$totalRevenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM bookings")->fetchColumn();
$totalProjects = $pdo->query("SELECT COUNT(*) FROM projects")->fetchColumn();

// This month stats
$monthLeads = $pdo->query("SELECT COUNT(*) FROM leads WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())")->fetchColumn();
$monthBookings = $pdo->query("SELECT COUNT(*) FROM bookings WHERE MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE())")->fetchColumn();
$monthRevenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE())")->fetchColumn();

// Lead status breakdown
$leadStatuses = $pdo->query("SELECT status, COUNT(*) as cnt FROM leads GROUP BY status ORDER BY cnt DESC")->fetchAll();

// Top performers (employees with most conversions)
$topPerformers = $pdo->query("
    SELECT u.full_name, u.role,
           COUNT(DISTINCT l.id) as total_leads,
           COUNT(DISTINCT CASE WHEN l.status = 'Converted' THEN l.id END) as converted,
           COUNT(DISTINCT b.id) as bookings,
           COALESCE(SUM(b.amount), 0) as revenue
    FROM users u
    LEFT JOIN leads l ON l.assigned_to = u.id
    LEFT JOIN bookings b ON b.employee_id = u.id
    WHERE u.role IN ('sales_executive', 'telecaller')
    GROUP BY u.id
    ORDER BY bookings DESC, converted DESC
    LIMIT 5
")->fetchAll();

// Recent leads
$recentLeads = $pdo->query("
    SELECT l.*, u.full_name AS assigned_name, p.name AS project_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN projects p ON l.project_interest = p.id
    ORDER BY l.created_at DESC LIMIT 10
")->fetchAll();

// Recent activity
$recentActivity = $pdo->query("
    SELECT a.*, u.full_name FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC LIMIT 8
")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
  <h1>&#128202; Admin Dashboard</h1>
  <span class="text-sm text-muted"><?= date('l, d M Y') ?></span>
</div>

<!-- Top Stats -->
<div class="stats-grid">
  <div class="stat-card purple">
    <div class="stat-icon">&#128101;</div>
    <div class="stat-value"><?= $totalUsers ?></div>
    <div class="stat-label">Active Staff</div>
  </div>
  <div class="stat-card blue">
    <div class="stat-icon">&#128203;</div>
    <div class="stat-value"><?= $totalLeads ?></div>
    <div class="stat-label">Total Leads</div>
  </div>
  <div class="stat-card red">
    <div class="stat-icon">&#128293;</div>
    <div class="stat-value"><?= $hotLeads ?></div>
    <div class="stat-label">Hot Leads</div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon">&#128176;</div>
    <div class="stat-value"><?= $totalBookings ?></div>
    <div class="stat-label">Bookings</div>
  </div>
  <div class="stat-card orange">
    <div class="stat-icon">&#127970;</div>
    <div class="stat-value"><?= $totalProjects ?></div>
    <div class="stat-label">Projects</div>
  </div>
  <div class="stat-card pink">
    <div class="stat-icon">&#128176;</div>
    <div class="stat-value"><?= number_format($totalRevenue / 100000, 1) ?>L</div>
    <div class="stat-label">Total Revenue</div>
  </div>
</div>

<!-- This Month Summary -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128197; This Month</h3>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;text-align:center;">
    <div>
      <div style="font-size:1.5rem;font-weight:800;color:#667eea;"><?= $monthLeads ?></div>
      <div class="text-sm text-muted">New Leads</div>
    </div>
    <div>
      <div style="font-size:1.5rem;font-weight:800;color:#10b981;"><?= $monthBookings ?></div>
      <div class="text-sm text-muted">Bookings</div>
    </div>
    <div>
      <div style="font-size:1.5rem;font-weight:800;color:#f59e0b;"><?= number_format($monthRevenue / 100000, 1) ?>L</div>
      <div class="text-sm text-muted">Revenue</div>
    </div>
  </div>
</div>

<!-- Lead Status Breakdown -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128203; Lead Pipeline</h3>
    <a href="/admin/leads/list.php" class="btn btn-outline btn-sm">View All</a>
  </div>
  <?php if (empty($leadStatuses)): ?>
    <p class="text-sm text-muted">No leads yet</p>
  <?php else: ?>
  <div style="display:flex;flex-wrap:wrap;gap:10px;">
    <?php foreach ($leadStatuses as $ls): ?>
    <div style="flex:1;min-width:80px;text-align:center;padding:10px;background:#f9fafb;border-radius:8px;">
      <div style="font-size:1.3rem;font-weight:800;"><?= $ls['cnt'] ?></div>
      <span class="badge badge-<?= strtolower($ls['status']) ?>"><?= $ls['status'] ?></span>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</div>

<!-- Top Performers -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#127942; Top Performers</h3>
    <a href="/admin/reports/employees.php" class="btn btn-outline btn-sm">Full Report</a>
  </div>
  <?php if (empty($topPerformers)): ?>
    <p class="text-sm text-muted">No data yet</p>
  <?php else: ?>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Employee</th><th>Leads</th><th>Converted</th><th>Bookings</th><th>Revenue</th></tr></thead>
      <tbody>
        <?php foreach ($topPerformers as $tp): ?>
        <tr>
          <td><strong><?= sanitize($tp['full_name']) ?></strong></td>
          <td><?= $tp['total_leads'] ?></td>
          <td><?= $tp['converted'] ?></td>
          <td><?= $tp['bookings'] ?></td>
          <td><?= number_format($tp['revenue']) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>

<!-- Recent Leads -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128203; Recent Leads</h3>
    <a href="/admin/leads/list.php" class="btn btn-outline btn-sm">All Leads</a>
  </div>
  <?php if (empty($recentLeads)): ?>
    <p class="text-sm text-muted">No leads yet</p>
  <?php else: ?>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Name</th><th>Status</th><th>Source</th><th>Assigned</th><th>Added</th></tr></thead>
      <tbody>
        <?php foreach ($recentLeads as $lead): ?>
        <tr onclick="window.location='/employee/leads/view.php?id=<?= $lead['id'] ?>'" style="cursor:pointer;">
          <td>
            <strong><?= sanitize($lead['name']) ?></strong>
            <div class="text-sm text-muted"><?= sanitize($lead['phone']) ?></div>
          </td>
          <td><span class="badge badge-<?= strtolower($lead['status']) ?>"><?= $lead['status'] ?></span></td>
          <td class="text-sm"><?= sanitize($lead['source']) ?></td>
          <td class="text-sm"><?= sanitize($lead['assigned_name'] ?? 'Unassigned') ?></td>
          <td class="text-sm text-muted"><?= timeAgo($lead['created_at']) ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>

<!-- Recent Activity -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128276; Recent Activity</h3>
  </div>
  <?php if (empty($recentActivity)): ?>
    <p class="text-sm text-muted">No activity yet</p>
  <?php else: ?>
    <?php foreach ($recentActivity as $act): ?>
    <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:0.84rem;">
      <strong><?= sanitize($act['full_name'] ?? 'System') ?></strong>
      <span class="text-muted"> - <?= sanitize($act['action']) ?></span>
      <div class="text-sm text-muted"><?= sanitize($act['details'] ?? '') ?> &middot; <?= timeAgo($act['created_at']) ?></div>
    </div>
    <?php endforeach; ?>
  <?php endif; ?>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
