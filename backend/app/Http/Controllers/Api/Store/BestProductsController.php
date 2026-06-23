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

        // 1) Produk yang ditandai admin tampil lebih dulu (badge "Pilihan").
        $featured = Product::with('category')
            ->where('is_featured', true)
            ->where('is_active', true)
            ->latest()
            ->take($limit)
            ->get();

        $results = $featured->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category->name ?? '-',
                'price' => (float) $product->base_price,
                'image' => $product->featured_image_url,
                'badge' => 'Pilihan',
            ];
        })->values();

        // 2) Kalau slot masih kurang, isi sisanya dari produk terlaris.
        $remaining = $limit - $results->count();

        if ($remaining > 0) {
            $usedIds = $results->pluck('id')->all();

            $bestSelling = $this->bestSellingProducts($request, $remaining, $usedIds);

            $results = $results->concat($bestSelling)->values();
        }

        return response()->json($results);
    }

    /**
     * Ambil produk terlaris (gabungan POS + online), kecualikan ID yang sudah dipakai.
     */
    private function bestSellingProducts(Request $request, int $take, array $excludeIds)
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
            ->groupBy('pti.product_name')
            ->selectRaw('pti.product_name, SUM(pti.qty) as qty_pos')
            ->get();

        $onlineAgg = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->whereBetween('o.created_at', [$dateFrom, $dateTo])
            ->whereIn('o.status', ['completed', 'complete', 'selesai', 'done'])
            ->whereIn('o.payment_status', ['paid', 'settlement', 'success', 'lunas', 'berhasil'])
            ->whereNotIn('o.status', ['cancelled', 'canceled', 'dibatalkan'])
            ->groupBy('oi.product_name')
            ->selectRaw('oi.product_name, SUM(oi.qty) as qty_online')
            ->get();

        $posByName = $posAgg->keyBy(fn ($row) => strtolower(trim((string) $row->product_name)));
        $onlineByName = $onlineAgg->keyBy(fn ($row) => strtolower(trim((string) $row->product_name)));

        $allKeys = $posByName->keys()->merge($onlineByName->keys())->unique();

        $top = $allKeys->map(function ($key) use ($posByName, $onlineByName) {
            $posRow = $posByName->get($key);
            $onlineRow = $onlineByName->get($key);

            return [
                'product_name' => $posRow->product_name ?? ($onlineRow->product_name ?? '-'),
                'qty_total' => (int) ($posRow->qty_pos ?? 0) + (int) ($onlineRow->qty_online ?? 0),
            ];
        })
        ->sortByDesc('qty_total')
        ->values();

        $results = collect();

        foreach ($top as $item) {
            if ($results->count() >= $take) {
                break;
            }

            $product = Product::with('category')
                ->whereRaw('LOWER(name) = ?', [strtolower(trim($item['product_name']))])
                ->where('is_active', true)
                ->whereNotIn('id', $excludeIds)
                ->first();

            if (!$product) {
                continue;
            }

            $excludeIds[] = $product->id;

            $results->push([
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category->name ?? '-',
                'price' => (float) $product->base_price,
                'image' => $product->featured_image_url,
                'badge' => 'Terlaris',
            ]);
        }

        return $results;
    }
}
