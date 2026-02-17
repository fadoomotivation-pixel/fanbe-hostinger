<?php
// Fanbe CRM - Database Configuration
// Update these values for your Hostinger MySQL database

define('DB_HOST', 'localhost');
define('DB_NAME', 'u891384752_fanbe_crm');
define('DB_USER', 'u891384752_fanbe_admin');
define('DB_PASS', ''); // Set your password here

define('SITE_NAME', 'Fanbe CRM');
define('SITE_URL', 'https://fanbegroup.com');
define('ADMIN_URL', SITE_URL . '/admin');
define('MANAGER_URL', SITE_URL . '/manager');
define('EMPLOYEE_URL', SITE_URL . '/employee');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
if (!headers_sent()) {
    session_start();
}

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    die("Database connection failed. Please check config.php");
}

// Helper functions
function sanitize($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: /admin/login.php');
        exit;
    }
}

function requireRole($roles) {
    requireLogin();
    if (!is_array($roles)) $roles = [$roles];
    if (!in_array($_SESSION['role'], $roles)) {
        header('HTTP/1.1 403 Forbidden');
        echo 'Access denied';
        exit;
    }
}

function getUserRole() {
    return $_SESSION['role'] ?? '';
}

function getUserId() {
    return $_SESSION['user_id'] ?? 0;
}

function getUserName() {
    return $_SESSION['full_name'] ?? '';
}

function redirect($url) {
    header("Location: $url");
    exit;
}

function flashMessage($type, $message) {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash() {
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

function getDashboardUrl() {
    switch (getUserRole()) {
        case 'super_admin': return '/admin/dashboard.php';
        case 'sub_admin':
        case 'manager': return '/manager/dashboard.php';
        case 'sales_executive':
        case 'telecaller': return '/employee/dashboard.php';
        default: return '/admin/login.php';
    }
}

function formatDate($date) {
    return date('d M Y', strtotime($date));
}

function formatDateTime($datetime) {
    return date('d M Y, h:i A', strtotime($datetime));
}

function timeAgo($datetime) {
    $diff = time() - strtotime($datetime);
    if ($diff < 60) return 'Just now';
    if ($diff < 3600) return floor($diff / 60) . 'm ago';
    if ($diff < 86400) return floor($diff / 3600) . 'h ago';
    if ($diff < 604800) return floor($diff / 86400) . 'd ago';
    return formatDate($datetime);
}
