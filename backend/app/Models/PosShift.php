<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosShift extends Model
{
    use HasFactory;
    protected $fillable = [
        'cashier_staff_id', 'opened_by_user_id', 'shift_code',
        'opening_cash', 'closing_cash', 'total_cash_in', 'total_non_cash',
        'cash_difference', 'status', 'opened_at', 'closed_at', 'notes',
    ];
    protected $casts = [
        'opening_cash' => 'decimal:2', 'closing_cash' => 'decimal:2',
        'total_cash_in' => 'decimal:2', 'total_non_cash' => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'opened_at' => 'datetime', 'closed_at' => 'datetime',
    ];

public function cashierStaff()
{
    return $this->belongsTo(CashierStaff::class, 'cashier_staff_id');
}
    public function openedBy() { return $this->belongsTo(User::class, 'opened_by_user_id'); }
    public function transactions() { return $this->hasMany(PosTransaction::class); }
}