<?php
require_once 'config.php';
requireLogin();

// Fetch user stats
try {
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE status = 'Active'");
    $activeUsers = $stmt->fetch()['total'];

    $stmt = $pdo->query("SELECT COUNT(*) as total FROM activity_log WHERE DATE(created_at) = CURDATE()");
    $todayActivity = $stmt->fetch()['total'];
} catch (PDOException $e) {
    $activeUsers = 0;
    $todayActivity = 0;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Fanbe CRM Admin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
        }

        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .navbar h1 {
            font-size: 24px;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .user-name {
            text-align: right;
        }

        .user-name strong {
            display: block;
            font-size: 14px;
        }

        .user-name small {
            font-size: 12px;
            opacity: 0.9;
        }

        .btn-logout {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.3s;
        }

        .btn-logout:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .container {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 20px;
        }

        .welcome-box {
            background: white;
            border-radius: 12px;
            padding: 32px;
            margin-bottom: 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .welcome-box h2 {
            color: #333;
            margin-bottom: 12px;
        }

        .welcome-box p {
            color: #666;
            line-height: 1.6;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 28px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .stat-card h3 {
            color: #666;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-card .number {
            font-size: 36px;
            font-weight: 700;
            color: #667eea;
        }

        .quick-actions {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .quick-actions h2 {
            margin-bottom: 20px;
            color: #333;
        }

        .action-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .action-btn {
            display: block;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            transition: all 0.3s;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <h1>Fanbe CRM Admin</h1>
        <div class="user-info">
            <div class="user-name">
                <strong><?php echo htmlspecialchars($_SESSION['name']); ?></strong>
                <small><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $_SESSION['role']))); ?></small>
            </div>
            <a href="logout.php" class="btn-logout">Logout</a>
        </div>
    </nav>

    <div class="container">
        <div class="welcome-box">
            <h2>Welcome back, <?php echo htmlspecialchars(explode(' ', $_SESSION['name'])[0]); ?>!</h2>
            <p>You're logged in as <strong><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $_SESSION['role']))); ?></strong>. Manage your CRM system from this dashboard.</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>Active Users</h3>
                <div class="number"><?php echo $activeUsers; ?></div>
            </div>

            <div class="stat-card">
                <h3>Today's Activity</h3>
                <div class="number"><?php echo $todayActivity; ?></div>
            </div>

            <div class="stat-card">
                <h3>Your Role</h3>
                <div class="number" style="font-size: 20px; margin-top: 8px;">
                    <?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $_SESSION['role']))); ?>
                </div>
            </div>
        </div>

        <div class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="action-grid">
                <a href="#" class="action-btn">Manage Users</a>
                <a href="#" class="action-btn">View Reports</a>
                <a href="#" class="action-btn">Settings</a>
                <a href="#" class="action-btn">Activity Log</a>
            </div>
        </div>
    </div>
</body>
</html>
