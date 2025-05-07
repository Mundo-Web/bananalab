<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    use HasFactory, HasUuids;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'image',
        'alt_text',
        'target_url',
        'start_date',
        'end_date',
        'visible',
        'status',
        'schedule',
        'priority',
    ];

    protected $casts = [
        'schedule' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];
}
