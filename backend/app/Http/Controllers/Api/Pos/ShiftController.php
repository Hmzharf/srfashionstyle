<?php
namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\CashierStaff;
use App\Models\PosShift;
use App\Models\PosTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShiftController extends Controller
{
    public function active(Request $request)
    {
        $shift = PosShift::with('cashierStaff')
            ->where('opened_by_user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest()->first();

        if (!$shift) {
            return response()->json(['success' => true, 'data' => null]);
        }

        $shift->total_transactions = $shift->transactions()->where('status','completed')->count();
        $shift->total_revenue = $shift->transactions()->where('status','completed')->sum('grand_total');

        return response()->json(['success' => true, 'data' => $shift]);
    }

    public function open(Request $request)
    {
        $validated = $request->validate([
            'cashier_staff_id' => 'required|integer|exists:cashier_staff,id',
            'opening_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $staff = CashierStaff::findOrFail($validated['cashier_staff_id']);
        if (!$staff->is_active) {
            return response()->json(['success' => false, 'message' => 'Kasir ini tidak aktif.'], 422);
        }

        $existingShift = PosShift::where('opened_by_user_id', $request->user()->id)
            ->where('status', 'open')->first();
        if ($existingShift) {
            return response()->json([
                'success' => false,
                'message' => 'Masih ada shift yang belum ditutup.',
                'data' => $existingShift->load('cashierStaff'),
            ], 422);
        }

        $shift = PosShift::create([
            'cashier_staff_id'  => $validated['cashier_staff_id'],
            'opened_by_user_id' => $request->user()->id,
            'shift_code'        => 'SHF-' . strtoupper(Str::random(8)),
            'opening_cash'      => $validated['opening_cash'],
            'status'            => 'open',
            'opened_at'         => now(),
            'notes'             => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift dibuka! Selamat bekerja, ' . $staff->name . '!',
            'data'    => $shift->load('cashierStaff'),
        ], 201);
    }

    public function close(Request $request)
    {
        $validated = $request->validate([
            'shift_id'     => 'required|integer|exists:pos_shifts,id',
            'closing_cash' => 'required|numeric|min:0',
            'notes'        => 'nullable|string',
        ]);

        $shift = PosShift::with(['cashierStaff','transactions'])
            ->where('id', $validated['shift_id'])
            ->where('opened_by_user_id', $request->user()->id)
            ->where('status', 'open')
            ->firstOrFail();

        $totalCashIn  = PosTransaction::where('pos_shift_id', $shift->id)->where('payment_method','cash')->where('status','completed')->sum('grand_total');
        $totalNonCash = PosTransaction::where('pos_shift_id', $shift->id)->whereIn('payment_method',['qris','transfer_bca','card'])->where('status','completed')->sum('grand_total');
        $cashDiff     = $validated['closing_cash'] - ($shift->opening_cash + $totalCashIn);

        $shift->update([
            'closing_cash'    => $validated['closing_cash'],
            'total_cash_in'   => $totalCashIn,
            'total_non_cash'  => $totalNonCash,
            'cash_difference' => $cashDiff,
            'status'          => 'closed',
            'closed_at'       => now(),
            'notes'           => $validated['notes'] ?? $shift->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil ditutup.',
            'data'    => [
                'shift'           => $shift->fresh()->load('cashierStaff', 'openedBy'),
                'total_transaksi' => PosTransaction::where('pos_shift_id',$shift->id)->where('status','completed')->count(),
                'total_revenue'   => PosTransaction::where('pos_shift_id',$shift->id)->where('status','completed')->sum('grand_total'),
                'total_cash_in'   => $totalCashIn,
                'total_non_cash'  => $totalNonCash,
                'opening_cash'    => $shift->opening_cash,
                'closing_cash'    => $validated['closing_cash'],
                'cash_difference' => $cashDiff,
                'selisih_status'  => $cashDiff == 0 ? 'Sesuai' : ($cashDiff > 0 ? 'Lebih' : 'Kurang'),
            ],
        ]);
    }

    public function history(Request $request)
    {
        $shifts = PosShift::with('cashierStaff')
            ->where('opened_by_user_id', $request->user()->id)
            ->orderBy('opened_at', 'desc')->paginate(10);
        return response()->json(['success' => true, 'data' => $shifts]);
    }

    public function adminIndex(Request $request)
    {
        $query = PosShift::with(['cashierStaff', 'openedBy']);
        if ($request->has('cashier_staff_id')) $query->where('cashier_staff_id', $request->cashier_staff_id);
        if ($request->has('status'))           $query->where('status', $request->status);
        if ($request->has('date'))             $query->whereDate('opened_at', $request->date);

        $shifts = $query->orderBy('opened_at', 'desc')->paginate(20);
        $shifts->getCollection()->transform(function ($shift) {
            $shift->total_transactions = $shift->transactions()->where('status','completed')->count();
            $shift->total_revenue      = $shift->transactions()->where('status','completed')->sum('grand_total');
            return $shift;
        });

        return response()->json(['success' => true, 'data' => $shifts]);
    }
}