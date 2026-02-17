<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Manage Users');

$roleFilter = $_GET['role'] ?? '';
$search = trim($_GET['q'] ?? '');

$sql = "SELECT * FROM users WHERE 1=1";
$params = [];

if ($roleFilter) {
    $sql .= " AND role = ?";
    $params[] = $roleFilter;
}
if ($search) {
    $sql .= " AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
$sql .= " ORDER BY created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$users = $stmt->fetchAll();

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#128101; Users (<?= count($users) ?>)</h1>
  <a href="/admin/users/add.php" class="btn btn-primary btn-sm">&#10133; Add User</a>
</div>

<div class="filter-bar">
  <form method="GET" style="display:flex;gap:8px;flex-wrap:wrap;width:100%;">
    <input type="text" name="q" class="form-control" placeholder="Search..." value="<?= sanitize($search) ?>" style="flex:1;min-width:150px;">
    <select name="role" class="form-control" onchange="this.form.submit()" style="width:auto;">
      <option value="">All Roles</option>
      <option value="super_admin" <?= $roleFilter === 'super_admin' ? 'selected' : '' ?>>Admin</option>
      <option value="sub_admin" <?= $roleFilter === 'sub_admin' ? 'selected' : '' ?>>Sub Admin</option>
      <option value="manager" <?= $roleFilter === 'manager' ? 'selected' : '' ?>>Manager</option>
      <option value="sales_executive" <?= $roleFilter === 'sales_executive' ? 'selected' : '' ?>>Sales Executive</option>
      <option value="telecaller" <?= $roleFilter === 'telecaller' ? 'selected' : '' ?>>Telecaller</option>
    </select>
    <button type="submit" class="btn btn-outline btn-sm">Search</button>
  </form>
</div>

<div class="card">
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
      </thead>
      <tbody>
        <?php if (empty($users)): ?>
          <tr><td colspan="5" class="text-center text-muted">No users found</td></tr>
        <?php endif; ?>
        <?php foreach ($users as $u): ?>
        <tr>
          <td>
            <strong><?= sanitize($u['full_name']) ?></strong>
            <div class="text-sm text-muted"><?= sanitize($u['email']) ?></div>
          </td>
          <td><span class="badge badge-active"><?= str_replace('_', ' ', ucfirst($u['role'])) ?></span></td>
          <td>
            <span class="badge badge-<?= $u['status'] === 'active' ? 'active' : 'lost' ?>">
              <?= ucfirst($u['status']) ?>
            </span>
          </td>
          <td class="text-sm text-muted"><?= $u['last_login'] ? timeAgo($u['last_login']) : 'Never' ?></td>
          <td>
            <a href="/admin/users/edit.php?id=<?= $u['id'] ?>" class="btn btn-outline btn-sm">Edit</a>
            <?php if ($u['id'] != getUserId()): ?>
              <a href="/admin/users/delete.php?id=<?= $u['id'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('Suspend this user?')">Suspend</a>
            <?php endif; ?>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
