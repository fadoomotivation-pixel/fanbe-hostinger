<?php
require_once __DIR__ . '/../admin/config.php';
if (isLoggedIn()) {
    header('Location: /manager/dashboard.php');
} else {
    header('Location: /admin/login.php');
}
exit;
