<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
header('Pragma: no-cache');
header('Expires: 0');

$versionFile = dirname(__DIR__) . '/version.json';
$version = [];

if (file_exists($versionFile)) {
    $json = file_get_contents($versionFile);
    $version = json_decode($json, true);
}

if (!is_array($version)) {
    $version = [];
}

$version['serverTime'] = gmdate('c');
$version['endpoint'] = '/api/version';

echo json_encode($version, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
