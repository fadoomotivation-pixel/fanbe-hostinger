<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin', 'manager', 'sub_admin']);
define('PAGE_TITLE', 'Employee Performance');

$period = $_GET['period'] ?? 'month';

if ($period === 'week') {
    $dateCondition = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $bookingDateCondition = "AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    $followupDateCondition = "AND followup_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
} elseif ($period === 'today') {
    $dateCondition = "AND DATE(created_at) = CURDATE()";
    $bookingDateCondition = "AND booking_date = CURDATE()";
    $followupDateCondition = "AND followup_date = CURDATE()";
} else {
    $dateCondition = "AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
    $bookingDateCondition = "AND MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE())";
    $followupDateCondition = "AND MONTH(followup_date) = MONTH(CURDATE()) AND YEAR(followup_date) = YEAR(CURDATE())";
}

$employees = $pdo->query("
    SELECT u.id, u.full_name, u.role, u.last_login,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) as total_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id $dateCondition) as period_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND status = 'Hot') as hot_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND status = 'Converted') as converted,
           (SELECT COUNT(*) FROM followups WHERE employee_id = u.id AND status = 'Completed' $followupDateCondition) as followups_done,
           (SELECT COUNT(*) FROM followups WHERE employee_id = u.id AND status = 'Missed' $followupDateCondition) as followups_missed,
           (SELECT COUNT(*) FROM site_visits WHERE employee_id = u.id AND status = 'Completed' $dateCondition) as visits_done,
           (SELECT COUNT(*) FROM bookings WHERE employee_id = u.id $bookingDateCondition) as bookings,
           (SELECT COALESCE(SUM(amount),0) FROM bookings WHERE employee_id = u.id $bookingDateCondition) as revenue
    FROM users u
    WHERE u.role IN ('sales_executive', 'telecaller') AND u.status = 'active'
    ORDER BY bookings DESC, converted DESC
")->fetchAll();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128200; Employee Performance</h1>
  <div style="display:flex;gap:6px;">
    <a href="?period=today" class="btn <?= $period === 'today' ? 'btn-primary' : 'btn-outline' ?> btn-sm">Today</a>
    <a href="?period=week" class="btn <?= $period === 'week' ? 'btn-primary' : 'btn-outline' ?> btn-sm">Week</a>
    <a href="?period=month" class="btn <?= $period === 'month' ? 'btn-primary' : 'btn-outline' ?> btn-sm">Month</a>
  </div>
</div>

<?php if (empty($employees)): ?>
<div class="card">
  <div class="empty-state"><p>No employees found</p></div>
</div>
<?php else: ?>

<?php foreach ($employees as $emp): ?>
<div class="card">
  <div class="flex-between" style="margin-bottom:12px;">
    <div>
      <strong style="font-size:1rem;"><?= sanitize($emp['full_name']) ?></strong>
      <div class="text-sm text-muted"><?= str_replace('_', ' ', ucfirst($emp['role'])) ?> &middot; Last login: <?= $emp['last_login'] ? timeAgo($emp['last_login']) : 'Never' ?></div>
    </div>
    <?php if ($emp['bookings'] > 0): ?>
      <span class="badge badge-converted" style="font-size:0.8rem;padding:5px 12px;">&#127942; <?= $emp['bookings'] ?> bookings</span>
    <?php endif; ?>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px;text-align:center;">
    <div style="padding:8px;background:#f9fafb;border-radius:6px;">
      <div style="font-weight:800;font-size:1.1rem;"><?= $emp['total_leads'] ?></div>
      <div class="text-sm text-muted">Total Leads</div>
    </div>
    <div style="padding:8px;background:#fef3c7;border-radius:6px;">
      <div style="font-weight:800;font-size:1.1rem;"><?= $emp['hot_leads'] ?></div>
      <div class="text-sm text-muted">Hot</div>
    </div>
    <div style="padding:8px;background:#d1fae5;border-radius:6px;">
      <div style="font-weight:800;font-size:1.1rem;"><?= $emp['converted'] ?></div>
      <div class="text-sm text-muted">Converted</div>
    </div>
    <div style="padding:8px;background:#dbeafe;border-radius:6px;">
      <div style="font-weight:800;font-size:1.1rem;"><?= $emp['followups_done'] ?></div>
      <div class="text-sm text-muted">Follow-ups</div>
    </div>
    <div style="padding:8px;background:#f3e8ff;border-radius:6px;">
      <div style="font-weight:800;font-size:1.1rem;"><?= $emp['visits_done'] ?></div>
      <div class="text-sm text-muted">Visits</div>
    </div>
    <div style="padding:8px;background:#d1fae5;border-radius:6px;">
      <div style="font-weight:800;font-size:1.1rem;"><?= number_format($emp['revenue'] / 100000, 1) ?>L</div>
      <div class="text-sm text-muted">Revenue</div>
    </div>
  </div>

  <?php if ($emp['followups_missed'] > 0): ?>
  <div style="margin-top:8px;padding:6px 10px;background:#fee2e2;border-radius:6px;font-size:0.8rem;color:#b91c1c;">
    &#9888; <?= $emp['followups_missed'] ?> missed follow-ups
  </div>
  <?php endif; ?>
</div>
<?php endforeach; ?>

<?php endif; ?>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
