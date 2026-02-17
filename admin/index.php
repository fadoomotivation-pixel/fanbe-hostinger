<?php
require_once __DIR__ . '/config.php';

if (isLoggedIn()) {
    header('Location: ' . getDashboardUrl());
} else {
    header('Location: /admin/login.php');
}
exit;
