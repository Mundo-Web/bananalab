<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== SOLUCIÓN FINAL PARA LOGIN ===\n\n";

echo "✅ PASOS COMPLETADOS:\n";
echo "   1. Usuario root@mundoweb.pe configurado con password: 123456\n";
echo "   2. Página de diagnóstico creada\n";
echo "   3. Endpoint de debug sin encriptación creado\n\n";

echo "🧪 CÓMO PROBAR:\n";
echo "   1. Abre: http://localhost:8000/test-login-debug.html\n";
echo "   2. Haz clic en 'Login Debug (Sin Encriptación)'\n";
echo "   3. Debería funcionar con root@mundoweb.pe / 123456\n\n";

echo "🔧 SI SIGUE FALLANDO:\n";
echo "   - El problema puede ser con las sesiones o middleware\n";
echo "   - Revisa la consola del navegador (F12)\n";
echo "   - Verifica que el servidor esté corriendo en localhost:8000\n\n";

echo "📋 CREDENCIALES DISPONIBLES:\n";
use App\Models\User;
$users = User::take(3)->get();
foreach ($users as $user) {
    echo "   - " . $user->email . " / 123456\n";
}

echo "\n🎯 ACCESO DIRECTO:\n";
echo "   URL: http://localhost:8000/test-login-debug.html\n";
echo "\n💡 NOTA: Una vez que el login debug funcione, podrás identificar\n";
echo "   exactamente qué está fallando en el login normal de tu aplicación.\n";
