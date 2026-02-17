<?php
require_once __DIR__ . '/../admin/config.php';
requireRole(['manager', 'sub_admin']);
define('PAGE_TITLE', 'My Team');

$team = $pdo->query("
    SELECT u.*,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) as total_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND status = 'Hot') as hot_leads,
           (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id AND status = 'Converted') as converted,
           (SELECT COUNT(*) FROM bookings WHERE employee_id = u.id AND MONTH(booking_date) = MONTH(CURDATE())) as month_bookings,
           (SELECT COALESCE(SUM(amount),0) FROM bookings WHERE employee_id = u.id AND MONTH(booking_date) = MONTH(CURDATE())) as month_revenue
    FROM users u
    WHERE u.role IN ('sales_executive', 'telecaller') AND u.status = 'active'
    ORDER BY month_bookings DESC, converted DESC
")->fetchAll();

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
  <h1>&#128101; My Team (<?= count($team) ?>)</h1>
</div>

<?php foreach ($team as $emp): ?>
<div class="card">
  <div class="flex-between" style="margin-bottom:10px;">
    <div>
      <strong style="font-size:1rem;"><?= sanitize($emp['full_name']) ?></strong>
      <div class="text-sm text-muted">
        <?= str_replace('_', ' ', ucfirst($emp['role'])) ?>
        &middot; <?= sanitize($emp['email']) ?>
        &middot; Last: <?= $emp['last_login'] ? timeAgo($emp['last_login']) : 'Never' ?>
      </div>
    </div>
    <span class="badge badge-<?= $emp['status'] === 'active' ? 'active' : 'lost' ?>"><?= ucfirst($emp['status']) ?></span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px;text-align:center;">
    <div style="padding:8px;background:#f3f0ff;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['total_leads'] ?></div>
      <div class="text-sm text-muted">Leads</div>
    </div>
    <div style="padding:8px;background:#fee2e2;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['hot_leads'] ?></div>
      <div class="text-sm text-muted">Hot</div>
    </div>
    <div style="padding:8px;background:#d1fae5;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['converted'] ?></div>
      <div class="text-sm text-muted">Converted</div>
    </div>
    <div style="padding:8px;background:#dbeafe;border-radius:6px;">
      <div style="font-weight:800;"><?= $emp['month_bookings'] ?></div>
      <div class="text-sm text-muted">Bookings</div>
    </div>
    <div style="padding:8px;background:#fef3c7;border-radius:6px;">
      <div style="font-weight:800;"><?= number_format($emp['month_revenue'] / 100000, 1) ?>L</div>
      <div class="text-sm text-muted">Revenue</div>
    </div>
  </div>
</div>
<?php endforeach; ?>

<?php include __DIR__ . '/../includes/footer.php'; ?>
