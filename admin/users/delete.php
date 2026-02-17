<?php
require_once __DIR__ . '/../config.php';
requireRole(['super_admin']);

$userId = (int)($_GET['id'] ?? 0);
if (!$userId || $userId == getUserId()) {
    flashMessage('error', 'Cannot suspend this user');
    redirect('/admin/users/list.php');
}

// Soft delete - toggle status
$stmt = $pdo->prepare("SELECT status, username FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if ($user) {
    $newStatus = $user['status'] === 'active' ? 'suspended' : 'active';
    $pdo->prepare("UPDATE users SET status = ? WHERE id = ?")->execute([$newStatus, $userId]);

    $pdo->prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, 'user_status_change', ?)")
        ->execute([getUserId(), "Set {$user['username']} to $newStatus"]);

    flashMessage('success', "User {$user['username']} is now $newStatus");
}

redirect('/admin/users/list.php');
