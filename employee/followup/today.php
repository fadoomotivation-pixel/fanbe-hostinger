<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', "Today's Follow-ups");

$uid = getUserId();
$dateFilter = $_GET['date'] ?? date('Y-m-d');
$statusFilter = $_GET['status'] ?? '';

$sql = "SELECT f.*, l.name AS lead_name, l.phone AS lead_phone, l.status AS lead_status
        FROM followups f
        JOIN leads l ON f.lead_id = l.id
        WHERE f.employee_id = ? AND f.followup_date = ?";
$params = [$uid, $dateFilter];

if ($statusFilter) {
    $sql .= " AND f.status = ?";
    $params[] = $statusFilter;
}
$sql .= " ORDER BY f.followup_time ASC, f.status ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$followups = $stmt->fetchAll();

// Count by status
$pending = array_filter($followups, fn($f) => $f['status'] === 'Pending');
$completed = array_filter($followups, fn($f) => $f['status'] === 'Completed');

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128222; Follow-ups</h1>
  <a href="/employee/followup/add.php" class="btn btn-primary btn-sm">&#10133; New</a>
</div>

<!-- Date & Status Filter -->
<div class="filter-bar">
  <form method="GET" style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
    <input type="date" name="date" class="form-control" value="<?= sanitize($dateFilter) ?>" onchange="this.form.submit()" style="width:auto;">
    <select name="status" class="form-control" onchange="this.form.submit()" style="width:auto;">
      <option value="">All (<?= count($followups) ?>)</option>
      <option value="Pending" <?= $statusFilter === 'Pending' ? 'selected' : '' ?>>Pending (<?= count($pending) ?>)</option>
      <option value="Completed" <?= $statusFilter === 'Completed' ? 'selected' : '' ?>>Completed (<?= count($completed) ?>)</option>
      <option value="Missed" <?= $statusFilter === 'Missed' ? 'selected' : '' ?>>Missed</option>
    </select>
  </form>
</div>

<!-- Summary -->
<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
  <div class="stat-card orange">
    <div class="stat-value"><?= count($pending) ?></div>
    <div class="stat-label">Pending</div>
  </div>
  <div class="stat-card green">
    <div class="stat-value"><?= count($completed) ?></div>
    <div class="stat-label">Completed</div>
  </div>
  <div class="stat-card purple">
    <div class="stat-value"><?= count($followups) ?></div>
    <div class="stat-label">Total</div>
  </div>
</div>

<?php if (empty($followups)): ?>
<div class="card">
  <div class="empty-state">
    <div class="empty-icon">&#128222;</div>
    <p>No follow-ups for <?= formatDate($dateFilter) ?></p>
  </div>
</div>
<?php else: ?>

<?php foreach ($followups as $f): ?>
<div class="card">
  <div class="flex-between">
    <div>
      <strong><?= sanitize($f['lead_name']) ?></strong>
      <span class="badge badge-<?= strtolower($f['lead_status']) ?>" style="margin-left:6px;"><?= $f['lead_status'] ?></span>
      <div class="text-sm text-muted">
        <?= sanitize($f['lead_phone']) ?>
        <?php if ($f['followup_time']): ?>
          &middot; <?= date('h:i A', strtotime($f['followup_time'])) ?>
        <?php endif; ?>
        &middot; <?= sanitize($f['type'] ?? 'Call') ?>
      </div>
    </div>
    <span class="badge badge-<?= strtolower($f['status']) ?>"><?= $f['status'] ?></span>
  </div>
  <?php if ($f['notes']): ?>
    <div class="text-sm" style="margin-top:6px;color:#4b5563;"><?= sanitize($f['notes']) ?></div>
  <?php endif; ?>
  <?php if ($f['status'] === 'Pending'): ?>
  <div style="display:flex;gap:6px;margin-top:10px;">
    <a href="tel:<?= sanitize($f['lead_phone']) ?>" class="btn btn-success btn-sm">&#128222; Call Now</a>
    <a href="/employee/followup/add.php?lead_id=<?= $f['lead_id'] ?>&followup_id=<?= $f['id'] ?>" class="btn btn-primary btn-sm">&#10004; Mark Done</a>
    <a href="/employee/leads/view.php?id=<?= $f['lead_id'] ?>" class="btn btn-outline btn-sm">View Lead</a>
  </div>
  <?php endif; ?>
</div>
<?php endforeach; ?>

<?php endif; ?>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
