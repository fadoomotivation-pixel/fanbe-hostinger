<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Add Project');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $type = $_POST['type'] ?? 'Residential';
    $status = $_POST['status'] ?? 'Active';
    $total_units = (int)($_POST['total_units'] ?? 0);
    $available_units = (int)($_POST['available_units'] ?? 0);
    $price_range = trim($_POST['price_range'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if (empty($name)) {
        flashMessage('error', 'Project name is required');
    } else {
        $stmt = $pdo->prepare("INSERT INTO projects (name, location, type, status, total_units, available_units, price_range, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $location, $type, $status, $total_units, $available_units, $price_range, $description]);

        flashMessage('success', 'Project added');
        redirect('/admin/projects/list.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#10133; Add Project</h1>
  <a href="/admin/projects/list.php" class="btn btn-outline btn-sm">Back</a>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Project Name *</label>
      <input type="text" name="name" class="form-control" placeholder="Project name" required
             value="<?= sanitize($_POST['name'] ?? '') ?>">
    </div>

    <div class="form-group">
      <label>Location</label>
      <input type="text" name="location" class="form-control" placeholder="Location/Address"
             value="<?= sanitize($_POST['location'] ?? '') ?>">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select name="type" class="form-control">
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
          <option value="Plot">Plot</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-control">
          <option value="Active">Active</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Sold Out">Sold Out</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Total Units</label>
        <input type="number" name="total_units" class="form-control" placeholder="0"
               value="<?= sanitize($_POST['total_units'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Available Units</label>
        <input type="number" name="available_units" class="form-control" placeholder="0"
               value="<?= sanitize($_POST['available_units'] ?? '') ?>">
      </div>
    </div>

    <div class="form-group">
      <label>Price Range</label>
      <input type="text" name="price_range" class="form-control" placeholder="e.g. 85L - 1.5Cr"
             value="<?= sanitize($_POST['price_range'] ?? '') ?>">
    </div>

    <div class="form-group">
      <label>Description</label>
      <textarea name="description" class="form-control" rows="3" placeholder="Project description..."><?= sanitize($_POST['description'] ?? '') ?></textarea>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#10133; Add Project</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
