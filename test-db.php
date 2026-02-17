<?php
require_once 'config.php';

echo "<h2>Database Connection Test</h2>";

try {
    // Test connection
    echo "✅ Database connected successfully!<br>";
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $result = $stmt->fetch();
    
    if ($result) {
        echo "✅ Users table exists<br><br>";
        
        // Check admin user
        $stmt = $pdo->query("SELECT id, username, email, name, role, status FROM users WHERE username = 'admin'");
        $user = $stmt->fetch();
        
        if ($user) {
            echo "<h3>Admin User Found:</h3>";
            echo "ID: " . $user['id'] . "<br>";
            echo "Username: " . $user['username'] . "<br>";
            echo "Email: " . $user['email'] . "<br>";
            echo "Name: " . $user['name'] . "<br>";
            echo "Role: " . $user['role'] . "<br>";
            echo "Status: " . $user['status'] . "<br>";
        } else {
            echo "❌ Admin user NOT found in database!<br>";
        }
    } else {
        echo "❌ Users table does NOT exist<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage();
}
?>
