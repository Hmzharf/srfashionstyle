<?php

namespace App\Http\Controllers\Api;

use App\Exports\AllDataReportExport;
use App\Exports\OrdersReportExport;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function orders(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $status = $request->query('status');
        $paymentStatus = $request->query('payment_status');

        $orders = Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($paymentStatus, fn ($q) => $q->where('payment_status', $paymentStatus))
            ->latest()
            ->paginate(20);

        return response()->json([
            'message' => 'Laporan order berhasil dimuat.',
            'data' => $orders,
            'filters' => [
                'from' => $from,
                'to' => $to,
                'status' => $status,
                'payment_status' => $paymentStatus,
            ],
        ]);
    }

    public function exportOrdersExcel(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $status = $request->query('status');
        $paymentStatus = $request->query('payment_status');

        $filename = 'laporan-orders-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(
            new OrdersReportExport($from, $to, $status, $paymentStatus),
            $filename
        );
    }

    public function exportOrdersPdf(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $status = $request->query('status');
        $paymentStatus = $request->query('payment_status');

        $orders = Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($paymentStatus, fn ($q) => $q->where('payment_status', $paymentStatus))
            ->latest()
            ->get();

        $pdf = Pdf::loadView('reports.orders-pdf', [
            'orders' => $orders,
            'from' => $from,
            'to' => $to,
            'status' => $status,
            'paymentStatus' => $paymentStatus,
            'printedAt' => now()->format('d-m-Y H:i:s'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('laporan-orders-' . now()->format('Ymd-His') . '.pdf');
    }

    public function exportAllExcel()
    {
        $filename = 'laporan-semua-data-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(new AllDataReportExport(), $filename);
    }

public function exportAllPdf()
{
    $orders = Order::latest()->get();

    $products = Product::query()
        ->with([
            'variants:id,product_id,sku,color,size,price,is_active',
            'variants.inventory:id,product_variant_id,stock_on_hand,stock_reserved,stock_available,min_stock_alert',
        ])
        ->latest()
        ->get();

    $categories = Category::latest()->get();

    $inventories = Inventory::query()
        ->with([
            'productVariant:id,product_id,sku,color,size,price,is_active',
            'productVariant.product:id,name,slug,base_price',
        ])
        ->latest()
        ->get();

    $reviews = Review::query()
        ->with([
            'user:id,name',
            'product:id,name',
        ])
        ->latest()
        ->get();

    $users = User::latest()->get();

    $pdf = Pdf::loadView('reports.all-data-pdf', [
        'orders' => $orders,
        'products' => $products,
        'categories' => $categories,
        'inventories' => $inventories,
        'reviews' => $reviews,
        'users' => $users,
        'printedAt' => now()->format('d-m-Y H:i:s'),
    ])->setPaper('a4', 'landscape');

    return $pdf->download('laporan-semua-data-' . now()->format('Ymd-His') . '.pdf');
}
}