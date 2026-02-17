<?php
require_once __DIR__ . '/config.php';

if (isLoggedIn()) {
    $pdo->prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, 'logout', 'User logged out')")
        ->execute([getUserId()]);
}

session_destroy();
header('Location: /admin/login.php');
exit;
