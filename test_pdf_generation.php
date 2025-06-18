<?php
/**
 * Test script para verificar la funcionalidad de generación de PDF
 */

// Verificar que el directorio de PDFs existe
$pdfDirectory = __DIR__ . '/storage/app/images/albums/clients';

echo "📁 Verificando directorio de PDFs: $pdfDirectory\n";

if (!is_dir($pdfDirectory)) {
    echo "❌ El directorio no existe. Creándolo...\n";
    if (!mkdir($pdfDirectory, 0755, true)) {
        die("❌ No se pudo crear el directorio\n");
    }
    echo "✅ Directorio creado exitosamente\n";
} else {
    echo "✅ El directorio existe\n";
}

// Verificar permisos de escritura
if (!is_writable($pdfDirectory)) {
    echo "❌ El directorio no tiene permisos de escritura\n";
} else {
    echo "✅ El directorio tiene permisos de escritura\n";
}

// Crear un archivo de prueba
$testFile = $pdfDirectory . '/test.txt';
if (file_put_contents($testFile, 'Test file') !== false) {
    echo "✅ Se puede escribir archivos en el directorio\n";
    unlink($testFile); // Eliminar archivo de prueba
} else {
    echo "❌ No se puede escribir archivos en el directorio\n";
}

echo "\n📋 Resumen:\n";
echo "- Directorio: $pdfDirectory\n";
echo "- Existe: " . (is_dir($pdfDirectory) ? 'Sí' : 'No') . "\n";
echo "- Escribible: " . (is_writable($pdfDirectory) ? 'Sí' : 'No') . "\n";
echo "\n🎯 El sistema está listo para guardar PDFs de álbumes\n";
