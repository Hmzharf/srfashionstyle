<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashierStaff;
use App\Models\PosShift;
use App\Models\PosTransaction;
use Illuminate\Http\Request;

class CashierStaffAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = CashierStaff::query();

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($isActive)) {
                $query->where('is_active', $isActive);
            }
        }

        $staffs = $query
            ->withCount([
                'shifts',
                'transactions',
                'shifts as open_shifts_count' => function ($q) {
                    $q->where('status', 'open');
                },
                'shifts as closed_shifts_count' => function ($q) {
                    $q->where('status', 'closed');
                },
            ])
            ->withSum('transactions', 'grand_total')
            ->orderBy('name')
            ->get()
            ->map(function ($staff) {
                return [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'code' => $staff->code,
                    'is_active' => $staff->is_active,
                    'notes' => $staff->notes,
                    'shifts_count' => (int) $staff->shifts_count,
                    'transactions_count' => (int) $staff->transactions_count,
                    'open_shifts_count' => (int) $staff->open_shifts_count,
                    'closed_shifts_count' => (int) $staff->closed_shifts_count,
                    'total_revenue' => (float) ($staff->transactions_sum_grand_total ?? 0),
                    'created_at' => $staff->created_at,
                    'updated_at' => $staff->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data karyawan kasir berhasil diambil.',
            'data' => $staffs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:cashier_staff,code',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $staff = CashierStaff::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'is_active' => $validated['is_active'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Karyawan kasir berhasil ditambahkan.',
            'data' => $staff,
        ], 201);
    }

    public function show($id)
    {
        $staff = CashierStaff::withCount([
                'shifts',
                'transactions',
                'shifts as open_shifts_count' => function ($q) {
                    $q->where('status', 'open');
                },
                'shifts as closed_shifts_count' => function ($q) {
                    $q->where('status', 'closed');
                },
            ])
            ->withSum('transactions', 'grand_total')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail karyawan kasir berhasil diambil.',
            'data' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'code' => $staff->code,
                'is_active' => $staff->is_active,
                'notes' => $staff->notes,
                'shifts_count' => (int) $staff->shifts_count,
                'transactions_count' => (int) $staff->transactions_count,
                'open_shifts_count' => (int) $staff->open_shifts_count,
                'closed_shifts_count' => (int) $staff->closed_shifts_count,
                'total_revenue' => (float) ($staff->transactions_sum_grand_total ?? 0),
                'created_at' => $staff->created_at,
                'updated_at' => $staff->updated_at,
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $staff = CashierStaff::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:20|unique:cashier_staff,code,' . $staff->id,
            'is_active' => 'sometimes|boolean',
            'notes' => 'nullable|string',
        ]);

        $staff->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Karyawan kasir berhasil diperbarui.',
            'data' => $staff,
        ]);
    }

    public function destroy($id)
    {
        $staff = CashierStaff::findOrFail($id);

        $hasOpenShift = $staff->shifts()->where('status', 'open')->exists();
        if ($hasOpenShift) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir masih memiliki shift yang sedang berjalan.',
            ], 422);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => 'Karyawan kasir berhasil dihapus.',
        ]);
    }

    public function shifts($id, Request $request)
    {
        $staff = CashierStaff::findOrFail($id);

        $query = PosShift::with(['openedBy:id,name'])
            ->withCount('transactions')
            ->withSum('transactions', 'grand_total')
            ->where('cashier_staff_id', $staff->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shifts = $query
            ->orderByDesc('opened_at')
            ->get()
            ->map(function ($shift) {
                return [
                    'id' => $shift->id,
                    'shift_code' => $shift->shift_code,
                    'status' => $shift->status,
                    'opening_cash' => (float) $shift->opening_cash,
                    'closing_cash' => (float) ($shift->closing_cash ?? 0),
                    'total_cash_in' => (float) ($shift->total_cash_in ?? 0),
                    'total_non_cash' => (float) ($shift->total_non_cash ?? 0),
                    'cash_difference' => (float) ($shift->cash_difference ?? 0),
                    'opened_at' => $shift->opened_at,
                    'closed_at' => $shift->closed_at,
                    'notes' => $shift->notes,
                    'opened_by' => $shift->openedBy?->name,
                    'transactions_count' => (int) $shift->transactions_count,
                    'shift_revenue' => (float) ($shift->transactions_sum_grand_total ?? 0),
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data shift kasir berhasil diambil.',
            'data' => $shifts,
        ]);
    }

    public function transactions($id, Request $request)
    {
        $staff = CashierStaff::findOrFail($id);

        $query = PosTransaction::with(['shift:id,shift_code,status,opened_at,closed_at'])
            ->where('cashier_staff_id', $staff->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $transactions = $query
            ->orderByDesc('id')
            ->get()
            ->map(function ($trx) {
                return [
                    'id' => $trx->id,
                    'transaction_code' => $trx->transaction_code,
                    'status' => $trx->status,
                    'payment_method' => $trx->payment_method,
                    'subtotal' => (float) $trx->subtotal,
                    'discount' => (float) $trx->discount,
                    'grand_total' => (float) $trx->grand_total,
                    'cash_received' => (float) ($trx->cash_received ?? 0),
                    'change_given' => (float) ($trx->change_given ?? 0),
                    'transfer_ref' => $trx->transfer_ref,
                    'notes' => $trx->notes,
                    'shift' => $trx->shift,
                    'created_at' => $trx->created_at,
                    'updated_at' => $trx->updated_at,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Data transaksi kasir berhasil diambil.',
            'data' => $transactions,
        ]);
    }

public function summary()
{
    $totalStaff = CashierStaff::count();
    $activeStaff = CashierStaff::where('is_active', true)->count();
    $inactiveStaff = CashierStaff::where('is_active', false)->count();
    $openShiftCount = PosShift::where('status', 'open')->count();
    $closedShiftCount = PosShift::where('status', 'closed')->count();
    // Jumlah transaksi hanya penjualan asli; revenue net (completed + refunded negatif).
    $totalTransactions = PosTransaction::where('status', 'completed')->count();
    $totalRevenue = (float) PosTransaction::whereIn('status', ['completed', 'refunded'])->sum('grand_total');

    return response()->json([
        'success' => true,
        'data' => [
            'total_staff' => $totalStaff,
            'active_staff' => $activeStaff,
            'inactive_staff' => $inactiveStaff,
            'open_shift_count' => $openShiftCount,
            'closed_shift_count' => $closedShiftCount,
            'total_transactions' => $totalTransactions,
            'total_revenue' => $totalRevenue,
        ],
    ]);
}
}