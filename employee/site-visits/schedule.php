<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'Schedule Site Visit');

$uid = getUserId();
$leadId = (int)($_GET['lead_id'] ?? 0);

// Get employee's leads
$myLeads = $pdo->prepare("SELECT id, name, phone FROM leads WHERE assigned_to = ? AND status NOT IN ('Converted','Lost') ORDER BY name");
$myLeads->execute([$uid]);
$leads = $myLeads->fetchAll();

// Get active projects
$projects = $pdo->query("SELECT id, name, location FROM projects WHERE status = 'Active' ORDER BY name")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $lead_id = (int)$_POST['lead_id'];
    $project_id = (int)($_POST['project_id'] ?? 0) ?: null;
    $visit_date = $_POST['visit_date'] ?? '';
    $visit_time = $_POST['visit_time'] ?: null;

    if (!$lead_id || !$visit_date) {
        flashMessage('error', 'Lead and date are required');
    } else {
        $stmt = $pdo->prepare("INSERT INTO site_visits (lead_id, project_id, visit_date, visit_time, employee_id, status) VALUES (?, ?, ?, ?, ?, 'Scheduled')");
        $stmt->execute([$lead_id, $project_id, $visit_date, $visit_time, $uid]);

        $pdo->prepare("UPDATE leads SET updated_at = NOW() WHERE id = ?")->execute([$lead_id]);

        flashMessage('success', 'Site visit scheduled!');
        redirect('/employee/site-visits/upcoming.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#127968; Schedule Site Visit</h1>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Lead *</label>
      <select name="lead_id" class="form-control" required>
        <option value="">-- Select Lead --</option>
        <?php foreach ($leads as $l): ?>
          <option value="<?= $l['id'] ?>" <?= $leadId == $l['id'] ? 'selected' : '' ?>>
            <?= sanitize($l['name']) ?> (<?= sanitize($l['phone']) ?>)
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="form-group">
      <label>Project</label>
      <select name="project_id" class="form-control">
        <option value="">-- Select Project --</option>
        <?php foreach ($projects as $p): ?>
          <option value="<?= $p['id'] ?>"><?= sanitize($p['name']) ?> - <?= sanitize($p['location']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Visit Date *</label>
        <input type="date" name="visit_date" class="form-control" value="<?= date('Y-m-d', strtotime('+1 day')) ?>" required>
      </div>
      <div class="form-group">
        <label>Visit Time</label>
        <input type="time" name="visit_time" class="form-control" value="11:00">
      </div>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#128197; Schedule Visit</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
