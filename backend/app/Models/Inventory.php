<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'stock_on_hand',
        'stock_reserved',
        'stock_available',
        'min_stock_alert',
    ];

    public function productVariant()
{
    return $this->belongsTo(ProductVariant::class, 'product_variant_id');
}
}