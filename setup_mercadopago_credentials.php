<?php

// Script para actualizar credenciales de MercadoPago
// INSTRUCCIONES:
// 1. Ve a https://www.mercadopago.com.pe/developers/panel
// 2. Inicia sesión con tu cuenta de MercadoPago
// 3. Crea una aplicación o usa una existente
// 4. Ve a "Credenciales" en el panel
// 5. Copia las credenciales de SANDBOX (para pruebas) o PRODUCCIÓN

echo "=== CONFIGURADOR DE CREDENCIALES MERCADOPAGO ===" . PHP_EOL;
echo PHP_EOL;

echo "ANTES DE CONTINUAR, necesitas obtener las credenciales reales de MercadoPago:" . PHP_EOL;
echo "1. Ve a: https://www.mercadopago.com.pe/developers/panel" . PHP_EOL;
echo "2. Inicia sesión con tu cuenta de MercadoPago" . PHP_EOL;
echo "3. Crea una aplicación si no tienes una" . PHP_EOL;
echo "4. Ve a 'Credenciales' en el panel izquierdo" . PHP_EOL;
echo "5. Copia las credenciales de SANDBOX (para pruebas)" . PHP_EOL;
echo PHP_EOL;

echo "CREDENCIALES ACTUALES (INVÁLIDAS):" . PHP_EOL;
echo "Public Key: TEST-1234567890-123456-abcdef1234567890-12345678" . PHP_EOL;
echo "Access Token: TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-12345678" . PHP_EOL;
echo PHP_EOL;

echo "FORMATO ESPERADO DE CREDENCIALES REALES:" . PHP_EOL;
echo "Public Key (Sandbox): TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" . PHP_EOL;
echo "Access Token (Sandbox): TEST-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx" . PHP_EOL;
echo "Public Key (Producción): APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" . PHP_EOL;
echo "Access Token (Producción): APP_USR-xxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx" . PHP_EOL;
echo PHP_EOL;

echo "CUANDO TENGAS LAS CREDENCIALES REALES, ejecuta:" . PHP_EOL;
echo "php artisan tinker" . PHP_EOL;
echo "Y luego pega el siguiente código (reemplazando las XXX por tus credenciales reales):" . PHP_EOL;
echo PHP_EOL;
echo '$mp = App\Models\PaymentMethod::where("slug", "mercadopago")->first();' . PHP_EOL;
echo '$mp->configuration = [' . PHP_EOL;
echo '    "public_key" => "TEST-TU-PUBLIC-KEY-AQUI",' . PHP_EOL;
echo '    "access_token" => "TEST-TU-ACCESS-TOKEN-AQUI",' . PHP_EOL;
echo '    "sandbox" => true,' . PHP_EOL;
echo '    "success_url" => "http://localhost:8000/checkout/success",' . PHP_EOL;
echo '    "failure_url" => "http://localhost:8000/checkout/failure",' . PHP_EOL;
echo '    "pending_url" => "http://localhost:8000/checkout/pending",' . PHP_EOL;
echo '    "webhook_url" => "http://localhost:8000/api/payments/mercadopago/webhook"' . PHP_EOL;
echo '];' . PHP_EOL;
echo '$mp->save();' . PHP_EOL;
echo 'echo "Credenciales actualizadas!";' . PHP_EOL;
echo PHP_EOL;

echo "ALTERNATIVA RÁPIDA PARA PRUEBAS:" . PHP_EOL;
echo "Puedes usar las credenciales de prueba oficiales de MercadoPago:" . PHP_EOL;
echo "Public Key: TEST-4f3f7d8e-2c1a-4b6d-9e8f-1a2b3c4d5e6f" . PHP_EOL;
echo "Access Token: TEST-123456789012345-061808-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t-123456789" . PHP_EOL;
echo "(Estas son credenciales de ejemplo, pueden no funcionar)" . PHP_EOL;
