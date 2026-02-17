<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'Site Visits');

$uid = getUserId();
$statusFilter = $_GET['status'] ?? '';

$sql = "SELECT sv.*, l.name AS lead_name, l.phone AS lead_phone, p.name AS project_name, p.location AS project_location
        FROM site_visits sv
        JOIN leads l ON sv.lead_id = l.id
        LEFT JOIN projects p ON sv.project_id = p.id
        WHERE sv.employee_id = ?";
$params = [$uid];

if ($statusFilter) {
    $sql .= " AND sv.status = ?";
    $params[] = $statusFilter;
}
$sql .= " ORDER BY sv.visit_date DESC, sv.visit_time ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$visits = $stmt->fetchAll();

// Handle status update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_visit'])) {
    $visitId = (int)$_POST['visit_id'];
    $newStatus = $_POST['visit_status'];
    $feedback = trim($_POST['feedback'] ?? '');
    $pdo->prepare("UPDATE site_visits SET status = ?, feedback = ? WHERE id = ? AND employee_id = ?")
        ->execute([$newStatus, $feedback, $visitId, $uid]);
    flashMessage('success', 'Visit updated');
    redirect('/employee/site-visits/upcoming.php');
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#127968; My Site Visits</h1>
  <a href="/employee/site-visits/schedule.php" class="btn btn-primary btn-sm">&#10133; Schedule</a>
</div>

<div class="filter-bar">
  <form method="GET" style="display:flex;gap:8px;">
    <select name="status" class="form-control" onchange="this.form.submit()" style="width:auto;">
      <option value="">All (<?= count($visits) ?>)</option>
      <option value="Scheduled" <?= $statusFilter === 'Scheduled' ? 'selected' : '' ?>>Scheduled</option>
      <option value="Completed" <?= $statusFilter === 'Completed' ? 'selected' : '' ?>>Completed</option>
      <option value="Cancelled" <?= $statusFilter === 'Cancelled' ? 'selected' : '' ?>>Cancelled</option>
    </select>
  </form>
</div>

<?php if (empty($visits)): ?>
<div class="card">
  <div class="empty-state">
    <div class="empty-icon">&#127968;</div>
    <p>No site visits found</p>
  </div>
</div>
<?php else: ?>

<?php foreach ($visits as $v): ?>
<div class="card">
  <div class="flex-between">
    <div>
      <strong><?= sanitize($v['lead_name']) ?></strong>
      <div class="text-sm text-muted"><?= sanitize($v['lead_phone']) ?></div>
    </div>
    <span class="badge badge-<?= strtolower($v['status']) ?>"><?= $v['status'] ?></span>
  </div>
  <div style="display:flex;gap:12px;margin-top:8px;font-size:0.78rem;color:#6b7280;">
    <span>&#128197; <?= formatDate($v['visit_date']) ?></span>
    <span>&#128336; <?= $v['visit_time'] ? date('h:i A', strtotime($v['visit_time'])) : 'TBD' ?></span>
    <span>&#127970; <?= sanitize($v['project_name'] ?? 'N/A') ?></span>
  </div>
  <?php if ($v['feedback']): ?>
    <div class="text-sm" style="margin-top:6px;color:#4b5563;"><strong>Feedback:</strong> <?= sanitize($v['feedback']) ?></div>
  <?php endif; ?>
  <?php if ($v['status'] === 'Scheduled'): ?>
  <form method="POST" style="margin-top:10px;">
    <input type="hidden" name="visit_id" value="<?= $v['id'] ?>">
    <div class="form-group" style="margin-bottom:8px;">
      <textarea name="feedback" class="form-control" rows="2" placeholder="Visit feedback..."></textarea>
    </div>
    <div style="display:flex;gap:6px;">
      <button type="submit" name="update_visit" class="btn btn-success btn-sm" onclick="this.form.visit_status.value='Completed'">&#10004; Complete</button>
      <button type="submit" name="update_visit" class="btn btn-danger btn-sm" onclick="this.form.visit_status.value='Cancelled'">&#10006; Cancel</button>
      <input type="hidden" name="visit_status" value="Completed">
      <a href="tel:<?= sanitize($v['lead_phone']) ?>" class="btn btn-outline btn-sm">&#128222; Call</a>
    </div>
  </form>
  <?php endif; ?>
</div>
<?php endforeach; ?>

<?php endif; ?>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
