<?php
// Obtener ID de un item válido
$host = 'localhost';
$db = 'bananalab_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT id, name FROM items LIMIT 1");
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($item) {
        echo "✅ Item encontrado: ID = " . $item['id'] . ", Name = " . $item['name'] . "\n";
    } else {
        echo "❌ No se encontraron items en la base de datos\n";
    }
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
