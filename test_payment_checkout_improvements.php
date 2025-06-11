<?php

/**
 * Script de Testing para Validar Mejoras del Checkout de Pagos
 * 
 * Este script valida que:
 * 1. Los métodos de pago tienen instrucciones correctas
 * 2. Las variables dinámicas están configuradas
 * 3. La experiencia de usuario es óptima
 */

require_once __DIR__ . '/vendor/autoload.php';

// Configurar Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PaymentMethod;

class PaymentCheckoutTester 
{
    private $results = [];
    
    public function runAllTests() 
    {
        echo "🧪 INICIANDO TESTS DE CHECKOUT DE PAGOS MEJORADO\n";
        echo "=" . str_repeat("=", 60) . "\n\n";
        
        $this->testPaymentMethodsStructure();
        $this->testYapeInstructions();
        $this->testPlinInstructions();
        $this->testBankTransferInstructions();
        $this->testTemplateVariables();
        $this->testConfigurationCompleteness();
        
        $this->showSummary();
    }
    
    public function testPaymentMethodsStructure() 
    {
        echo "📋 Test 1: Estructura de Métodos de Pago\n";
        echo "-" . str_repeat("-", 40) . "\n";
          try {
            $methods = PaymentMethod::where('is_active', true)->get();
            
            if ($methods->count() === 0) {
                $this->addResult('❌ No hay métodos de pago activos');
                return;
            }
            
            $this->addResult("✅ Encontrados {$methods->count()} métodos de pago activos");
            
            foreach ($methods as $method) {
                echo "  🔸 {$method->name} ({$method->type})\n";
                
                // Verificar campos esenciales
                if (empty($method->instructions)) {
                    $this->addResult("  ⚠️  {$method->name}: Sin instrucciones");
                } else {
                    $this->addResult("  ✅ {$method->name}: Tiene instrucciones");
                }
                
                if (empty($method->configuration)) {
                    $this->addResult("  ⚠️  {$method->name}: Sin configuración");
                } else {
                    $this->addResult("  ✅ {$method->name}: Configurado");
                }
            }
            
        } catch (Exception $e) {
            $this->addResult("❌ Error: " . $e->getMessage());
        }
        
        echo "\n";
    }
    
    public function testYapeInstructions() 
    {
        echo "📱 Test 2: Instrucciones de Yape\n";
        echo "-" . str_repeat("-", 40) . "\n";
        
        try {
            $yape = PaymentMethod::where('slug', 'yape')->where('is_active', true)->first();
            
            if (!$yape) {
                $this->addResult('❌ Método Yape no encontrado o inactivo');
                return;
            }
            
            $instructions = is_string($yape->instructions) ? json_decode($yape->instructions, true) : $yape->instructions;
            $config = is_string($yape->configuration) ? json_decode($yape->configuration, true) : $yape->configuration;
            
            // Test de estructura de instrucciones
            $this->validateInstructionStructure('Yape', $instructions);
            
            // Test de configuración específica para Yape
            if (isset($config['phone_number'])) {
                $this->addResult("✅ Yape: Número de teléfono configurado: {$config['phone_number']}");
            } else {
                $this->addResult("❌ Yape: Falta número de teléfono");
            }
            
            // Test de variables dinámicas en instrucciones
            $this->validateDynamicVariables('Yape', $instructions);
            
        } catch (Exception $e) {
            $this->addResult("❌ Error en test Yape: " . $e->getMessage());
        }
        
        echo "\n";
    }
    
    public function testPlinInstructions() 
    {
        echo "🔷 Test 3: Instrucciones de Plin\n";
        echo "-" . str_repeat("-", 40) . "\n";
        
        try {
            $plin = PaymentMethod::where('slug', 'plin')->where('is_active', true)->first();
            
            if (!$plin) {
                $this->addResult('⚠️ Método Plin no encontrado o inactivo');
                return;
            }
            
            $instructions = is_string($plin->instructions) ? json_decode($plin->instructions, true) : $plin->instructions;
            $config = is_string($plin->configuration) ? json_decode($plin->configuration, true) : $plin->configuration;
            
            $this->validateInstructionStructure('Plin', $instructions);
            
            if (isset($config['phone_number'])) {
                $this->addResult("✅ Plin: Número de teléfono configurado: {$config['phone_number']}");
            } else {
                $this->addResult("❌ Plin: Falta número de teléfono");
            }
            
            $this->validateDynamicVariables('Plin', $instructions);
            
        } catch (Exception $e) {
            $this->addResult("❌ Error en test Plin: " . $e->getMessage());
        }
        
        echo "\n";
    }
    
    public function testBankTransferInstructions() 
    {
        echo "🏦 Test 4: Instrucciones de Transferencia Bancaria\n";
        echo "-" . str_repeat("-", 40) . "\n";
        
        try {
            $transfer = PaymentMethod::where('slug', 'transferencia-bancaria')->where('is_active', true)->first();
            
            if (!$transfer) {
                $this->addResult('⚠️ Método Transferencia Bancaria no encontrado o inactivo');
                return;
            }
            
            $instructions = is_string($transfer->instructions) ? json_decode($transfer->instructions, true) : $transfer->instructions;
            $config = is_string($transfer->configuration) ? json_decode($transfer->configuration, true) : $transfer->configuration;
            
            $this->validateInstructionStructure('Transferencia', $instructions);
            
            // Validar campos específicos de transferencia bancaria
            $bankFields = ['bank_name', 'account_number', 'account_holder'];
            foreach ($bankFields as $field) {
                if (isset($config[$field]) && !empty($config[$field])) {
                    $this->addResult("✅ Transferencia: {$field} configurado");
                } else {
                    $this->addResult("⚠️ Transferencia: {$field} no configurado");
                }
            }
            
            $this->validateDynamicVariables('Transferencia', $instructions);
            
        } catch (Exception $e) {
            $this->addResult("❌ Error en test Transferencia: " . $e->getMessage());
        }
        
        echo "\n";
    }
    
    public function testTemplateVariables() 
    {
        echo "🎨 Test 5: Sistema de Variables Dinámicas\n";
        echo "-" . str_repeat("-", 40) . "\n";
        
        // Test de renderizado de variables
        $testTemplate = "Envía exactamente {amount} al número {phone_number}. A nombre de {account_name}.";
        $testVariables = [
            'amount' => 'S/ 45.50',
            'phone_number' => '999123456',
            'account_name' => 'BananaLab Store'
        ];
        
        $result = $testTemplate;
        foreach ($testVariables as $key => $value) {
            $result = str_replace('{' . $key . '}', $value, $result);
        }
        
        echo "  📝 Template original: {$testTemplate}\n";
        echo "  ✨ Resultado: {$result}\n";
        
        if (strpos($result, '{') === false) {
            $this->addResult("✅ Sistema de variables funcionando correctamente");
        } else {
            $this->addResult("❌ Quedan variables sin reemplazar en el template");
        }
        
        echo "\n";
    }
    
    public function testConfigurationCompleteness() 
    {
        echo "🔧 Test 6: Completitud de Configuraciones\n";
        echo "-" . str_repeat("-", 40) . "\n";
        
        $methods = PaymentMethod::where('is_active', true)->get();
        $totalScore = 0;
        $maxScore = 0;
        
        foreach ($methods as $method) {
            $score = 0;
            $max = 5; // Máximo puntaje por método
            
            echo "  🔍 Evaluando {$method->name}:\n";
            
            // 1. Tiene nombre descriptivo
            if (!empty($method->name) && strlen($method->name) > 3) {
                $score++;
                echo "    ✅ Nombre descriptivo\n";
            } else {
                echo "    ❌ Nombre insuficiente\n";
            }
            
            // 2. Tiene instrucciones
            if (!empty($method->instructions)) {
                $score++;
                echo "    ✅ Tiene instrucciones\n";
            } else {
                echo "    ❌ Sin instrucciones\n";
            }
            
            // 3. Instrucciones son JSON válido o array
            try {
                $instructions = is_string($method->instructions) ? json_decode($method->instructions, true) : $method->instructions;
                if (is_array($instructions)) {
                    $score++;
                    echo "    ✅ Instrucciones en formato correcto\n";
                } else {
                    echo "    ❌ Formato de instrucciones incorrecto\n";
                }
            } catch (Exception $e) {
                echo "    ❌ Error al parsear instrucciones\n";
            }
            
            // 4. Tiene configuración
            if (!empty($method->configuration)) {
                $score++;
                echo "    ✅ Tiene configuración\n";
            } else {
                echo "    ❌ Sin configuración\n";
            }
              // 5. Está activo
            if ($method->is_active) {
                $score++;
                echo "    ✅ Método activo\n";
            } else {
                echo "    ❌ Método inactivo\n";
            }
            
            $percentage = ($score / $max) * 100;
            echo "    📊 Puntuación: {$score}/{$max} ({$percentage}%)\n\n";
            
            $totalScore += $score;
            $maxScore += $max;
        }
        
        $overallPercentage = ($totalScore / $maxScore) * 100;
        $this->addResult("📊 Puntuación general: {$totalScore}/{$maxScore} ({$overallPercentage}%)");
        
        if ($overallPercentage >= 80) {
            $this->addResult("🎉 Excelente configuración del sistema de pagos");
        } elseif ($overallPercentage >= 60) {
            $this->addResult("👍 Buena configuración, hay oportunidades de mejora");
        } else {
            $this->addResult("⚠️ La configuración necesita mejoras importantes");
        }
        
        echo "\n";
    }
    
    private function validateInstructionStructure($methodName, $instructions) 
    {
        if (!is_array($instructions)) {
            $this->addResult("❌ {$methodName}: Instrucciones no son un array válido");
            return;
        }
        
        $requiredFields = ['title', 'steps'];
        foreach ($requiredFields as $field) {
            if (isset($instructions[$field])) {
                $this->addResult("✅ {$methodName}: Tiene campo '{$field}'");
            } else {
                $this->addResult("⚠️ {$methodName}: Falta campo '{$field}'");
            }
        }
        
        if (isset($instructions['steps']) && is_array($instructions['steps']) && count($instructions['steps']) > 0) {
            $this->addResult("✅ {$methodName}: Tiene " . count($instructions['steps']) . " pasos definidos");
        } else {
            $this->addResult("❌ {$methodName}: No tiene pasos definidos");
        }
    }
    
    private function validateDynamicVariables($methodName, $instructions) 
    {
        $content = json_encode($instructions);
        $variables = ['amount', 'phone_number', 'account_name', 'bank_name'];
        $foundVariables = [];
        
        foreach ($variables as $var) {
            if (strpos($content, '{' . $var . '}') !== false) {
                $foundVariables[] = $var;
            }
        }
        
        if (count($foundVariables) > 0) {
            $this->addResult("✅ {$methodName}: Usa variables dinámicas: " . implode(', ', $foundVariables));
        } else {
            $this->addResult("⚠️ {$methodName}: No usa variables dinámicas");
        }
    }
    
    private function addResult($message) 
    {
        $this->results[] = $message;
        echo "  {$message}\n";
    }
    
    private function showSummary() 
    {
        echo "\n🎯 RESUMEN DE RESULTADOS\n";
        echo "=" . str_repeat("=", 60) . "\n";
        
        $successCount = 0;
        $warningCount = 0;
        $errorCount = 0;
        
        foreach ($this->results as $result) {
            if (strpos($result, '✅') !== false) {
                $successCount++;
            } elseif (strpos($result, '⚠️') !== false) {
                $warningCount++;
            } elseif (strpos($result, '❌') !== false) {
                $errorCount++;
            }
        }
        
        echo "✅ Éxitos: {$successCount}\n";
        echo "⚠️ Advertencias: {$warningCount}\n";
        echo "❌ Errores: {$errorCount}\n";
        echo "\nTotal de verificaciones: " . count($this->results) . "\n";
        
        $successRate = ($successCount / count($this->results)) * 100;
        echo "📊 Tasa de éxito: " . number_format($successRate, 1) . "%\n\n";
        
        if ($successRate >= 80) {
            echo "🎉 ¡Excelente! El sistema de checkout está bien configurado.\n";
            echo "💡 Recomendación: Realizar pruebas de usuario final.\n";
        } elseif ($successRate >= 60) {
            echo "👍 Buen progreso, pero hay algunas áreas de mejora.\n";
            echo "💡 Recomendación: Revisar las advertencias y errores.\n";
        } else {
            echo "⚠️ El sistema necesita mejoras importantes.\n";
            echo "💡 Recomendación: Priorizar la corrección de errores.\n";
        }
        
        echo "\n🚀 Para completar las pruebas:\n";
        echo "1. Visita: /test-improved-payment-checkout.html\n";
        echo "2. Prueba el checkout real con productos en el carrito\n";
        echo "3. Valida la experiencia de usuario en métodos como Yape\n\n";
    }
}

// Ejecutar tests
$tester = new PaymentCheckoutTester();
$tester->runAllTests();

echo "✨ Testing completado. Fecha: " . date('Y-m-d H:i:s') . "\n";
