<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Edit User');

$userId = (int)($_GET['id'] ?? 0);
if (!$userId) redirect('/admin/users/list.php');

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();
if (!$user) { flashMessage('error', 'User not found'); redirect('/admin/users/list.php'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $role = $_POST['role'] ?? $user['role'];
    $status = $_POST['status'] ?? $user['status'];
    $password = $_POST['password'] ?? '';

    if (empty($full_name)) {
        flashMessage('error', 'Name is required');
    } else {
        // Check email uniqueness
        if ($email) {
            $check = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $check->execute([$email, $userId]);
            if ($check->fetch()) {
                flashMessage('error', 'Email already in use');
                redirect("/admin/users/edit.php?id=$userId");
            }
        }

        $sql = "UPDATE users SET full_name = ?, email = ?, phone = ?, role = ?, status = ?";
        $params = [$full_name, $email, $phone, $role, $status];

        if ($password) {
            $sql .= ", password_hash = ?";
            $params[] = password_hash($password, PASSWORD_DEFAULT);
        }

        $sql .= " WHERE id = ?";
        $params[] = $userId;

        $pdo->prepare($sql)->execute($params);

        $pdo->prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_updated', ?)")
            ->execute([getUserId(), "Updated user: {$user['username']}"]);

        flashMessage('success', 'User updated');
        redirect('/admin/users/list.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#9998; Edit User</h1>
  <a href="/admin/users/list.php" class="btn btn-outline btn-sm">Back</a>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Full Name *</label>
      <input type="text" name="full_name" class="form-control" required
             value="<?= sanitize($user['full_name']) ?>">
    </div>

    <div class="form-group">
      <label>Username (cannot change)</label>
      <input type="text" class="form-control" value="<?= sanitize($user['username']) ?>" disabled>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Role</label>
        <select name="role" class="form-control">
          <?php foreach (['super_admin','sub_admin','manager','sales_executive','telecaller'] as $r): ?>
            <option value="<?= $r ?>" <?= $user['role'] === $r ? 'selected' : '' ?>><?= str_replace('_', ' ', ucfirst($r)) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status" class="form-control">
          <option value="active" <?= $user['status'] === 'active' ? 'selected' : '' ?>>Active</option>
          <option value="suspended" <?= $user['status'] === 'suspended' ? 'selected' : '' ?>>Suspended</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" class="form-control" value="<?= sanitize($user['email']) ?>">
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="tel" name="phone" class="form-control" value="<?= sanitize($user['phone'] ?? '') ?>">
      </div>
    </div>

    <div class="form-group">
      <label>New Password (leave blank to keep current)</label>
      <input type="password" name="password" class="form-control" placeholder="Enter new password">
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#10004; Update User</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
