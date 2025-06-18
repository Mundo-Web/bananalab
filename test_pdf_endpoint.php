<?php
require_once 'vendor/autoload.php';

// Configuración de Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

use App\Models\Album;
use Illuminate\Http\Request;
use App\Http\Controllers\AlbumController;

// Obtener el primer álbum
$album = Album::first();
echo "Testing with Album UUID: " . $album->uuid . "\n";
echo "Album ID: " . $album->id . "\n";
echo "Album Title: " . $album->title . "\n\n";

// Simular una solicitud de generación de PDF
echo "=== Testing PDF Generation Endpoint ===\n";

// Crear un PDF de prueba en base64
$testPDFContent = "JVBERi0xLjMKJdP7DQAGYWa7nQpudCJ1eDrRnHnmJu/z2zjlcOPkO2s="; // PDF básico en base64

// Crear la solicitud
$request = Request::create(
    '/api/albums/' . $album->uuid . '/generate-pdf',
    'POST',
    ['pdf_blob' => $testPDFContent],
    [],
    [],
    ['CONTENT_TYPE' => 'application/json']
);

try {
    $controller = new AlbumController();
    $response = $controller->generatePDF($request, $album->uuid);
    
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . $response->getContent() . "\n";
    
    // Verificar si el álbum se actualizó
    $albumUpdated = Album::find($album->id);
    echo "\nAlbum after update:\n";
    echo "Status: " . $albumUpdated->status . "\n";
    echo "PDF Path: " . ($albumUpdated->pdf_path ?: 'null') . "\n";
    echo "Design Finalized At: " . ($albumUpdated->design_finalized_at ?: 'null') . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
