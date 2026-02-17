<?php
require_once __DIR__ . '/config.php';

// Already logged in? Redirect to dashboard
if (isLoggedIn()) {
    redirect(getDashboardUrl());
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Please enter username and password';
    } else {
        $stmt = $pdo->prepare("SELECT id, username, full_name, email, role, password_hash, status FROM users WHERE (username = ? OR email = ?) LIMIT 1");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['status'] !== 'active') {
                $error = 'Your account has been suspended. Contact admin.';
            } else {
                // Set session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['role'] = $user['role'];

                // Update last login
                $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

                // Log activity
                $pdo->prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, 'login', ?)")
                    ->execute([$user['id'], 'Login from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown')]);

                redirect(getDashboardUrl());
            }
        } else {
            $error = 'Invalid username or password';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Login - Fanbe CRM</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.login-brand {
  text-align: center;
  margin-bottom: 30px;
}
.login-brand h1 {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.login-brand p {
  color: #9ca3af;
  font-size: 0.85rem;
  margin-top: 5px;
}
.form-group { margin-bottom: 18px; }
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}
.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.15s;
}
.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}
.btn-login {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 5px;
}
.btn-login:hover { opacity: 0.9; }
.error-msg {
  background: #fee2e2;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.84rem;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
}
</style>
</head>
<body>
<div class="login-card">
  <div class="login-brand">
    <h1>Fanbe CRM</h1>
    <p>Real Estate Management System</p>
  </div>

  <?php if ($error): ?>
    <div class="error-msg"><?= sanitize($error) ?></div>
  <?php endif; ?>

  <form method="POST" autocomplete="off">
    <div class="form-group">
      <label>Username or Email</label>
      <input type="text" name="username" class="form-control" placeholder="Enter username or email"
             value="<?= sanitize($_POST['username'] ?? '') ?>" required autofocus>
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" name="password" class="form-control" placeholder="Enter password" required>
    </div>
    <button type="submit" class="btn-login">Sign In</button>
  </form>
</div>
</body>
</html>
