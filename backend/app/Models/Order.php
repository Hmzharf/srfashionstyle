<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'order_code',
        'customer_name',
        'email',
        'phone',
        'address',
        'city',
        'postal_code',
        'payment_method',
        'payment_status',
        'payment_gateway',
        'payment_reference',
        'paid_at',
        'shipping_method',
        'shipping_service_code',
        'shipping_label',
        'shipping_status',
        'biteship_order_id',
        'tracking_id',
        'waybill_id',
        'notes',
        'subtotal',
        'shipping_cost',
        'grand_total',
        'status',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}