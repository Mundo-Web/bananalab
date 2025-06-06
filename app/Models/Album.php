<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use SoDe\Extend\Crypto;

class Album extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'item_id',
        'item_preset_id',
        'title',
        'description',
        'cover_image_path',
        'selected_pages',
        'selected_cover_type',
        'selected_finish',
        'custom_options',
        'status',
    ];

    protected $casts = [
        'custom_options' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Crypto::randomUUID();
            }
        });
    }

    /**
     * Get the user that owns the album.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the item associated with the album.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get the item preset associated with the album.
     */
    public function itemPreset(): BelongsTo
    {
        return $this->belongsTo(ItemPreset::class);
    }
}
