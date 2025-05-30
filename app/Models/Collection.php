<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'slug',
        'name',
        'description',
        'image',
        'featured',
        'visible',
        'status',
    ];

    public function categories()
    {
        return $this->hasMany(Category::class)->where('status', true);
    }
}
