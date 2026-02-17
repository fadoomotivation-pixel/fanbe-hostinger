<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'My Leads');

$uid = getUserId();
$statusFilter = $_GET['status'] ?? '';
$search = trim($_GET['q'] ?? '');

$sql = "SELECT l.*, p.name AS project_name FROM leads l LEFT JOIN projects p ON l.project_interest = p.id WHERE l.assigned_to = ?";
$params = [$uid];

if ($statusFilter) {
    $sql .= " AND l.status = ?";
    $params[] = $statusFilter;
}
if ($search) {
    $sql .= " AND (l.name LIKE ? OR l.phone LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
$sql .= " ORDER BY l.updated_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$leads = $stmt->fetchAll();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128203; My Leads (<?= count($leads) ?>)</h1>
  <a href="/employee/leads/add.php" class="btn btn-primary btn-sm">&#10133; Add Lead</a>
</div>

<!-- Filters -->
<div class="filter-bar">
  <form method="GET" style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
    <input type="text" name="q" class="form-control" placeholder="Search name/phone..." value="<?= sanitize($search) ?>" style="flex:1;min-width:150px;">
    <select name="status" class="form-control" onchange="this.form.submit()" style="width:auto;">
      <option value="">All Status</option>
      <?php foreach (['New','Hot','Warm','Cold','Converted','Lost'] as $s): ?>
        <option value="<?= $s ?>" <?= $statusFilter === $s ? 'selected' : '' ?>><?= $s ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit" class="btn btn-outline btn-sm">Search</button>
  </form>
</div>

<?php if (empty($leads)): ?>
<div class="card">
  <div class="empty-state">
    <div class="empty-icon">&#128203;</div>
    <p>No leads found</p>
  </div>
</div>
<?php else: ?>

<!-- Mobile card view -->
<?php foreach ($leads as $lead): ?>
<div class="card" onclick="window.location='/employee/leads/view.php?id=<?= $lead['id'] ?>'" style="cursor:pointer;">
  <div class="flex-between">
    <div>
      <strong style="font-size:0.95rem;"><?= sanitize($lead['name']) ?></strong>
      <div class="text-sm text-muted"><?= sanitize($lead['phone']) ?></div>
    </div>
    <span class="badge badge-<?= strtolower($lead['status']) ?>"><?= $lead['status'] ?></span>
  </div>
  <div style="display:flex;gap:12px;margin-top:8px;font-size:0.78rem;color:#6b7280;">
    <span>&#127970; <?= sanitize($lead['project_name'] ?? 'N/A') ?></span>
    <span>&#128337; <?= timeAgo($lead['updated_at']) ?></span>
    <span>&#128232; <?= sanitize($lead['source']) ?></span>
  </div>
  <div style="display:flex;gap:6px;margin-top:10px;">
    <a href="tel:<?= sanitize($lead['phone']) ?>" class="btn btn-success btn-sm" onclick="event.stopPropagation()">&#128222; Call</a>
    <a href="/employee/followup/add.php?lead_id=<?= $lead['id'] ?>" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">&#128221; Follow-up</a>
    <a href="/employee/site-visits/schedule.php?lead_id=<?= $lead['id'] ?>" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">&#127968; Visit</a>
  </div>
</div>
<?php endforeach; ?>

<?php endif; ?>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
