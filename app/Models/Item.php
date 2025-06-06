<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Item extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'slug',
        'name',
        'summary',
        'description',
        'price',
        'discount',
        'final_price',
        'discount_percent',
        'banner',
        'image',
        'category_id',
        'collection_id',
        'subcategory_id',
        'brand_id',
        'is_new',
        'offering',
        'recommended',
        'featured',
        'visible',
        'status',
        'sku',
        'stock',
        'color',
        'texture'

    ];

    static function getForeign(Builder $builder, string $model, $relation)
    {
        $table = (new $model)->getTable();
        return $builder->reorder()
            ->join($table, $table . '.id', '=', 'items.' . $relation)
            ->select($table . '.*')
            ->distinct()
            ->orderBy($table . '.name', 'ASC')
            ->get()
            ->map(function ($item) use ($model) {
                $jpa = new $model((array) $item->toArray());
                $jpa->id = $item->id;
                return $jpa;
            });
    }

    static function getForeignMany(Builder $builder, string $through, string $model)
    {
        $table = (new $model)->getTable();
        $tableThrough = (new $through)->getTable();
        return $builder->reorder()
            ->join($tableThrough, $tableThrough . '.item_id', '=', 'items.id')
            ->join($table, $table . '.id', $tableThrough . '.tag_id')
            ->select($table . '.*')
            ->distinct()
            ->orderBy($table . '.name', 'ASC')
            ->get()
            ->map(function ($item) use ($model) {
                $jpa = new $model((array) $item->toArray());
                $jpa->id = $item->id;
                return $jpa;
            });
    }

    public function collection()
    {
        return $this->hasOne(Collection::class, 'id', 'collection_id');
    }

    public function category()
    {
        return $this->hasOne(Category::class, 'id', 'category_id');
    }

    public function subcategory()
    {
        return $this->hasOne(SubCategory::class, 'id', 'subcategory_id');
    }

    public function brand()
    {
        return $this->hasOne(Brand::class, 'id', 'brand_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'item_tags', 'item_id', 'tag_id');
    }

    public function combos()
    {

        return $this->belongsToMany(Combo::class, 'combo_items')->withPivot('is_main_item');
    }

    public function images()
    {
        return $this->hasMany(ItemImage::class);
    }

    public function specifications()
    {
        return $this->hasMany(ItemSpecification::class);
    }

    public function features()
    {
        return $this->hasMany(ItemFeature::class);
    }

    public function campaigns()
    {
        return $this->belongsToMany(Campaign::class);
    }

    protected static function booted()
    {
        static::creating(function ($item) {
            if (empty($item->sku)) {
                $item->sku = 'PROD-' . strtoupper(substr($item->categoria_id, 0, 3)) . '-' . strtoupper(substr($item->name, 0, 3)) . '-' . uniqid();
            }
        });
    }


    // Método para obtener variantes del mismo producto (mismo nombre)

    // En tu modelo Item.php
    public function variants()
    {
        return $this->hasMany(Item::class, 'name', 'name')
            ->where('id', '!=', $this->id)
            ->select(['id', 'slug', 'name', 'color', 'texture', 'image', 'final_price']);
    }

    // Scope para obtener un producto representante de cada grupo
    public function scopeGroupRepresentatives($query)
    {
        return $query->select('items.*')
            ->join(
                DB::raw('(SELECT MIN(id) as min_id FROM items GROUP BY name) as grouped'),
                function ($join) {
                    $join->on('items.id', '=', 'grouped.min_id');
                }
            );
    }

    // En tu modelo Item.php
    public function getVariantsAttribute()
    {
        return self::where('name', $this->name)
            ->where('id', '!=', $this->id)
            ->get(['id', 'color', 'texture', 'slug', 'image']);
    }

    /**
     * Relación con ItemPreset (uno a muchos)
     */
    public function presets()
    {
        return $this->hasMany(ItemPreset::class)->ordered();
    }

    /**
     * Relación con presets activos
     */
    public function activePresets()
    {
        return $this->hasMany(ItemPreset::class)->active()->ordered();
    }
}
