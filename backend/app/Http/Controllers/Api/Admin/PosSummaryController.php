<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PosShift;
use App\Models\PosTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PosSummaryController extends Controller
{
    public function index(Request $request)
    {
        $dateFrom = $request->input('date_from')
            ? Carbon::parse($request->input('date_from'))->startOfDay()
            : Carbon::now()->startOfMonth();

        $dateTo = $request->input('date_to')
            ? Carbon::parse($request->input('date_to'))->endOfDay()
            : Carbon::now()->endOfDay();

        // Revenue memperhitungkan transaksi 'completed' (positif) DAN 'refunded'
        // (bernilai negatif) agar refund otomatis mengurangi pendapatan.
        $transactionsQuery = PosTransaction::query()
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->whereIn('status', ['completed', 'refunded']);

        // Jumlah transaksi hanya menghitung penjualan asli (tanpa baris refund).
        $transactionsCount = (clone $transactionsQuery)
            ->where('status', 'completed')
            ->count();
        $revenuePos = (clone $transactionsQuery)->sum('grand_total');

        $revenueCash = (clone $transactionsQuery)
            ->where('payment_method', 'cash')
            ->sum('grand_total');

        $revenueNonCash = $revenuePos - $revenueCash;

        // Tren per minggu dalam bulan: Minggu 1, 2, 3, 4, 5
        $weeklyBuckets = [
            1 => 0,
            2 => 0,
            3 => 0,
            4 => 0,
            5 => 0,
        ];

        // Tren mingguan hanya menghitung transaksi penjualan asli (tanpa refund).
        $transactions = (clone $transactionsQuery)
            ->where('status', 'completed')
            ->get(['created_at']);

        foreach ($transactions as $trx) {
            $day = (int) $trx->created_at->day;
            $weekOfMonth = (int) ceil($day / 7);
            $weekOfMonth = max(1, min(5, $weekOfMonth));

            $weeklyBuckets[$weekOfMonth]++;
        }

        $dailyTransactions = collect($weeklyBuckets)
            ->map(function ($total, $week) {
                return [
                    'week' => 'Minggu ' . $week,
                    'total' => (int) $total,
                ];
            })
            ->filter(function ($item) {
                return $item['total'] > 0;
            })
            ->values();

        $activeShift = PosShift::query()
            ->whereNull('closed_at')
            ->with('cashierStaff')
            ->latest('opened_at')
            ->first();

        $activeShiftData = $activeShift
            ? [
                'shift_code' => $activeShift->shift_code,
                'cashier_name' => optional($activeShift->cashierStaff)->name,
                'opened_at' => $activeShift->opened_at
                    ? $activeShift->opened_at->toIso8601String()
                    : null,
                'closed_at' => $activeShift->closed_at
                    ? $activeShift->closed_at->toIso8601String()
                    : null,
                'revenue_pos' => ($activeShift->total_cash_in ?? 0) + ($activeShift->total_non_cash ?? 0),
                'cash_difference' => $activeShift->cash_difference ?? 0,
            ]
            : null;

        $data = [
            'period' => [
                'date_from' => $dateFrom->toDateString(),
                'date_to' => $dateTo->toDateString(),
            ],
            'pos_totals' => [
                'transactions_count' => $transactionsCount,
                'revenue_pos' => $revenuePos,
                'revenue_cash' => $revenueCash,
                'revenue_non_cash' => $revenueNonCash,
            ],
            'active_shift' => $activeShiftData,
            'daily_transactions' => $dailyTransactions,
        ];

        return response()->json($data);
    }
}