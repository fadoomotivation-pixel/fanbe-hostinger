<?php
require_once __DIR__ . '/../admin/config.php';
requireRole(['manager', 'sub_admin']);
define('PAGE_TITLE', 'Team Leads');

$statusFilter = $_GET['status'] ?? '';
$assignedFilter = $_GET['assigned'] ?? '';
$search = trim($_GET['q'] ?? '');

// Get team members
$employees = $pdo->query("SELECT id, full_name FROM users WHERE role IN ('sales_executive','telecaller') AND status = 'active' ORDER BY full_name")->fetchAll();

$sql = "SELECT l.*, u.full_name AS assigned_name, p.name AS project_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_to = u.id
        LEFT JOIN projects p ON l.project_interest = p.id
        WHERE 1=1";
$params = [];

if ($statusFilter) { $sql .= " AND l.status = ?"; $params[] = $statusFilter; }
if ($assignedFilter === 'unassigned') { $sql .= " AND l.assigned_to IS NULL"; }
elseif ($assignedFilter) { $sql .= " AND l.assigned_to = ?"; $params[] = $assignedFilter; }
if ($search) {
    $sql .= " AND (l.name LIKE ? OR l.phone LIKE ?)";
    $params[] = "%$search%"; $params[] = "%$search%";
}
$sql .= " ORDER BY l.updated_at DESC LIMIT 100";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$leads = $stmt->fetchAll();

// Handle assignment
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['assign'])) {
    $leadId = (int)$_POST['lead_id'];
    $empId = (int)$_POST['employee_id'];
    $pdo->prepare("UPDATE leads SET assigned_to = ?, updated_at = NOW() WHERE id = ?")->execute([$empId ?: null, $leadId]);
    flashMessage('success', 'Lead assigned');
    redirect('/manager/leads.php?' . http_build_query($_GET));
}

include __DIR__ . '/../includes/header.php';
?>

<div class="page-header">
  <h1>&#128203; Team Leads (<?= count($leads) ?>)</h1>
</div>

<div class="filter-bar">
  <form method="GET" style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
    <input type="text" name="q" class="form-control" placeholder="Search..." value="<?= sanitize($search) ?>" style="flex:1;min-width:120px;">
    <select name="status" class="form-control" onchange="this.form.submit()" style="width:auto;">
      <option value="">All Status</option>
      <?php foreach (['New','Hot','Warm','Cold','Converted','Lost'] as $s): ?>
        <option value="<?= $s ?>" <?= $statusFilter === $s ? 'selected' : '' ?>><?= $s ?></option>
      <?php endforeach; ?>
    </select>
    <select name="assigned" class="form-control" onchange="this.form.submit()" style="width:auto;">
      <option value="">All Team</option>
      <option value="unassigned" <?= $assignedFilter === 'unassigned' ? 'selected' : '' ?>>Unassigned</option>
      <?php foreach ($employees as $e): ?>
        <option value="<?= $e['id'] ?>" <?= $assignedFilter == $e['id'] ? 'selected' : '' ?>><?= sanitize($e['full_name']) ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit" class="btn btn-outline btn-sm">Filter</button>
  </form>
</div>

<div class="card">
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Lead</th><th>Status</th><th>Project</th><th>Assigned To</th><th>Updated</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <?php if (empty($leads)): ?>
          <tr><td colspan="6" class="text-center text-muted">No leads found</td></tr>
        <?php endif; ?>
        <?php foreach ($leads as $lead): ?>
        <tr>
          <td>
            <strong><?= sanitize($lead['name']) ?></strong>
            <div class="text-sm text-muted"><?= sanitize($lead['phone']) ?> &middot; <?= sanitize($lead['source']) ?></div>
          </td>
          <td><span class="badge badge-<?= strtolower($lead['status']) ?>"><?= $lead['status'] ?></span></td>
          <td class="text-sm"><?= sanitize($lead['project_name'] ?? '-') ?></td>
          <td>
            <form method="POST" style="display:flex;gap:4px;">
              <input type="hidden" name="lead_id" value="<?= $lead['id'] ?>">
              <select name="employee_id" class="form-control" style="width:auto;padding:4px;font-size:0.75rem;">
                <option value="">Unassigned</option>
                <?php foreach ($employees as $e): ?>
                  <option value="<?= $e['id'] ?>" <?= $lead['assigned_to'] == $e['id'] ? 'selected' : '' ?>><?= sanitize($e['full_name']) ?></option>
                <?php endforeach; ?>
              </select>
              <button type="submit" name="assign" class="btn btn-primary btn-sm" style="padding:4px 8px;font-size:0.7rem;">Set</button>
            </form>
          </td>
          <td class="text-sm text-muted"><?= timeAgo($lead['updated_at']) ?></td>
          <td><a href="/employee/leads/view.php?id=<?= $lead['id'] ?>" class="btn btn-outline btn-sm">View</a></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
