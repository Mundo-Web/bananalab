<?php
/**
 * Test Final del Flujo Completo de MercadoPago Checkout Pro
 * 
 * Este script verifica todo el flujo de pago, desde la configuración
 * hasta la creación de preferencia, identificando posibles problemas.
 */

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✅ Test Final - Flujo Completo MercadoPago</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-6">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <h1 class="text-2xl font-bold text-green-800 mb-2">✅ Test Final - Flujo Completo MercadoPago</h1>
            <p class="text-green-700">Verificación completa del flujo de pago con diagnóstico de errores</p>
        </div>

        <?php
        try {
            // 1. Verificar configuración de base de datos
            echo '<div class="bg-white rounded-lg shadow p-6 mb-6">';
            echo '<h2 class="text-xl font-bold mb-4 text-blue-600">🔧 1. Verificación de Configuración</h2>';
            
            // Conectar a la base de datos
            $host = 'localhost';
            $dbname = 'bananalab';
            $username = 'root';
            $password = '';

            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                echo '<p class="text-green-600">✅ Conexión a base de datos exitosa</p>';
                
                // Obtener credenciales de MercadoPago
                $stmt = $pdo->prepare("SELECT * FROM payment_methods WHERE name = 'mercadopago' AND status = 1");
                $stmt->execute();
                $mercadopago = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($mercadopago) {
                    echo '<p class="text-green-600">✅ Método de pago MercadoPago encontrado</p>';
                    
                    $config = json_decode($mercadopago['configuration'], true);
                    
                    if ($config) {
                        echo '<p class="text-green-600">✅ Configuración JSON válida</p>';
                        
                        // Verificar campos requeridos
                        $required_fields = ['public_key', 'access_token', 'client_id', 'client_secret'];
                        $missing_fields = [];
                        
                        foreach ($required_fields as $field) {
                            if (empty($config[$field])) {
                                $missing_fields[] = $field;
                            }
                        }
                        
                        if (empty($missing_fields)) {
                            echo '<p class="text-green-600">✅ Todos los campos requeridos están presentes</p>';
                            
                            // Verificar formato de credenciales
                            $public_key = $config['public_key'];
                            $access_token = $config['access_token'];
                            
                            if (strpos($public_key, 'APP_USR-') === 0) {
                                echo '<p class="text-green-600">✅ Formato de Public Key correcto</p>';
                            } else {
                                echo '<p class="text-red-600">❌ Formato de Public Key incorrecto (debe empezar con APP_USR-)</p>';
                            }
                            
                            if (strpos($access_token, 'APP_USR-') === 0) {
                                echo '<p class="text-green-600">✅ Formato de Access Token correcto</p>';
                            } else {
                                echo '<p class="text-red-600">❌ Formato de Access Token incorrecto (debe empezar con APP_USR-)</p>';
                            }
                            
                        } else {
                            echo '<p class="text-red-600">❌ Campos faltantes: ' . implode(', ', $missing_fields) . '</p>';
                        }
                        
                    } else {
                        echo '<p class="text-red-600">❌ Error al decodificar configuración JSON</p>';
                    }
                } else {
                    echo '<p class="text-red-600">❌ Método de pago MercadoPago no encontrado o inactivo</p>';
                }
                
            } catch (PDOException $e) {
                echo '<p class="text-red-600">❌ Error de conexión: ' . $e->getMessage() . '</p>';
                $config = null;
            }
            
            echo '</div>';

            // 2. Test de API de MercadoPago
            if (isset($config) && !empty($config['access_token'])) {
                echo '<div class="bg-white rounded-lg shadow p-6 mb-6">';
                echo '<h2 class="text-xl font-bold mb-4 text-purple-600">🧪 2. Test de API MercadoPago</h2>';
                
                $access_token = $config['access_token'];
                
                // Test 1: Verificar cuenta
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/users/me');
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $access_token,
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                
                $response = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($http_code === 200) {
                    $user_data = json_decode($response, true);
                    echo '<p class="text-green-600">✅ API de MercadoPago responde correctamente</p>';
                    echo '<p class="text-blue-600">📍 País: ' . ($user_data['site_id'] ?? 'No especificado') . '</p>';
                    echo '<p class="text-blue-600">👤 Usuario: ' . ($user_data['nickname'] ?? 'No especificado') . '</p>';
                } else {
                    echo '<p class="text-red-600">❌ Error en API de MercadoPago (HTTP ' . $http_code . ')</p>';
                    if ($response) {
                        $error_data = json_decode($response, true);
                        echo '<p class="text-red-600">Error: ' . ($error_data['message'] ?? 'Error desconocido') . '</p>';
                    }
                }
                
                // Test 2: Verificar métodos de pago
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/payment_methods');
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $access_token
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                
                $methods_response = curl_exec($ch);
                $methods_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($methods_http_code === 200) {
                    $methods = json_decode($methods_response, true);
                    echo '<p class="text-green-600">✅ Métodos de pago disponibles: ' . count($methods) . '</p>';
                } else {
                    echo '<p class="text-red-600">❌ Error obteniendo métodos de pago (HTTP ' . $methods_http_code . ')</p>';
                }
                
                echo '</div>';
            }

            // 3. Test de creación de preferencia
            if (isset($config) && !empty($config['access_token'])) {
                echo '<div class="bg-white rounded-lg shadow p-6 mb-6">';
                echo '<h2 class="text-xl font-bold mb-4 text-orange-600">💳 3. Test de Creación de Preferencia</h2>';
                
                // Datos de prueba para la preferencia
                $preference_data = [
                    'items' => [
                        [
                            'title' => 'Producto de Prueba',
                            'quantity' => 1,
                            'unit_price' => 100.00,
                            'currency_id' => 'PEN'
                        ]
                    ],
                    'payer' => [
                        'email' => 'test@test.com'
                    ],
                    'back_urls' => [
                        'success' => 'http://localhost/projects/bananalab/public/success',
                        'failure' => 'http://localhost/projects/bananalab/public/failure',
                        'pending' => 'http://localhost/projects/bananalab/public/pending'
                    ],
                    'auto_return' => 'approved',
                    'notification_url' => 'http://localhost/projects/bananalab/public/webhook/mercadopago',
                    'statement_descriptor' => 'BANANALAB',
                    'external_reference' => 'TEST-' . time()
                ];
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/checkout/preferences');
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($preference_data));
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $config['access_token'],
                    'Content-Type: application/json'
                ]);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                
                $pref_response = curl_exec($ch);
                $pref_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($pref_http_code === 201) {
                    $preference = json_decode($pref_response, true);
                    echo '<p class="text-green-600">✅ Preferencia creada exitosamente</p>';
                    echo '<p class="text-blue-600">🆔 ID: ' . $preference['id'] . '</p>';
                    
                    // Verificar URLs
                    if (isset($preference['init_point'])) {
                        echo '<p class="text-blue-600">🔗 URL Producción: ' . $preference['init_point'] . '</p>';
                    }
                    
                    if (isset($preference['sandbox_init_point'])) {
                        echo '<p class="text-green-600">🔗 URL Sandbox: ' . $preference['sandbox_init_point'] . '</p>';
                        echo '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded">';
                        echo '<p class="text-green-800"><strong>✅ FLUJO CORRECTO IDENTIFICADO:</strong></p>';
                        echo '<p class="text-green-700">El frontend debe usar <code>sandbox_init_point</code> para pruebas.</p>';
                        echo '<p class="text-green-700">URL para redirigir: <code>' . $preference['sandbox_init_point'] . '</code></p>';
                        echo '</div>';
                    } else {
                        echo '<p class="text-yellow-600">⚠️ No se encontró sandbox_init_point (normal si son credenciales de producción)</p>';
                    }
                    
                } else {
                    echo '<p class="text-red-600">❌ Error creando preferencia (HTTP ' . $pref_http_code . ')</p>';
                    if ($pref_response) {
                        $error_data = json_decode($pref_response, true);
                        echo '<p class="text-red-600">Error: ' . ($error_data['message'] ?? 'Error desconocido') . '</p>';
                        if (isset($error_data['cause'])) {
                            foreach ($error_data['cause'] as $cause) {
                                echo '<p class="text-red-600">- ' . $cause['code'] . ': ' . $cause['description'] . '</p>';
                            }
                        }
                    }
                }
                
                echo '</div>';
            }

            // 4. Verificación del Frontend
            echo '<div class="bg-white rounded-lg shadow p-6 mb-6">';
            echo '<h2 class="text-xl font-bold mb-4 text-indigo-600">🎨 4. Verificación del Frontend</h2>';
            
            $frontend_file = __DIR__ . '/../resources/js/Components/Tailwind/Checkouts/Components/PaymentStepsModalFixed.jsx';
            
            if (file_exists($frontend_file)) {
                echo '<p class="text-green-600">✅ Archivo frontend encontrado</p>';
                
                $frontend_content = file_get_contents($frontend_file);
                
                // Verificar uso correcto de sandbox_init_point
                if (strpos($frontend_content, 'sandbox_init_point || preferenceData.init_point') !== false) {
                    echo '<p class="text-green-600">✅ Frontend configurado para priorizar sandbox_init_point</p>';
                } elseif (strpos($frontend_content, 'preferenceData.sandbox_init_point') !== false) {
                    echo '<p class="text-green-600">✅ Frontend tiene referencia a sandbox_init_point</p>';
                } else {
                    echo '<p class="text-red-600">❌ Frontend no está configurado para usar sandbox_init_point</p>';
                }
                
                // Verificar mensaje de log corregido
                if (strpos($frontend_content, 'SANDBOX') !== false && strpos($frontend_content, 'PRODUCCIÓN') !== false) {
                    echo '<p class="text-green-600">✅ Mensajes de log corregidos (distingue sandbox vs producción)</p>';
                } else {
                    echo '<p class="text-yellow-600">⚠️ Mensajes de log podrían necesitar mejora</p>';
                }
                
            } else {
                echo '<p class="text-red-600">❌ Archivo frontend no encontrado</p>';
            }
            
            echo '</div>';

            // 5. Resumen y recomendaciones
            echo '<div class="bg-white rounded-lg shadow p-6 mb-6">';
            echo '<h2 class="text-xl font-bold mb-4 text-gray-600">📋 5. Resumen y Recomendaciones</h2>';
            
            echo '<div class="space-y-4">';
            
            // Recomendaciones para Error E216
            echo '<div class="p-4 bg-yellow-50 border border-yellow-200 rounded">';
            echo '<h3 class="font-bold text-yellow-800 mb-2">🎯 Solución para Error E216 "invalid esc":</h3>';
            echo '<ul class="text-yellow-700 space-y-1">';
            echo '<li>• Usar solo caracteres alfanuméricos en el nombre del titular (sin tildes, ñ, etc.)</li>';
            echo '<li>• Ejemplo correcto: "APRO" en lugar de "José García"</li>';
            echo '<li>• Verificar que el número de tarjeta no tenga espacios o caracteres especiales</li>';
            echo '<li>• Usar credenciales de sandbox válidas para Perú</li>';
            echo '<li>• Configurar locale correcto (es-PE para Perú)</li>';
            echo '</ul>';
            echo '</div>';
            
            // Flujo correcto
            echo '<div class="p-4 bg-green-50 border border-green-200 rounded">';
            echo '<h3 class="font-bold text-green-800 mb-2">✅ Flujo Correcto de Pago:</h3>';
            echo '<ol class="text-green-700 space-y-1">';
            echo '<li>1. Frontend crea preferencia usando endpoint Laravel</li>';
            echo '<li>2. Backend usa access_token para crear preferencia en MercadoPago</li>';
            echo '<li>3. MercadoPago devuelve sandbox_init_point para pruebas</li>';
            echo '<li>4. Frontend redirige a sandbox_init_point (NO a init_point)</li>';
            echo '<li>5. Usuario completa pago en formulario de MercadoPago</li>';
            echo '<li>6. MercadoPago redirige de vuelta con resultado</li>';
            echo '</ol>';
            echo '</div>';
            
            // Cuentas de prueba
            echo '<div class="p-4 bg-blue-50 border border-blue-200 rounded">';
            echo '<h3 class="font-bold text-blue-800 mb-2">🔧 Configuración de Cuentas de Prueba:</h3>';
            echo '<ul class="text-blue-700 space-y-1">';
            echo '<li>• Crear cuenta vendedor de prueba en Perú (no usar la misma para comprar)</li>';
            echo '<li>• Crear cuenta comprador de prueba diferente</li>';
            echo '<li>• Obtener credenciales de la cuenta vendedor de prueba</li>';
            echo '<li>• Actualizar base de datos con estas credenciales</li>';
            echo '<li>• Nunca mezclar credenciales de producción y sandbox</li>';
            echo '</ul>';
            echo '</div>';
            
            echo '</div>';
            echo '</div>';

            // 6. Links útiles
            echo '<div class="bg-white rounded-lg shadow p-6">';
            echo '<h2 class="text-xl font-bold mb-4 text-gray-600">🔗 6. Herramientas de Debug</h2>';
            echo '<div class="space-y-2">';
            echo '<p><a href="debug_frontend_mercadopago.html" class="text-blue-600 hover:underline">🧪 Debug Frontend MercadoPago</a> - Para probar tokenización</p>';
            echo '<p><a href="diagnostic_e216_error.html" class="text-blue-600 hover:underline">🔧 Diagnóstico Error E216</a> - Análisis específico del error</p>';
            echo '<p><a href="obtener-credenciales-peru.html" class="text-blue-600 hover:underline">🔑 Obtener Credenciales Perú</a> - Guía para cuentas de prueba</p>';
            echo '</div>';
            echo '</div>';

        } catch (Exception $e) {
            echo '<div class="bg-red-50 border border-red-200 rounded p-4">';
            echo '<p class="text-red-600">❌ Error general: ' . $e->getMessage() . '</p>';
            echo '</div>';
        }
        ?>
    </div>
</body>
</html>
