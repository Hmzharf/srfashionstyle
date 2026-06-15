<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PosShift;
use App\Models\PosTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportsController extends Controller
{
    public function index(Request $request)
    {
        $dateFrom = $request->query('date_from')
            ? Carbon::parse($request->query('date_from'))->startOfDay()
            : Carbon::now()->startOfMonth();

        $dateTo = $request->query('date_to')
            ? Carbon::parse($request->query('date_to'))->endOfDay()
            : Carbon::now()->endOfDay();

        $onlineOrders = Order::query()
            ->with(['items'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->latest()
            ->get();

        $validOnlineOrders = $onlineOrders->filter(function ($order) {
            $status = strtolower((string) ($order->status ?? ''));
            $paymentStatus = strtolower((string) ($order->payment_status ?? ''));

            $isCompleted = in_array($status, ['completed', 'complete', 'selesai', 'done']);
            $isPaid = in_array($paymentStatus, ['paid', 'settlement', 'success', 'berhasil', 'lunas']);
            $isCancelled = in_array($status, ['cancelled', 'canceled', 'dibatalkan']);

            return !$isCancelled && $isCompleted && $isPaid;
        })->values();

        $posTransactions = PosTransaction::query()
            ->with(['items'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->where('status', 'completed')
            ->latest()
            ->get();

        $onlineRevenue = $validOnlineOrders->sum(function ($order) {
            return (float) ($order->grand_total ?? $order->total ?? 0);
        });

        $posRevenue = $posTransactions->sum(function ($trx) {
            return (float) ($trx->grand_total ?? 0);
        });

        $totalRevenue = $onlineRevenue + $posRevenue;

        $totalOrders = $onlineOrders->count();
        $completedPaidOrders = $validOnlineOrders->count();
        $totalPosTransactions = $posTransactions->count();

        $totalItemsSoldOnline = $validOnlineOrders->sum(function ($order) {
            return collect($order->items)->sum(function ($item) {
                return (int) ($item->qty ?? 0);
            });
        });

        $totalItemsSoldPos = $posTransactions->sum(function ($trx) {
            return collect($trx->items)->sum(function ($item) {
                return (int) ($item->qty ?? 0);
            });
        });

        $totalItemsSold = $totalItemsSoldOnline + $totalItemsSoldPos;

        $allRevenueTransactionsCount = $completedPaidOrders + $totalPosTransactions;
        $averageOrderValue = $allRevenueTransactionsCount > 0
            ? $totalRevenue / $allRevenueTransactionsCount
            : 0;

        $statusSummary = $onlineOrders
            ->groupBy(function ($order) {
                return $order->status ?? 'unknown';
            })
            ->map(function ($group) {
                return $group->count();
            });

        $posAgg = DB::table('pos_transaction_items as pti')
            ->join('pos_transactions as pt', 'pt.id', '=', 'pti.pos_transaction_id')
            ->whereBetween('pt.created_at', [$dateFrom, $dateTo])
            ->where('pt.status', 'completed')
            ->groupBy('pti.sku', 'pti.product_name')
            ->selectRaw('
                pti.sku,
                pti.product_name,
                SUM(pti.qty) as qty_pos,
                SUM(pti.subtotal) as revenue_pos
            ')
            ->get();

        $onlineAgg = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->whereBetween('o.created_at', [$dateFrom, $dateTo])
            ->whereIn('o.status', ['completed', 'complete', 'selesai', 'done'])
            ->whereIn('o.payment_status', ['paid', 'settlement', 'success', 'lunas', 'berhasil'])
            ->whereNotIn('o.status', ['cancelled', 'canceled', 'dibatalkan'])
            ->groupBy('oi.sku', 'oi.product_name')
            ->selectRaw('
                oi.sku,
                oi.product_name,
                SUM(oi.qty) as qty_online,
                SUM(oi.subtotal) as revenue_online
            ')
            ->get();

        $posBySku = $posAgg->keyBy(function ($row) {
            return $row->sku ?: ('name:' . strtolower((string) $row->product_name));
        });

        $onlineBySku = $onlineAgg->keyBy(function ($row) {
            return $row->sku ?: ('name:' . strtolower((string) $row->product_name));
        });

        $allKeys = $posBySku->keys()->merge($onlineBySku->keys())->unique();

        $topProducts = $allKeys->map(function ($key) use ($posBySku, $onlineBySku) {
            $posRow = $posBySku->get($key);
            $onlineRow = $onlineBySku->get($key);

            $productName = $posRow->product_name ?? ($onlineRow->product_name ?? '-');
            $sku = $posRow->sku ?? ($onlineRow->sku ?? '-');

            $qtyPos = (int) ($posRow->qty_pos ?? 0);
            $qtyOnline = (int) ($onlineRow->qty_online ?? 0);
            $revenuePos = (float) ($posRow->revenue_pos ?? 0);
            $revenueOnline = (float) ($onlineRow->revenue_online ?? 0);

            return [
                'sku_key' => $key,
                'product_name' => $productName,
                'sku' => $sku,
                'qty_pos' => $qtyPos,
                'qty_online' => $qtyOnline,
                'qty_total' => $qtyPos + $qtyOnline,
                'revenue_pos' => $revenuePos,
                'revenue_online' => $revenueOnline,
                'revenue_total' => $revenuePos + $revenueOnline,
            ];
        })
        ->sortByDesc('qty_total')
        ->take(5)
        ->values();

        $lastShifts = PosShift::query()
            ->whereNotNull('closed_at')
            ->with('cashierStaff')
            ->orderByDesc('closed_at')
            ->limit(5)
            ->get()
            ->map(function (PosShift $shift) {
                return [
                    'shift_code' => $shift->shift_code,
                    'cashier_name' => optional($shift->cashierStaff)->name,
                    'opened_at' => $shift->opened_at ? $shift->opened_at->toIso8601String() : null,
                    'closed_at' => $shift->closed_at ? $shift->closed_at->toIso8601String() : null,
                    'revenue_pos' => ($shift->total_cash_in ?? 0) + ($shift->total_non_cash ?? 0),
                    'cash_difference' => $shift->cash_difference ?? 0,
                ];
            })
            ->values();

        $transactions = collect()
            ->merge($onlineOrders->map(function ($order) {
                $status = strtolower((string) ($order->status ?? ''));
                $paymentStatus = strtolower((string) ($order->payment_status ?? ''));

                $countsAsRevenue = in_array($status, ['completed', 'complete', 'selesai', 'done'])
                    && in_array($paymentStatus, ['paid', 'settlement', 'success', 'berhasil', 'lunas'])
                    && !in_array($status, ['cancelled', 'canceled', 'dibatalkan']);

                return [
                    'source' => 'online',
                    'id' => $order->id,
                    'order_code' => $order->order_code,
                    'customer_name' => $order->customer_name,
                    'email' => $order->email,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'grand_total' => (float) ($order->grand_total ?? $order->total ?? 0),
                    'counts_as_revenue' => $countsAsRevenue,
                    'created_at' => optional($order->created_at)->toDateTimeString(),
                ];
            }))
            ->merge($posTransactions->map(function ($trx) {
                return [
                    'source' => 'pos',
                    'id' => $trx->id,
                    'order_code' => $trx->transaction_code ?? ('POS-' . $trx->id),
                    'customer_name' => $trx->customer_name ?? 'Walk-in Customer',
                    'email' => null,
                    'status' => $trx->status,
                    'payment_status' => 'paid',
                    'grand_total' => (float) ($trx->grand_total ?? 0),
                    'counts_as_revenue' => true,
                    'created_at' => optional($trx->created_at)->toDateTimeString(),
                ];
            }))
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_sales' => $totalRevenue,
                'online_revenue' => $onlineRevenue,
                'pos_revenue' => $posRevenue,
                'total_orders' => $totalOrders,
                'completed_paid_orders' => $completedPaidOrders,
                'total_pos_transactions' => $totalPosTransactions,
                'total_items_sold' => $totalItemsSold,
                'average_order_value' => $averageOrderValue,
            ],
            'top_products' => $topProducts,
            'status_summary' => $statusSummary,
            'last_shifts' => $lastShifts,
            'transactions' => $transactions,
            'filters' => [
                'date_from' => $dateFrom->toDateString(),
                'date_to' => $dateTo->toDateString(),
                'revenue_rule' => 'Revenue = online completed+paid + POS completed',
                'top_products_rule' => 'Top products digabung dari POS + online berdasarkan SKU, fallback product_name',
                'generated_at' => Carbon::now()->toDateTimeString(),
            ],
        ]);
    }
}
