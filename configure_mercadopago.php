<?php
require_once 'vendor/autoload.php';

// Conexión directa a la base de datos para evitar problemas de inicialización
$host = 'localhost';
$db = 'bananalab_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener configuración actual de MercadoPago
    $stmt = $pdo->prepare("SELECT * FROM payment_methods WHERE slug = 'mercadopago'");
    $stmt->execute();
    $mercadopago = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($mercadopago) {
        echo "🔍 CONFIGURACIÓN ACTUAL DE MERCADOPAGO:\n";
        echo "   - ID: " . $mercadopago['id'] . "\n";
        echo "   - Nombre: " . $mercadopago['name'] . "\n";
        echo "   - Slug: " . $mercadopago['slug'] . "\n";
        echo "   - Tipo: " . $mercadopago['type'] . "\n";
        echo "   - Activo: " . ($mercadopago['is_active'] ? 'Sí' : 'No') . "\n";
        echo "   - Configuración actual: " . ($mercadopago['configuration'] ?? 'null') . "\n\n";
        
        // Configuración de prueba para MercadoPago
        $testConfig = [
            'public_key' => 'TEST-1234567890-123456-abcdef1234567890-12345678',  // Clave de prueba
            'access_token' => 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-12345678',  // Token de prueba
            'sandbox' => true,
            'success_url' => url('/checkout/success'),
            'failure_url' => url('/checkout/failure'),
            'pending_url' => url('/checkout/pending'),
            'webhook_url' => url('/api/payments/mercadopago/webhook')
        ];
        
        echo "🚀 CONFIGURANDO MERCADOPAGO CON DATOS DE PRUEBA...\n";
        
        $updateStmt = $pdo->prepare("UPDATE payment_methods SET configuration = ? WHERE slug = 'mercadopago'");
        $updateStmt->execute([json_encode($testConfig)]);
        
        echo "✅ MercadoPago configurado exitosamente!\n";
        echo "   - Public Key: " . $testConfig['public_key'] . "\n";
        echo "   - Sandbox: " . ($testConfig['sandbox'] ? 'Sí' : 'No') . "\n";
        echo "   - Success URL: " . $testConfig['success_url'] . "\n\n";
        
        echo "📝 NOTA: Estas son credenciales de prueba.\n";
        echo "   Para producción, reemplaza con las credenciales reales de MercadoPago.\n\n";
        
    } else {
        echo "❌ No se encontró el método de pago MercadoPago\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// Función helper para URL (simulada)
function url($path) {
    return 'http://localhost/projects/bananalab/public' . $path;
}
?>
