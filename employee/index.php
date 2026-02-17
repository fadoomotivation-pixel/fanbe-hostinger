<?php
require_once __DIR__ . '/../admin/config.php';
if (isLoggedIn()) {
    header('Location: /employee/dashboard.php');
} else {
    header('Location: /admin/login.php');
}
exit;
