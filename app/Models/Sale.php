<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'user_id',
        'name',
        'lastname',
        'fullname',
        'email',
        'phone',
        'country',
        'department',
        'province',
        'district',
        'ubigeo',
        'address',
        'number',
        'reference',
        'comment',
        'amount',
        'delivery',
        'status_id',
        'culqi_charge_id',
        'payment_status',
        'payment_method',
        'payment_method_id',
        'payment_fee',
        'payment_proof_path',
        'invoiceType',
        'documentType',
        'document',
        'businessName',
    ];

    public function details()
    {
        return $this->hasMany(SaleDetail::class);
    }
      public function status()
    {
        return $this->belongsTo(SaleStatus::class);
    }

    /**
     * Relación con el método de pago
     */
    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    /**
     * Obtener la URL del comprobante de pago
     */
    public function getPaymentProofUrlAttribute()
    {
        if (!$this->payment_proof_path) {
            return null;
        }
        
        return asset('storage/' . $this->payment_proof_path);
    }

    /**
     * Verificar si el pago está pendiente de verificación
     */
    public function isPendingVerification()
    {
        return $this->payment_status === 'pendiente_verificacion';
    }

    /**
     * Verificar si el pago está completo
     */
    public function isPaid()
    {
        return $this->payment_status === 'pagado';
    }
}
