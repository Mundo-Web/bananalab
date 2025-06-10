<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;    protected $fillable = [
        'name',
        'slug',
        'display_name',
        'description',
        'icon',
        'type',
        'template_key',
        'is_active',
        'requires_proof',
        'fee_percentage',
        'fee_fixed',
        'configuration',
        'instructions',
        'sort_order'
    ];

    protected $casts = [
        'configuration' => 'array',
        'instructions' => 'array',
        'is_active' => 'boolean',
        'requires_proof' => 'boolean',
        'fee_percentage' => 'decimal:2',
        'fee_fixed' => 'decimal:2'
    ];

    /**
     * Scope para métodos activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para ordenar por sort_order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Obtener métodos activos ordenados
     */
    public static function getActiveOrdered()
    {
        return self::active()->ordered()->get();
    }

    /**
     * Calcular comisión para un monto
     */
    public function calculateFee($amount)
    {
        $percentageFee = ($amount * $this->fee_percentage) / 100;
        $totalFee = $percentageFee + $this->fee_fixed;
        
        return round($totalFee, 2);
    }

    /**
     * Obtener configuración específica
     */
    public function getConfig($key, $default = null)
    {
        return data_get($this->configuration, $key, $default);
    }

    /**
     * Verificar si es un método manual
     */
    public function isManual()
    {
        return in_array($this->type, ['manual', 'qr']);
    }

    /**
     * Verificar si es un gateway de pago
     */
    public function isGateway()
    {
        return $this->type === 'gateway';
    }

    /**
     * Obtener instrucciones formateadas
     */
    public function getFormattedInstructions($amount = null)
    {
        if (!$this->instructions) {
            return [];
        }

        $instructions = $this->instructions;
        
        // Reemplazar placeholders si se proporciona un monto
        if ($amount) {
            $fee = $this->calculateFee($amount);
            $totalAmount = $amount + $fee;
            
            array_walk_recursive($instructions, function (&$value) use ($amount, $fee, $totalAmount) {
                if (is_string($value)) {
                    $value = str_replace(
                        ['{amount}', '{fee}', '{total_amount}'],
                        [$amount, $fee, $totalAmount],
                        $value
                    );
                }
            });
        }

        return $instructions;
    }

    /**
     * Obtener URL del icono
     */
    public function getIconUrl()
    {
        if (!$this->icon) {
            return null;
        }

        if (str_starts_with($this->icon, 'http')) {
            return $this->icon;
        }

        return asset('storage/payment_icons/' . $this->icon);
    }

    /**
     * Validar configuración según el tipo
     */
    public function validateConfiguration()
    {
        $config = $this->configuration ?? [];
        $errors = [];

        switch ($this->type) {
            case 'gateway':
                if ($this->slug === 'culqi') {
                    if (empty($config['public_key'])) {
                        $errors[] = 'La clave pública de Culqi es requerida';
                    }
                    if (empty($config['secret_key'])) {
                        $errors[] = 'La clave secreta de Culqi es requerida';
                    }
                } elseif ($this->slug === 'mercadopago') {
                    if (empty($config['access_token'])) {
                        $errors[] = 'El access token de MercadoPago es requerido';
                    }
                    if (empty($config['public_key'])) {
                        $errors[] = 'La clave pública de MercadoPago es requerida';
                    }
                }
                break;

            case 'manual':
                if ($this->slug === 'transferencia') {
                    if (empty($config['bank_name'])) {
                        $errors[] = 'El nombre del banco es requerido';
                    }
                    if (empty($config['account_number'])) {
                        $errors[] = 'El número de cuenta es requerido';
                    }
                    if (empty($config['account_holder'])) {
                        $errors[] = 'El titular de la cuenta es requerido';
                    }
                }
                break;

            case 'qr':
                if ($this->slug === 'yape') {
                    if (empty($config['phone_number']) && empty($config['qr_code'])) {
                        $errors[] = 'Se requiere número de teléfono o código QR';
                    }
                }
                break;
        }

        return $errors;
    }
}
