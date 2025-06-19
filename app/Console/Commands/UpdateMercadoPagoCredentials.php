<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PaymentMethod;

class UpdateMercadoPagoCredentials extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update-mp-credentials 
                           {--public-key= : MercadoPago Public Key}
                           {--access-token= : MercadoPago Access Token}
                           {--sandbox=yes : Sandbox mode (yes/no)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update MercadoPago credentials with your real credentials';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 Actualizando credenciales de MercadoPago...');
        
        $mp = PaymentMethod::where('slug', 'mercadopago')->first();
        
        if (!$mp) {
            $this->error('❌ No se encontró MercadoPago en payment_methods');
            return;
        }
        
        // Mostrar credenciales actuales
        $currentConfig = is_array($mp->configuration) ? $mp->configuration : json_decode($mp->configuration, true);
        $this->info('📋 Credenciales actuales:');
        $this->line('Public Key: ' . substr($currentConfig['public_key'] ?? 'N/A', 0, 20) . '...');
        $this->line('Access Token: ' . substr($currentConfig['access_token'] ?? 'N/A', 0, 20) . '...');
        $this->line('Sandbox: ' . ($currentConfig['sandbox'] ? 'SÍ' : 'NO'));
        
        $this->newLine();
        
        // Obtener credenciales del usuario
        $publicKey = $this->option('public-key') ?: $this->ask('🔑 Ingresa tu MercadoPago Public Key');
        $accessToken = $this->option('access-token') ?: $this->secret('🔐 Ingresa tu MercadoPago Access Token');
        $sandboxInput = $this->option('sandbox') ?: $this->choice('🧪 ¿Usar modo sandbox?', ['yes', 'no'], 'yes');
        
        $sandbox = $sandboxInput === 'yes';
        
        if (!$publicKey || !$accessToken) {
            $this->error('❌ Public Key y Access Token son requeridos');
            return;
        }
        
        // Validar formato de credenciales
        $expectedPrefix = $sandbox ? 'TEST-' : 'APP_USR-';
        if (!str_starts_with($publicKey, $expectedPrefix) || !str_starts_with($accessToken, $expectedPrefix)) {
            $this->warn("⚠️  Las credenciales no tienen el prefijo esperado para modo " . ($sandbox ? 'sandbox (TEST-)' : 'producción (APP_USR-)'));
            if (!$this->confirm('¿Continuar de todos modos?')) {
                return;
            }
        }
        
        // Probar credenciales
        $this->info('🧪 Probando credenciales...');
        if (!$this->testCredentials($accessToken)) {
            $this->error('❌ Las credenciales no son válidas');
            if (!$this->confirm('¿Guardar de todos modos?')) {
                return;
            }
        } else {
            $this->info('✅ Credenciales válidas');
        }
        
        // Actualizar configuración
        $newConfig = array_merge($currentConfig, [
            'public_key' => $publicKey,
            'access_token' => $accessToken,
            'sandbox' => $sandbox,
            'success_url' => config('app.url') . '/checkout/success',
            'failure_url' => config('app.url') . '/checkout/failure',
            'pending_url' => config('app.url') . '/checkout/pending',
            'webhook_url' => config('app.url') . '/api/payments/mercadopago/webhook'
        ]);
        
        $mp->configuration = $newConfig;
        $mp->save();
        
        $this->newLine();
        $this->info('✅ Credenciales actualizadas exitosamente');
        $this->line('🔗 Public Key: ' . substr($publicKey, 0, 20) . '...');
        $this->line('🔐 Access Token: ' . substr($accessToken, 0, 20) . '...');
        $this->line('🧪 Sandbox: ' . ($sandbox ? 'SÍ' : 'NO'));
        
        $this->newLine();
        $this->info('🎉 ¡Ya puedes probar los pagos con MercadoPago!');
        
        if ($sandbox) {
            $this->comment('💳 Tarjetas de prueba para sandbox:');
            $this->line('   Visa: 4509 9535 6623 3704');
            $this->line('   Mastercard: 5031 7557 3453 0604');
            $this->line('   CVV: 123 | Vencimiento: cualquier fecha futura');
        }
    }
    
    /**
     * Test MercadoPago credentials
     */
    private function testCredentials($accessToken)
    {
        $url = 'https://api.mercadopago.com/v1/payment_methods';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 200;
    }
}
