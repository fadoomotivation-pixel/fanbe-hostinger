<?php
require_once __DIR__ . '/../admin/config.php';
requireRole(['manager', 'sub_admin']);
define('PAGE_TITLE', 'Team Reports');

$period = $_GET['period'] ?? 'month';

if ($period === 'week') {
    $followupCond = "AND followup_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $bookingCond = "AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $visitCond = "AND visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
} elseif ($period === 'today') {
    $followupCond = "AND followup_date = CURDATE()";
    $bookingCond = "AND booking_date = CURDATE()";
    $visitCond = "AND visit_date = CURDATE()";
} else {
    $followupCond = "AND MONTH(followup_date) = MONTH(CURDATE()) AND YEAR(followup_date) = YEAR(CURDATE())";
    $bookingCond = "AND MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE())";
    $visitCond = "AND MONTH(visit_date) = MONTH(CURDATE()) AND YEAR(visit_date) = YEAR(CURDATE())";
}

$employees = $pdo->query("
    SELECT u.id, u.full_name, u.role, u.last_login,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) as total_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND status = 'Hot') as hot_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND status = 'Converted') as converted,
           (SELECT COUNT(*) FROM followups WHERE employee_id = u.id AND status = 'Completed' $followupCond) as followups_done,
           (SELECT COUNT(*) FROM followups WHERE employee_id = u.id AND status = 'Missed' $followupCond) as followups_missed,
           (SELECT COUNT(*) FROM site_visits WHERE employee_id = u.id AND status = 'Completed' $visitCond) as visits_done,
           (SELECT COUNT(*) FROM bookings WHERE employee_id = u.id $bookingCond) as bookings,
           (SELECT COALESCE(SUM(amount),0) FROM bookings WHERE employee_id = u.id $bookingCond) as revenue
    FROM users u
    WHERE u.role IN ('sales_executive', 'telecaller') AND u.status = 'active'
    ORDER BY bookings DESC, converted DESC
")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
  <h1>&#128200; Team Reports</h1>
  <div style="display:flex;gap:6px;">
    <a href="?period=today" class="btn <?= $period === 'today' ? 'btn-primary' : 'btn-outline' ?> btn-sm">Today</a>
    <a href="?period=week" class="btn <?= $period === 'week' ? 'btn-primary' : 'btn-outline' ?> btn-sm">Week</a>
    <a href="?period=month" class="btn <?= $period === 'month' ? 'btn-primary' : 'btn-outline' ?> btn-sm">Month</a>
  </div>
</div>

<!-- Team Totals -->
<?php
$totLeads = array_sum(array_column($employees, 'total_leads'));
$totHot = array_sum(array_column($employees, 'hot_leads'));
$totConverted = array_sum(array_column($employees, 'converted'));
$totBookings = array_sum(array_column($employees, 'bookings'));
$totRevenue = array_sum(array_column($employees, 'revenue'));
?>
<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(100px,1fr));">
  <div class="stat-card purple">
    <div class="stat-value"><?= $totLeads ?></div>
    <div class="stat-label">Leads</div>
  </div>
  <div class="stat-card red">
    <div class="stat-value"><?= $totHot ?></div>
    <div class="stat-label">Hot</div>
  </div>
  <div class="stat-card green">
    <div class="stat-value"><?= $totConverted ?></div>
    <div class="stat-label">Converted</div>
  </div>
  <div class="stat-card blue">
    <div class="stat-value"><?= $totBookings ?></div>
    <div class="stat-label">Bookings</div>
  </div>
  <div class="stat-card orange">
    <div class="stat-value"><?= number_format($totRevenue / 100000, 1) ?>L</div>
    <div class="stat-label">Revenue</div>
  </div>
</div>

<!-- Per Employee -->
<?php foreach ($employees as $emp): ?>
<div class="card">
  <div class="flex-between" style="margin-bottom:10px;">
    <div>
      <strong><?= sanitize($emp['full_name']) ?></strong>
      <div class="text-sm text-muted"><?= str_replace('_', ' ', ucfirst($emp['role'])) ?></div>
    </div>
    <?php if ($emp['bookings'] > 0): ?>
      <span class="badge badge-converted">&#127942; <?= $emp['bookings'] ?> bookings</span>
    <?php endif; ?>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:6px;text-align:center;">
    <div style="padding:6px;background:#f9fafb;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['total_leads'] ?></div>
      <div style="font-size:0.65rem;color:#9ca3af;">Leads</div>
    </div>
    <div style="padding:6px;background:#fee2e2;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['hot_leads'] ?></div>
      <div style="font-size:0.65rem;color:#9ca3af;">Hot</div>
    </div>
    <div style="padding:6px;background:#d1fae5;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['converted'] ?></div>
      <div style="font-size:0.65rem;color:#9ca3af;">Converted</div>
    </div>
    <div style="padding:6px;background:#dbeafe;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['followups_done'] ?></div>
      <div style="font-size:0.65rem;color:#9ca3af;">Follow-ups</div>
    </div>
    <div style="padding:6px;background:#f3e8ff;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['visits_done'] ?></div>
      <div style="font-size:0.65rem;color:#9ca3af;">Visits</div>
    </div>
    <div style="padding:6px;background:#fef3c7;border-radius:6px;">
      <div style="font-weight:800;"><?= number_format($emp['revenue'] / 100000, 1) ?>L</div>
      <div style="font-size:0.65rem;color:#9ca3af;">Revenue</div>
    </div>
  </div>
  <?php if ($emp['followups_missed'] > 0): ?>
  <div style="margin-top:6px;padding:4px 8px;background:#fee2e2;border-radius:4px;font-size:0.75rem;color:#b91c1c;">
    &#9888; <?= $emp['followups_missed'] ?> missed follow-ups
  </div>
  <?php endif; ?>
</div>
<?php endforeach; ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
