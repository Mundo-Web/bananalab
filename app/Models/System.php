<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class System extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'page_id',
        'after_component',
        'component',
        'value',
        'data',
        'filters',
        'visible'
    ];

    protected $casts = [
        'data' => 'array',
        'filters' => 'array'
    ];

    public function after()
    {
        return $this->hasOne(System::class, 'id', 'after_component');
    }
}
