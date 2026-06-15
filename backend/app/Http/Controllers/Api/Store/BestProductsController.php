<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BestProductsController extends Controller
{
    public function index(Request $request)
    {
        $limit = (int) $request->input('limit', 8);

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
            ->groupBy('pti.product_name')
            ->selectRaw('
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
            ->groupBy('oi.product_name')
            ->selectRaw('
                oi.product_name,
                SUM(oi.qty) as qty_online,
                SUM(oi.subtotal) as revenue_online
            ')
            ->get();

        $posByName = $posAgg->keyBy(function ($row) {
            return strtolower(trim((string) $row->product_name));
        });

        $onlineByName = $onlineAgg->keyBy(function ($row) {
            return strtolower(trim((string) $row->product_name));
        });

        $allKeys = $posByName->keys()
            ->merge($onlineByName->keys())
            ->unique();

        $top = $allKeys->map(function ($key) use ($posByName, $onlineByName) {
            $posRow = $posByName->get($key);
            $onlineRow = $onlineByName->get($key);

            $productName = $posRow->product_name ?? ($onlineRow->product_name ?? '-');
            $qtyPos = (int) ($posRow->qty_pos ?? 0);
            $qtyOnline = (int) ($onlineRow->qty_online ?? 0);
            $revenuePos = (float) ($posRow->revenue_pos ?? 0);
            $revenueOnline = (float) ($onlineRow->revenue_online ?? 0);

            return [
                'product_name' => $productName,
                'qty_total' => $qtyPos + $qtyOnline,
                'revenue_total' => $revenuePos + $revenueOnline,
            ];
        })
        ->sortByDesc('qty_total')
        ->take($limit)
        ->values();
        $results = $top->map(function ($item) {
            $product = Product::with('category')
                ->whereRaw('LOWER(name) = ?', [strtolower(trim($item['product_name']))])
                ->where('is_active', true)
                ->first();

            if (!$product) {
                return null;
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category->name ?? '-',
                'price' => (float) $product->base_price,
                'image' => $product->featured_image_url,
                'qty_total' => $item['qty_total'],
                'revenue_total' => $item['revenue_total'],
                'badge' => 'Terlaris',
            ];
        })->filter()->values();

        return response()->json($results);
    }
}