<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TopProductsController extends Controller
{
    public function index(Request $request)
    {
        $dateFrom = $request->input('date_from')
            ? Carbon::parse($request->input('date_from'))->startOfDay()
            : Carbon::now()->startOfMonth();

        $dateTo = $request->input('date_to')
            ? Carbon::parse($request->input('date_to'))->endOfDay()
            : Carbon::now()->endOfDay();

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

        $allKeys = $posBySku->keys()
            ->merge($onlineBySku->keys())
            ->unique();

        $top = $allKeys->map(function ($key) use ($posBySku, $onlineBySku) {
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
        ->values();

        return response()->json($top);
    }
}
