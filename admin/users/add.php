<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);
define('PAGE_TITLE', 'Add User');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = trim($_POST['full_name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'sales_executive';

    if (empty($full_name) || empty($username) || empty($password)) {
        flashMessage('error', 'Name, username, and password are required');
    } else {
        // Check username uniqueness
        $check = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $check->execute([$username, $email]);
        if ($check->fetch()) {
            flashMessage('error', 'Username or email already exists');
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (full_name, username, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
            $stmt->execute([$full_name, $username, $email, $phone, $hash, $role]);

            $pdo->prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_created', ?)")
                ->execute([getUserId(), "Created user: $username ($role)"]);

            flashMessage('success', 'User created successfully');
            redirect('/admin/users/list.php');
        }
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#10133; Add User</h1>
  <a href="/admin/users/list.php" class="btn btn-outline btn-sm">Back</a>
</div>

<div class="card">
  <form method="POST">
    <div class="form-group">
      <label>Full Name *</label>
      <input type="text" name="full_name" class="form-control" placeholder="Full name" required
             value="<?= sanitize($_POST['full_name'] ?? '') ?>">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Username *</label>
        <input type="text" name="username" class="form-control" placeholder="Username" required
               value="<?= sanitize($_POST['username'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Role *</label>
        <select name="role" class="form-control">
          <option value="sales_executive">Sales Executive</option>
          <option value="telecaller">Telecaller</option>
          <option value="manager">Manager</option>
          <option value="sub_admin">Sub Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" class="form-control" placeholder="Email"
               value="<?= sanitize($_POST['email'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="tel" name="phone" class="form-control" placeholder="Phone"
               value="<?= sanitize($_POST['phone'] ?? '') ?>">
      </div>
    </div>

    <div class="form-group">
      <label>Password *</label>
      <input type="password" name="password" class="form-control" placeholder="Set password" required>
    </div>

    <button type="submit" class="btn btn-primary btn-block btn-lg">&#10133; Create User</button>
  </form>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
