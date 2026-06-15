<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosTransaction extends Model
{
    use HasFactory;
    protected $fillable = [
        'pos_shift_id', 'cashier_staff_id', 'transaction_code',
        'subtotal', 'discount', 'grand_total', 'payment_method',
        'cash_received', 'change_given', 'transfer_ref', 'status', 'notes',
    ];
    protected $casts = [
        'subtotal' => 'decimal:2', 'discount' => 'decimal:2',
        'grand_total' => 'decimal:2', 'cash_received' => 'decimal:2',
        'change_given' => 'decimal:2',
    ];

    public function cashierStaff()
{
    return $this->belongsTo(CashierStaff::class, 'cashier_staff_id');
}

public function shift()
{
    return $this->belongsTo(PosShift::class, 'pos_shift_id');
}
    public function items() { return $this->hasMany(PosTransactionItem::class); }
}