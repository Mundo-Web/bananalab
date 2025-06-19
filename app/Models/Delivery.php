<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'sale_id',
        'recipient_name',
        'recipient_email',
        'recipient_phone',
        'address',
        'reference',
        'department',
        'province',
        'district',
        'country',
        'shipping_cost',
        'status',
        'tracking_number',
        'delivery_date',
        'notes'
    ];

    protected $casts = [
        'shipping_cost' => 'decimal:2',
        'delivery_date' => 'datetime'
    ];

    /**
     * Relación con Sale
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
