<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

// Obtener datos de la petición
$input = json_decode(file_get_contents('php://input'), true);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        echo json_encode([
            'status' => false,
            'message' => 'Email y contraseña son requeridos',
            'debug' => 'Datos recibidos: ' . json_encode($input)
        ]);
        exit;
    }

    $email = $input['email'];
    $password = $input['password'];

    echo json_encode([
        'debug_received' => [
            'email' => $email,
            'password_length' => strlen($password),
            'raw_input' => $input
        ]
    ]);
    
    // Buscar usuario
    $user = User::where('email', $email)->first();
    
    if (!$user) {
        echo json_encode([
            'status' => false,
            'message' => 'Usuario no encontrado',
            'debug_email' => $email,
            'available_users' => User::take(3)->pluck('email')->toArray()
        ]);
        exit;
    }
    
    // Verificar contraseña
    if (!Hash::check($password, $user->password)) {
        echo json_encode([
            'status' => false,
            'message' => 'Contraseña incorrecta',
            'debug' => [
                'input_password' => $password,
                'hash_check' => 'failed',
                'user_found' => true
            ]
        ]);
        exit;
    }
    
    // Intentar login
    Auth::login($user);
    
    // Verificar si el login fue exitoso
    if (Auth::check()) {
        session()->regenerate();
        
        echo json_encode([
            'status' => true,
            'message' => 'Login exitoso',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email
            ],
            'debug' => [
                'auth_check' => true,
                'session_id' => session()->getId()
            ]
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => 'Error en el proceso de autenticación',
            'debug' => [
                'user_found' => true,
                'password_correct' => true,
                'auth_check' => false
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error interno: ' . $e->getMessage(),
        'debug' => [
            'exception' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
