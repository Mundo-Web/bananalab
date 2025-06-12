<?php

// Script de prueba directa para login sin encriptación
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Incluir el autoloader de Laravel
require_once __DIR__ . '/vendor/autoload.php';

// Inicializar Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Importar las clases necesarias
use Illuminate\Support\Facades\Auth;
use App\Models\User;

// Obtener datos del request
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'status' => false,
        'message' => 'Email y contraseña son requeridos'
    ]);
    exit;
}

try {
    // Intentar login directo sin encriptación
    $credentials = [
        'email' => $input['email'],
        'password' => $input['password']
    ];
    
    if (!Auth::attempt($credentials)) {
        http_response_code(401);
        echo json_encode([
            'status' => false,
            'message' => 'Credenciales inválidas'
        ]);
        exit;
    }
    
    // Login exitoso
    $user = Auth::user();
    
    // Determinar URL de redirección según el rol del usuario
    $redirectUrl = '/login'; // Default fallback
    
    switch ($user->getRole()) {
        case 'Admin':
        case 'Root':
            $redirectUrl = '/admin/home';
            break;
        default:
            $redirectUrl = '/'; // Para otros roles
            break;
    }
    
    echo json_encode([
        'status' => true,
        'message' => 'Login exitoso',
        'data' => [
            'redirect_url' => $redirectUrl,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->getRole()
            ]
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => false,
        'message' => 'Error interno: ' . $e->getMessage()
    ]);
}
?>
