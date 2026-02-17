<?php
require_once __DIR__ . '/../admin/config.php';
requireRole(['manager', 'sub_admin']);
define('PAGE_TITLE', 'Manager Dashboard');

$uid = getUserId();

// Team members (employees)
$team = $pdo->query("SELECT * FROM users WHERE role IN ('sales_executive', 'telecaller') AND status = 'active' ORDER BY full_name")->fetchAll();
$teamIds = array_column($team, 'id');
$teamIdPlaceholders = !empty($teamIds) ? implode(',', array_fill(0, count($teamIds), '?')) : '0';

// Team lead stats
$teamLeads = !empty($teamIds)
    ? $pdo->prepare("SELECT COUNT(*) FROM leads WHERE assigned_to IN ($teamIdPlaceholders)")
    : null;
if ($teamLeads) { $teamLeads->execute($teamIds); $totalTeamLeads = $teamLeads->fetchColumn(); }
else { $totalTeamLeads = 0; }

$teamHotLeads = !empty($teamIds)
    ? $pdo->prepare("SELECT COUNT(*) FROM leads WHERE assigned_to IN ($teamIdPlaceholders) AND status = 'Hot'")
    : null;
if ($teamHotLeads) { $teamHotLeads->execute($teamIds); $hotCount = $teamHotLeads->fetchColumn(); }
else { $hotCount = 0; }

// Unassigned leads
$unassigned = $pdo->query("SELECT COUNT(*) FROM leads WHERE assigned_to IS NULL")->fetchColumn();

// Team bookings this month
$teamBookingsStmt = !empty($teamIds)
    ? $pdo->prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(amount),0) as total FROM bookings WHERE employee_id IN ($teamIdPlaceholders) AND MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE())")
    : null;
if ($teamBookingsStmt) { $teamBookingsStmt->execute($teamIds); $teamBookings = $teamBookingsStmt->fetch(); }
else { $teamBookings = ['cnt' => 0, 'total' => 0]; }

// Today's pending follow-ups across team
$todayPending = !empty($teamIds)
    ? $pdo->prepare("SELECT COUNT(*) FROM followups WHERE employee_id IN ($teamIdPlaceholders) AND followup_date = CURDATE() AND status = 'Pending'")
    : null;
if ($todayPending) { $todayPending->execute($teamIds); $pendingCount = $todayPending->fetchColumn(); }
else { $pendingCount = 0; }

// Per-employee summary
$empSummary = [];
foreach ($team as $emp) {
    $s = $pdo->prepare("SELECT
        (SELECT COUNT(*) FROM leads WHERE assigned_to = ?) as leads,
        (SELECT COUNT(*) FROM leads WHERE assigned_to = ? AND status = 'Hot') as hot,
        (SELECT COUNT(*) FROM followups WHERE employee_id = ? AND followup_date = CURDATE() AND status = 'Pending') as pending_today,
        (SELECT COUNT(*) FROM bookings WHERE employee_id = ? AND MONTH(booking_date) = MONTH(CURDATE())) as bookings_month
    ");
    $s->execute([$emp['id'], $emp['id'], $emp['id'], $emp['id']]);
    $empSummary[$emp['id']] = $s->fetch();
}

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
  <h1>&#128202; Team Dashboard</h1>
  <span class="text-sm text-muted"><?= date('l, d M Y') ?></span>
</div>

<!-- Stats -->
<div class="stats-grid">
  <div class="stat-card purple">
    <div class="stat-icon">&#128101;</div>
    <div class="stat-value"><?= count($team) ?></div>
    <div class="stat-label">Team Members</div>
  </div>
  <div class="stat-card blue">
    <div class="stat-icon">&#128203;</div>
    <div class="stat-value"><?= $totalTeamLeads ?></div>
    <div class="stat-label">Team Leads</div>
  </div>
  <div class="stat-card red">
    <div class="stat-icon">&#128293;</div>
    <div class="stat-value"><?= $hotCount ?></div>
    <div class="stat-label">Hot Leads</div>
  </div>
  <div class="stat-card orange">
    <div class="stat-icon">&#128222;</div>
    <div class="stat-value"><?= $pendingCount ?></div>
    <div class="stat-label">Pending Today</div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon">&#128176;</div>
    <div class="stat-value"><?= $teamBookings['cnt'] ?></div>
    <div class="stat-label">Bookings (Month)</div>
  </div>
  <div class="stat-card pink">
    <div class="stat-icon">&#9888;</div>
    <div class="stat-value"><?= $unassigned ?></div>
    <div class="stat-label">Unassigned</div>
  </div>
</div>

<!-- Quick Actions -->
<div class="quick-actions" style="grid-template-columns:repeat(3,1fr);">
  <a href="/manager/leads.php" class="quick-action">
    <span class="qa-icon">&#128203;</span> Team Leads
  </a>
  <a href="/manager/team.php" class="quick-action">
    <span class="qa-icon">&#128101;</span> Team
  </a>
  <a href="/manager/reports.php" class="quick-action">
    <span class="qa-icon">&#128200;</span> Reports
  </a>
</div>

<!-- Team Performance -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">&#128101; Team Performance (Today)</h3>
    <a href="/manager/reports.php" class="btn btn-outline btn-sm">Full Report</a>
  </div>
  <?php foreach ($team as $emp): ?>
  <?php $es = $empSummary[$emp['id']] ?? []; ?>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;">
    <div>
      <strong><?= sanitize($emp['full_name']) ?></strong>
      <div class="text-sm text-muted"><?= str_replace('_', ' ', ucfirst($emp['role'])) ?></div>
    </div>
    <div style="display:flex;gap:8px;font-size:0.78rem;">
      <span title="Total leads" style="padding:3px 8px;background:#f3f0ff;border-radius:4px;">&#128203; <?= $es['leads'] ?? 0 ?></span>
      <span title="Hot leads" style="padding:3px 8px;background:#fee2e2;border-radius:4px;">&#128293; <?= $es['hot'] ?? 0 ?></span>
      <span title="Pending today" style="padding:3px 8px;background:#fef3c7;border-radius:4px;">&#128222; <?= $es['pending_today'] ?? 0 ?></span>
      <span title="Bookings" style="padding:3px 8px;background:#d1fae5;border-radius:4px;">&#128176; <?= $es['bookings_month'] ?? 0 ?></span>
    </div>
  </div>
  <?php endforeach; ?>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
