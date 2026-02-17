<?php
// Database Configuration for Fanbe CRM
define('DB_HOST', 'localhost');
define('DB_NAME', 'u891384752_fanbe_crm');
define('DB_USER', 'u891384752_fanbe');
define('DB_PASS', 'Major@1k');
define('DB_CHARSET', 'utf8mb4');

// Site Configuration
define('SITE_URL', 'https://fanbegroup.com');
define('ADMIN_PATH', '/admin');
define('SESSION_LIFETIME', 3600); // 1 hour

// Security Settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1); // HTTPS only

// Database Connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("Database Connection Error: " . $e->getMessage());
    die("Database connection failed. Please contact administrator.");
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Helper Functions
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function hasRole($roles) {
    if (!is_array($roles)) {
        $roles = [$roles];
    }
    return isset($_SESSION['role']) && in_array($_SESSION['role'], $roles);
}

function logActivity($pdo, $user_id, $action, $details = null) {
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO activity_log (user_id, action, details, ip_address)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([
            $user_id,
            $action,
            $details,
            $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ]);
    } catch (PDOException $e) {
        error_log("Activity Log Error: " . $e->getMessage());
    }
}
?>
