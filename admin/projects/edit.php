<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Edit Project');

$projectId = (int)($_GET['id'] ?? 0);
if (!$projectId) redirect('/admin/projects/list.php');

$stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
$stmt->execute([$projectId]);
$project = $stmt->fetch();
if (!$project) { flashMessage('error', 'Project not found'); redirect('/admin/projects/list.php'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $type = $_POST['type'] ?? $project['type'];
    $status = $_POST['status'] ?? $project['status'];
    $total_units = (int)($_POST['total_units'] ?? 0);
    $available_units = (int)($_POST['available_units'] ?? 0);
    $price_range = trim($_POST['price_range'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if (empty($name)) {
        flashMessage('error', 'Project name is required');
    } else {
        $stmt = $pdo->prepare("UPDATE projects SET name=?, location=?, type=?, status=?, total_units=?, available_units=?, price_range=?, description=? WHERE id=?");
        $stmt->execute([$name, $location, $type, $status, $total_units, $available_units, $price_range, $description, $projectId]);

        flashMessage('success', 'Project updated');
        redirect('/admin/projects/list.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#9998; Edit Project</h1>
  <a href="/admin/projects/list.php" class="btn btn-outline btn-sm">Back</a>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Project Name *</label>
      <input type="text" name="name" class="form-control" required value="<?= sanitize($project['name']) ?>">
    </div>

    <div class="form-group">
      <label>Location</label>
      <input type="text" name="location" class="form-control" value="<?= sanitize($project['location']) ?>">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select name="type" class="form-control">
          <?php foreach (['Residential','Commercial','Plot'] as $t): ?>
            <option value="<?= $t ?>" <?= $project['type'] === $t ? 'selected' : '' ?>><?= $t ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-control">
          <?php foreach (['Active','Upcoming','Sold Out'] as $s): ?>
            <option value="<?= $s ?>" <?= $project['status'] === $s ? 'selected' : '' ?>><?= $s ?></option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Total Units</label>
        <input type="number" name="total_units" class="form-control" value="<?= $project['total_units'] ?>">
      </div>
      <div class="form-group">
        <label>Available Units</label>
        <input type="number" name="available_units" class="form-control" value="<?= $project['available_units'] ?>">
      </div>
    </div>

    <div class="form-group">
      <label>Price Range</label>
      <input type="text" name="price_range" class="form-control" value="<?= sanitize($project['price_range']) ?>">
    </div>

    <div class="form-group">
      <label>Description</label>
      <textarea name="description" class="form-control" rows="3"><?= sanitize($project['description']) ?></textarea>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#10004; Update Project</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
