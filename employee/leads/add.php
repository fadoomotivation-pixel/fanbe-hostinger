<?php
require_once __DIR__ . '/../../admin/config.php';
requireRole(['sales_executive', 'telecaller']);
define('PAGE_TITLE', 'Add Lead');

$uid = getUserId();

// Get projects for dropdown
$projects = $pdo->query("SELECT id, name FROM projects WHERE status != 'Sold Out' ORDER BY name")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $source = $_POST['source'] ?? 'Walk-in';
    $project_interest = $_POST['project_interest'] ?: null;
    $notes = trim($_POST['notes'] ?? '');
    $status = $_POST['status'] ?? 'New';

    if (empty($name) || empty($phone)) {
        flashMessage('error', 'Name and phone are required');
    } else {
        $stmt = $pdo->prepare("INSERT INTO leads (name, phone, email, source, project_interest, status, assigned_to, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $phone, $email, $source, $project_interest, $status, $uid, $notes, $uid]);

        flashMessage('success', 'Lead added successfully!');
        redirect('/employee/leads/my-leads.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#10133; Add New Lead</h1>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Name *</label>
      <input type="text" name="name" class="form-control" placeholder="Client name" required
             value="<?= sanitize($_POST['name'] ?? '') ?>">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Phone *</label>
        <input type="tel" name="phone" class="form-control" placeholder="Mobile number" required
               value="<?= sanitize($_POST['phone'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" class="form-control" placeholder="Email (optional)"
               value="<?= sanitize($_POST['email'] ?? '') ?>">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Source</label>
        <select name="source" class="form-control">
          <?php foreach (['Walk-in','Call','Reference','Website','Social Media','MagicBricks','Google Ads'] as $s): ?>
            <option value="<?= $s ?>" <?= ($_POST['source'] ?? '') === $s ? 'selected' : '' ?>><?= $s ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-control">
          <?php foreach (['New','Hot','Warm','Cold'] as $s): ?>
            <option value="<?= $s ?>" <?= ($_POST['status'] ?? 'New') === $s ? 'selected' : '' ?>><?= $s ?></option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Interested Project</label>
      <select name="project_interest" class="form-control">
        <option value="">-- Select Project --</option>
        <?php foreach ($projects as $p): ?>
          <option value="<?= $p['id'] ?>" <?= ($_POST['project_interest'] ?? '') == $p['id'] ? 'selected' : '' ?>><?= sanitize($p['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="form-group">
      <label>Notes</label>
      <textarea name="notes" class="form-control" rows="3" placeholder="Quick notes about the lead..."><?= sanitize($_POST['notes'] ?? '') ?></textarea>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#10133; Save Lead</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
