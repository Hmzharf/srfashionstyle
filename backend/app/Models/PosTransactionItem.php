<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosTransactionItem extends Model
{
    protected $fillable = [
        'pos_transaction_id', 'product_variant_id', 'product_name',
        'sku', 'color', 'size', 'price', 'qty', 'subtotal',
    ];
    protected $casts = ['price' => 'decimal:2', 'subtotal' => 'decimal:2'];
    
    public function transaction() { return $this->belongsTo(PosTransaction::class, 'pos_transaction_id'); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'product_variant_id'); }
}