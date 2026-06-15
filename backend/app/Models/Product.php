<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'base_price',
        'featured_image',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'base_price' => 'decimal:2',
    ];

    protected $appends = [
        'featured_image_url',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    protected function featuredImageUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->featured_image) {
                    return null;
                }

                if (
                    str_starts_with($this->featured_image, 'http://') ||
                    str_starts_with($this->featured_image, 'https://')
                ) {
                    return $this->featured_image;
                }

                return asset('storage/' . ltrim($this->featured_image, '/'));
            }
        );
    }
    public function images()
{
    return $this->hasMany(ProductImage::class)->orderBy('sort_order');
}
}