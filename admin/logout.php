<?php
require_once 'config.php';

if (isLoggedIn()) {
    // Log the logout activity
    logActivity($pdo, $_SESSION['user_id'], 'logout', 'User logged out');

    // Destroy session
    session_unset();
    session_destroy();

    // Clear session cookie
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
}

header('Location: login.php');
exit;
?>
