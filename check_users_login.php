<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

try {
    echo "=== DIAGNÓSTICO DE USUARIOS ===\n\n";

    // 1. Buscar el usuario root
    $rootUser = User::where('email', 'root@mundoweb.pe')->first();
    
    if ($rootUser) {
        echo "✅ Usuario encontrado:\n";
        echo "   - ID: " . $rootUser->id . "\n";
        echo "   - Email: " . $rootUser->email . "\n";
        echo "   - Nombre: " . ($rootUser->name ?? 'No especificado') . "\n";
        echo "   - Creado: " . $rootUser->created_at . "\n";
        echo "   - Password hash: " . substr($rootUser->password, 0, 30) . "...\n";
        
        // Verificar si la contraseña es correcta
        $isPasswordCorrect = Hash::check('123456', $rootUser->password);
        echo "   - Password '123456' es correcta: " . ($isPasswordCorrect ? 'SÍ' : 'NO') . "\n\n";
        
        if (!$isPasswordCorrect) {
            echo "🔧 Actualizando contraseña a '123456'...\n";
            $rootUser->password = Hash::make('123456');
            $rootUser->save();
            echo "✅ Contraseña actualizada correctamente\n\n";
        }
    } else {
        echo "❌ Usuario 'root@mundoweb.pe' NO encontrado\n\n";
        
        echo "🔧 Creando usuario root...\n";
        $newUser = User::create([
            'name' => 'Root',
            'email' => 'root@mundoweb.pe',
            'password' => Hash::make('123456'),
            'email_verified_at' => now(),
        ]);
        
        echo "✅ Usuario root creado:\n";
        echo "   - ID: " . $newUser->id . "\n";
        echo "   - Email: " . $newUser->email . "\n";
        echo "   - Password: 123456\n\n";
    }
    
    // 2. Mostrar todos los usuarios disponibles
    $allUsers = User::take(5)->get();
    echo "📋 Usuarios disponibles en el sistema:\n";
    foreach ($allUsers as $user) {
        echo "   - " . $user->email . " (ID: " . $user->id . ")\n";
    }
    
    echo "\n💡 PRUEBA EL LOGIN:\n";
    echo "   1. Abre: http://localhost:8000/test-login-debug.html\n";
    echo "   2. Usa: root@mundoweb.pe / 123456\n";
    echo "   3. O prueba con cualquier email de la lista de arriba\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
