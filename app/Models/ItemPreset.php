<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ItemPreset extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';    protected $fillable = [
        'item_id',
        'name',
        'description',
        'price',
        'discount',
        'configuration',
        'image',
        'cover_image',
        'content_layer_image',
        'final_layer_image',
        'cover_layer_config',
        'content_layer_config',
        'final_layer_config',
        'canvas_config',
        'preview_image',
        'is_active',
        'sort_order',
        'pages_options',
        'default_pages',
        'cover_options',
        'default_cover',
        'finish_options',
        'default_finish'
    ];    protected $casts = [
        'price' => 'decimal:2',
        'discount' => 'decimal:2',
        'configuration' => 'array',
        'cover_layer_config' => 'array',
        'content_layer_config' => 'array',
        'final_layer_config' => 'array',
        'canvas_config' => 'array',
        'pages_options' => 'array',
        'cover_options' => 'array',
        'finish_options' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * Relación con Item
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Calcular precio final con descuento
     */
    public function getFinalPriceAttribute(): float
    {
        return $this->price - ($this->price * ($this->discount / 100));
    }

    /**
     * Scope para obtener solo presets activos
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
     * Obtener URL completa de la imagen de portada
     */
    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_image ? url('images/' . $this->cover_image) : null;
    }

    /**
     * Obtener URL completa de la imagen del layer de contenido
     */
    public function getContentLayerImageUrlAttribute(): ?string
    {
        return $this->content_layer_image ? url('images/' . $this->content_layer_image) : null;
    }

    /**
     * Obtener URL completa de la imagen del layer final
     */
    public function getFinalLayerImageUrlAttribute(): ?string
    {
        return $this->final_layer_image ? url('images/' . $this->final_layer_image) : null;
    }

    /**
     * Obtener URL completa de la imagen de vista previa
     */
    public function getPreviewImageUrlAttribute(): ?string
    {
        return $this->preview_image ? url('images/' . $this->preview_image) : null;
    }

    /**
     * Obtener configuración completa del canvas con valores por defecto
     */
    public function getCanvasConfigurationAttribute(): array
    {
        $default = [
            'width' => 1000,
            'height' => 1000,
            'dpi' => 300,
            'background_color' => '#ffffff',
            'format' => 'JPEG',
            'quality' => 90
        ];

        return array_merge($default, $this->canvas_config ?? []);
    }

    /**
     * Obtener configuración del layer de contenido con valores por defecto
     */
    public function getContentAreaConfigurationAttribute(): array
    {
        $default = [
            'x' => 0,
            'y' => 0,
            'width' => 1000,
            'height' => 1000,
            'rotation' => 0,
            'opacity' => 1,
            'blend_mode' => 'normal',
            'fit_mode' => 'cover', // cover, contain, fill, none
            'allow_upload' => true,
            'max_file_size' => 10, // MB
            'allowed_formats' => ['jpg', 'jpeg', 'png', 'gif']
        ];

        return array_merge($default, $this->content_layer_config ?? []);
    }

    /**
     * Obtener configuración del layer de portada con valores por defecto
     */
    public function getCoverLayerConfigurationAttribute(): array
    {
        $default = [
            'x' => 0,
            'y' => 0,
            'width' => 1000,
            'height' => 1000,
            'rotation' => 0,
            'opacity' => 1,
            'blend_mode' => 'normal',
            'z_index' => 0
        ];

        return array_merge($default, $this->cover_layer_config ?? []);
    }

    /**
     * Obtener configuración del layer final con valores por defecto
     */
    public function getFinalLayerConfigurationAttribute(): array
    {
        $default = [
            'x' => 0,
            'y' => 0,
            'width' => 1000,
            'height' => 1000,
            'rotation' => 0,
            'opacity' => 1,
            'blend_mode' => 'normal',
            'z_index' => 100
        ];

        return array_merge($default, $this->final_layer_config ?? []);
    }

    /**
     * Obtener todas las capas en el orden correcto
     */
    public function getLayersAttribute(): array
    {
        return [
            'cover' => [
                'image' => $this->cover_image_url,
                'config' => $this->cover_layer_configuration
            ],
            'content' => [
                'image' => $this->content_layer_image_url,
                'config' => $this->content_area_configuration
            ],
            'final' => [
                'image' => $this->final_layer_image_url,
                'config' => $this->final_layer_configuration
            ]
        ];
    }

    /**
     * Verificar si el preset está completamente configurado
     */
    public function getIsCompleteAttribute(): bool
    {
        return !empty($this->cover_image) && 
               !empty($this->content_layer_config) && 
               !empty($this->canvas_config);
    }

    /**
     * Generar configuración de ejemplo para el editor
     */
    public function getEditorConfigAttribute(): array
    {
        return [
            'canvas' => $this->canvas_configuration,
            'layers' => $this->layers,
            'preset_id' => $this->id,
            'preset_name' => $this->name,
            'price' => $this->final_price,
            'preview' => $this->preview_image_url
        ];
    }
}
