<?php
/**
 * Script para verificar y configurar la configuración de MySQL para manejar payloads grandes
 */

try {    // Conectar a MySQL (sin especificar base de datos primero)
    $pdo = new PDO(
        'mysql:host=localhost;charset=utf8mb4',
        'root', // usuario por defecto de XAMPP
        '',     // sin contraseña por defecto en XAMPP
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    // Mostrar bases de datos disponibles
    echo "<h2>Bases de Datos Disponibles</h2>\n";
    $stmt = $pdo->query("SHOW DATABASES");
    $databases = $stmt->fetchAll();
    
    echo "<ul>\n";
    foreach ($databases as $db) {
        echo "<li>" . $db['Database'] . "</li>\n";
    }
    echo "</ul>\n";

    // Intentar seleccionar la base de datos correcta
    $target_db = null;
    foreach ($databases as $db) {
        if (strpos(strtolower($db['Database']), 'banana') !== false) {
            $target_db = $db['Database'];
            break;
        }
    }
    
    if (!$target_db) {
        // Buscar bases de datos que no sean del sistema
        foreach ($databases as $db) {
            $db_name = $db['Database'];
            if (!in_array($db_name, ['information_schema', 'mysql', 'performance_schema', 'sys', 'phpmyadmin'])) {
                $target_db = $db_name;
                break;
            }
        }
    }
    
    if ($target_db) {
        echo "<p>Usando base de datos: <strong>{$target_db}</strong></p>\n";
        $pdo->exec("USE {$target_db}");
    } else {
        echo "<p>⚠️ No se encontró una base de datos específica del proyecto</p>\n";
    }

    echo "<h1>Verificación de Configuración MySQL</h1>\n";
    echo "<style>body { font-family: Arial, sans-serif; margin: 20px; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>\n";

    // Verificar configuraciones importantes
    $configs = [
        'max_allowed_packet',
        'max_connections',
        'innodb_buffer_pool_size',
        'wait_timeout',
        'interactive_timeout'
    ];

    echo "<h2>Configuraciones Actuales</h2>\n";
    echo "<table>\n";
    echo "<tr><th>Variable</th><th>Valor Actual</th><th>Recomendado</th><th>Estado</th></tr>\n";

    foreach ($configs as $config) {
        $stmt = $pdo->prepare("SHOW VARIABLES LIKE ?");
        $stmt->execute([$config]);
        $result = $stmt->fetch();
        
        $current_value = $result ? $result['Value'] : 'No encontrado';
        
        // Determinar recomendaciones
        $recommended = '';
        $status = '';
        
        switch ($config) {
            case 'max_allowed_packet':
                $recommended = '64MB o más';
                $current_mb = intval($current_value) / (1024 * 1024);
                $status = $current_mb >= 64 ? '✅ OK' : '❌ Muy pequeño';
                $current_value .= " (" . round($current_mb, 2) . " MB)";
                break;
            case 'max_connections':
                $recommended = '100 o más';
                $status = intval($current_value) >= 100 ? '✅ OK' : '⚠️ Bajo';
                break;
            case 'innodb_buffer_pool_size':
                $recommended = '128MB o más';
                $current_mb = intval($current_value) / (1024 * 1024);
                $status = $current_mb >= 128 ? '✅ OK' : '⚠️ Bajo';
                $current_value .= " (" . round($current_mb, 2) . " MB)";
                break;
            default:
                $recommended = 'Variable';
                $status = '✅ OK';
        }
        
        echo "<tr><td>{$config}</td><td>{$current_value}</td><td>{$recommended}</td><td>{$status}</td></tr>\n";
    }
    echo "</table>\n";

    // Intentar ajustar configuraciones para la sesión actual
    echo "<h2>Ajustes para la Sesión Actual</h2>\n";
    
    try {
        // Aumentar max_allowed_packet para esta sesión
        $pdo->exec("SET SESSION max_allowed_packet = 67108864"); // 64MB
        echo "<p>✅ max_allowed_packet establecido a 64MB para esta sesión</p>\n";
        
        // Verificar el cambio
        $stmt = $pdo->query("SELECT @@SESSION.max_allowed_packet as value");
        $result = $stmt->fetch();
        $new_mb = intval($result['value']) / (1024 * 1024);
        echo "<p>Nuevo valor de sesión: " . round($new_mb, 2) . " MB</p>\n";
        
    } catch (PDOException $e) {
        echo "<p>❌ Error al ajustar configuraciones: " . $e->getMessage() . "</p>\n";
    }

    // Mostrar instrucciones para cambios permanentes
    echo "<h2>Para Cambios Permanentes</h2>\n";
    echo "<div style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>\n";
    echo "<p><strong>Edite el archivo de configuración de MySQL:</strong></p>\n";
    echo "<p>En XAMPP, edite: <code>C:\\xampp\\mysql\\bin\\my.ini</code></p>\n";
    echo "<p>Agregue o modifique estas líneas en la sección <code>[mysqld]</code>:</p>\n";
    echo "<pre>\n";
    echo "max_allowed_packet = 64M\n";
    echo "max_connections = 200\n";
    echo "innodb_buffer_pool_size = 256M\n";
    echo "</pre>\n";
    echo "<p>Luego reinicie el servicio MySQL desde el Panel de Control de XAMPP.</p>\n";
    echo "</div>\n";

    // Test de inserción de datos grandes
    echo "<h2>Test de Inserción de Datos Grandes</h2>\n";
    
    // Generar datos de prueba grandes
    $large_data = str_repeat('A', 1024 * 1024); // 1MB de datos
    
    try {
        // Crear tabla de prueba si no existe
        $pdo->exec("CREATE TABLE IF NOT EXISTS test_large_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            large_text LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        
        // Intentar insertar datos grandes
        $stmt = $pdo->prepare("INSERT INTO test_large_data (large_text) VALUES (?)");
        $stmt->execute([$large_data]);
        
        echo "<p>✅ Test de inserción exitoso: Se pudieron insertar 1MB de datos</p>\n";
        
        // Limpiar datos de prueba
        $pdo->exec("DELETE FROM test_large_data WHERE large_text = ?");
        
    } catch (PDOException $e) {
        echo "<p>❌ Test de inserción falló: " . $e->getMessage() . "</p>\n";
        
        if (strpos($e->getMessage(), 'max_allowed_packet') !== false) {
            echo "<p><strong>Solución:</strong> Aumente el valor de max_allowed_packet en la configuración de MySQL.</p>\n";
        }
    }

} catch (PDOException $e) {
    echo "<h1>Error de Conexión</h1>\n";
    echo "<p>No se pudo conectar a la base de datos: " . $e->getMessage() . "</p>\n";
    echo "<p>Verifique que MySQL esté ejecutándose en XAMPP.</p>\n";
}
?>
