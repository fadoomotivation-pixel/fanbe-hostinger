<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Projects');

$projects = $pdo->query("SELECT * FROM projects ORDER BY created_at DESC")->fetchAll();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#127970; Projects (<?= count($projects) ?>)</h1>
  <a href="/admin/projects/add.php" class="btn btn-primary btn-sm">&#10133; Add Project</a>
</div>

<?php if (empty($projects)): ?>
<div class="card">
  <div class="empty-state">
    <div class="empty-icon">&#127970;</div>
    <p>No projects yet. Add your first project.</p>
  </div>
</div>
<?php else: ?>
<div class="card">
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Type</th><th>Status</th><th>Units</th><th>Price Range</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <?php foreach ($projects as $p): ?>
        <tr>
          <td>
            <strong><?= sanitize($p['name']) ?></strong>
            <div class="text-sm text-muted"><?= sanitize($p['location']) ?></div>
          </td>
          <td class="text-sm"><?= sanitize($p['type']) ?></td>
          <td>
            <span class="badge badge-<?= strtolower(str_replace(' ', '-', $p['status'])) ?>">
              <?= $p['status'] ?>
            </span>
          </td>
          <td class="text-sm"><?= $p['available_units'] ?> / <?= $p['total_units'] ?></td>
          <td class="text-sm"><?= sanitize($p['price_range']) ?></td>
          <td>
            <a href="/admin/projects/edit.php?id=<?= $p['id'] ?>" class="btn btn-outline btn-sm">Edit</a>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php endif; ?>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
