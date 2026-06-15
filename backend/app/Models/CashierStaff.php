<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashierStaff extends Model
{
    use HasFactory;
    protected $table = 'cashier_staff';
    protected $fillable = ['name', 'code', 'is_active', 'notes'];
    protected $casts = ['is_active' => 'boolean'];

public function shifts()
{
    return $this->hasMany(PosShift::class, 'cashier_staff_id');
}
public function transactions()
{
    return $this->hasMany(PosTransaction::class, 'cashier_staff_id');
}
    public function activeShift() {
        return $this->hasOne(PosShift::class)->where('status', 'open');
    }
}