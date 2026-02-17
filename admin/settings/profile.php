<?php
require_once __DIR__ . '/../config.php';
requireLogin();
define('PAGE_TITLE', 'My Profile');

$uid = getUserId();
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$uid]);
$user = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');

    if (empty($full_name)) {
        flashMessage('error', 'Name is required');
    } else {
        $pdo->prepare("UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?")
            ->execute([$full_name, $email, $phone, $uid]);
        $_SESSION['full_name'] = $full_name;
        $_SESSION['email'] = $email;
        flashMessage('success', 'Profile updated');
        redirect('/admin/settings/profile.php');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['change_password'])) {
    $current = $_POST['current_password'] ?? '';
    $newPass = $_POST['new_password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if (empty($current) || empty($newPass)) {
        flashMessage('error', 'All password fields are required');
    } elseif ($newPass !== $confirm) {
        flashMessage('error', 'New passwords do not match');
    } elseif (strlen($newPass) < 6) {
        flashMessage('error', 'Password must be at least 6 characters');
    } elseif (!password_verify($current, $user['password_hash'])) {
        flashMessage('error', 'Current password is incorrect');
    } else {
        $hash = password_hash($newPass, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $uid]);
        flashMessage('success', 'Password changed successfully');
        redirect('/admin/settings/profile.php');
    }
}

include __DIR__ . '/../../includes/header.php';
?>

<div class="page-header">
  <h1>&#9881; My Profile</h1>
</div>

<!-- Profile Info -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:15px;">Profile Information</h3>
  <form method="POST">
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" name="full_name" class="form-control" value="<?= sanitize($user['full_name']) ?>" required>
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
    <div class="form-row">
      <div class="form-group">
        <label>Username</label>
        <input type="text" class="form-control" value="<?= sanitize($user['username']) ?>" disabled>
      </div>
      <div class="form-group">
        <label>Role</label>
        <input type="text" class="form-control" value="<?= str_replace('_', ' ', ucfirst($user['role'])) ?>" disabled>
      </div>
    </div>
    <button type="submit" name="update_profile" class="btn btn-primary">Update Profile</button>
  </form>
</div>

<!-- Change Password -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:15px;">Change Password</h3>
  <form method="POST">
    <div class="form-group">
      <label>Current Password</label>
      <input type="password" name="current_password" class="form-control" placeholder="Enter current password" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>New Password</label>
        <input type="password" name="new_password" class="form-control" placeholder="New password (min 6 chars)" required>
      </div>
      <div class="form-group">
        <label>Confirm New Password</label>
        <input type="password" name="confirm_password" class="form-control" placeholder="Confirm new password" required>
      </div>
    </div>
    <button type="submit" name="change_password" class="btn btn-primary">Change Password</button>
  </form>
</div>

<!-- Account Info -->
<div class="card">
  <h3 class="card-title" style="margin-bottom:10px;">Account Info</h3>
  <div style="font-size:0.88rem;color:#6b7280;">
    <p><strong>Last Login:</strong> <?= $user['last_login'] ? formatDateTime($user['last_login']) : 'N/A' ?></p>
    <p><strong>Account Created:</strong> <?= formatDateTime($user['created_at']) ?></p>
    <p><strong>Status:</strong> <span class="badge badge-<?= $user['status'] === 'active' ? 'active' : 'lost' ?>"><?= ucfirst($user['status']) ?></span></p>
  </div>
</div>

<?php include __DIR__ . '/../../includes/footer.php'; ?>
