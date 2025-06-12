<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=bananalab_db', 'root', '');
    $stmt = $pdo->query('DESCRIBE payment_methods');
    echo "Payment Methods Table Structure:\n";
    while ($row = $stmt->fetch()) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    echo "\nSample records:\n";
    $stmt = $pdo->query('SELECT * FROM payment_methods LIMIT 3');
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- ID: " . $row['id'] . ", Name: " . ($row['name'] ?? 'N/A') . ", Status: " . ($row['status'] ?? 'N/A') . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
