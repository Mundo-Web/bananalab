<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleDetail extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'sale_id',
        'item_id',
        'name',
        'price',
        'quantity',
        'colors',
        // Campos específicos para álbumes personalizados
        'preset_id',
        'album_id',
        'album_data',
        'preset_data',
        'pdf_path',
        'design_notes',
    ];

    /**
     * Cast para campos JSON
     */
    protected $casts = [
        'album_data' => 'array',
        'preset_data' => 'array',
    ];

    /**
     * Relación con el preset (si existe)
     */
    public function preset()
    {
        return $this->belongsTo(\App\Models\Preset::class, 'preset_id');
    }

    /**
     * Relación con el álbum (si existe)
     */
    public function album()
    {
        return $this->belongsTo(\App\Models\Album::class, 'album_id');
    }

    /**
     * Obtener la URL del PDF generado
     */
    public function getPdfUrlAttribute()
    {
        if (!$this->pdf_path) {
            return null;
        }
        
        return asset('storage/' . $this->pdf_path);
    }

    /**
     * Verificar si es un álbum personalizado
     */
    public function isCustomAlbum()
    {
        return !empty($this->album_data) || !empty($this->preset_id);
    }
}
