<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;

class OrderController extends Controller
{
    private function setupMidtrans()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    private function reduceStockForPaidOrder(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            $inventory = Inventory::where('product_variant_id', $item->product_variant_id)
                ->lockForUpdate()
                ->first();

            if (!$inventory) {
                throw new \Exception("Inventory tidak ditemukan untuk variant ID {$item->product_variant_id}");
            }

            $qty = (int) $item->qty;
            $stockOnHand = (int) $inventory->stock_on_hand;
            $stockReserved = (int) $inventory->stock_reserved;
            $stockAvailable = (int) $inventory->stock_available;

            if ($stockAvailable < $qty) {
                throw new \Exception("Stok tidak cukup untuk variant ID {$item->product_variant_id}");
            }

            $inventory->stock_on_hand = max($stockOnHand - $qty, 0);
            $inventory->stock_available = max(((int) $inventory->stock_on_hand) - $stockReserved, 0);
            $inventory->save();
        }
    }

    private function createBiteshipShipmentForPaidOrder(Order $order, BiteshipService $biteshipService): void
    {
        $order->loadMissing('items');

        if ($order->shipping_method !== 'jnt') {
            return;
        }

        if (!empty($order->biteship_order_id)) {
            return;
        }

        $biteshipOrder = $biteshipService->createJntOrder([
            'customer_name' => $order->customer_name,
            'phone' => $order->phone,
            'email' => $order->email,
            'address' => $order->address,
            'postal_code' => $order->postal_code,
            'shipping_service_code' => $order->shipping_service_code,
            'items' => $order->items->map(function ($item) {
                return [
                    'product_name' => $item->product_name,
                    'qty' => $item->qty,
                    'price' => $item->price,
                    'weight' => $item->weight ?? 500,
                ];
            })->toArray(),
        ]);

        $order->update([
            'biteship_order_id' => $biteshipOrder['id'] ?? null,
            'tracking_id' => $biteshipOrder['tracking_id'] ?? null,
            'waybill_id' => $biteshipOrder['waybill_id'] ?? null,
            'shipping_status' => $biteshipOrder['status'] ?? 'created',
        ]);
    }

    // GET /api/orders
    public function index()
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::with('items')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    // GET /api/orders/{id}
public function show($id)
{
    $userId = auth()->id();

    $order = Order::with([
        'items.review' => function ($query) use ($userId) {
            $query->where('user_id', $userId);
        }
    ])->findOrFail($id);

    $this->authorize('view', $order);

    $items = $order->items->map(function ($item) {
        $review = $item->review;

        return [
            'id' => $item->id,
            'order_id' => $item->order_id,
            'product_id' => $item->product_id,
            'product_variant_id' => $item->product_variant_id,
            'product_name' => $item->product_name,
            'sku' => $item->sku,
            'color' => $item->color,
            'size' => $item->size,
            'qty' => $item->qty,
            'price' => $item->price,
            'subtotal' => $item->subtotal,
            'review_id' => $review?->id,
            'is_reviewed' => (bool) $review,
            'review' => $review ? [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at,
                'updated_at' => $review->updated_at,
            ] : null,
        ];
    });

    $hasReview = $items->contains(function ($item) {
        return $item['is_reviewed'] === true;
    });

    \Log::debug('ORDER DETAIL FETCHED', [
        'order_id' => $order->id,
        'order_code' => $order->order_code,
        'payment_status' => $order->payment_status,
        'status' => $order->status,
        'has_review' => $hasReview,
    ]);

    return response()->json([
        'id' => $order->id,
        'user_id' => $order->user_id,
        'order_code' => $order->order_code,
        'customer_name' => $order->customer_name,
        'email' => $order->email,
        'phone' => $order->phone,
        'address' => $order->address,
        'city' => $order->city,
        'postal_code' => $order->postal_code,
        'shipping_method' => $order->shipping_method,
        'shipping_service_code' => $order->shipping_service_code,
        'shipping_label' => $order->shipping_label,
        'shipping_cost' => $order->shipping_cost,
        'payment_method' => $order->payment_method,
        'payment_status' => $order->payment_status,
        'payment_gateway' => $order->payment_gateway,
        'payment_reference' => $order->payment_reference,
        'paid_at' => $order->paid_at,
        'notes' => $order->notes,
        'subtotal' => $order->subtotal,
        'grand_total' => $order->grand_total,
        'status' => $order->status,
        'biteship_order_id' => $order->biteship_order_id,
        'tracking_id' => $order->tracking_id,
        'waybill_id' => $order->waybill_id,
        'shipping_status' => $order->shipping_status,
        'created_at' => $order->created_at,
        'updated_at' => $order->updated_at,
        'has_review' => $hasReview,
        'items' => $items->values(),
    ]);
}

    // GET /api/my-orders?email=xxx
    public function myOrders(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $orders = Order::with('items')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $orders
        ]);
    }
    
    public function confirmReceived($id)
    {
        $order = Order::findOrFail($id);

        $this->authorize('view', $order);

        if ($order->status === 'completed') {
            return response()->json([
                'message' => 'Pesanan ini sudah dikonfirmasi selesai.',
                'order' => $order->load('items'),
            ]);
        }

        $shippingDelivered =
            $order->shipping_status === 'delivered' || $order->status === 'shipped';

        if (!$shippingDelivered) {
            return response()->json([
                'message' => 'Pesanan belum dapat dikonfirmasi diterima.'
            ], 422);
        }

        $order->update([
            'status' => 'completed',
        ]);

        return response()->json([
            'message' => 'Pesanan berhasil dikonfirmasi diterima.',
            'order' => $order->fresh()->load('items'),
        ]);
    }
    // POST /api/orders
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string'],
            'city' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:10'],
            'shipping_method' => ['required', 'in:jnt,pickup'],
            'shipping_service_code' => ['nullable', 'string', 'max:100'],
            'shipping_label' => ['nullable', 'string', 'max:255'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ]);

        $shippingCost = (int) ($validated['shipping_cost'] ?? 0);

        if ($validated['shipping_method'] === 'pickup') {
            $shippingCost = 0;
        }

        if ($validated['shipping_method'] === 'jnt' && empty($validated['shipping_service_code'])) {
            return response()->json([
                'message' => 'Silakan pilih layanan pengiriman J&T terlebih dahulu.'
            ], 422);
        }

        $subtotal = 0;
        $itemDetails = [];

        foreach ($validated['items'] as $item) {
            $variant = ProductVariant::with(['product', 'inventory'])->findOrFail($item['product_variant_id']);

            $price = 0;

            if (!empty($variant->price) && (int) $variant->price > 0) {
                $price = (int) $variant->price;
            } elseif (!empty($variant->product?->base_price) && (int) $variant->product->base_price > 0) {
                $price = (int) $variant->product->base_price;
            }

            if ($price <= 0) {
                return response()->json([
                    'message' => 'Harga produk tidak valid.',
                    'debug' => [
                        'product_variant_id' => $variant->id,
                        'variant_price' => $variant->price ?? null,
                        'product_price' => $variant->product?->base_price ?? null,
                        'product_id' => $variant->product?->id ?? null,
                        'product_name' => $variant->product?->name ?? null,
                    ]
                ], 422);
            }

            if (!$variant->inventory) {
                return response()->json([
                    'message' => 'Data inventory tidak ditemukan untuk varian produk.',
                    'product_variant_id' => $variant->id,
                ], 422);
            }

            if ((int) $variant->inventory->stock_available < (int) $item['qty']) {
                return response()->json([
                    'message' => 'Stok produk tidak mencukupi.',
                    'product_variant_id' => $variant->id,
                    'available_stock' => (int) $variant->inventory->stock_available,
                    'requested_qty' => (int) $item['qty'],
                ], 422);
            }

            $qty = (int) $item['qty'];
            $itemSub = $price * $qty;
            $subtotal += $itemSub;

            $itemDetails[] = [
                'product_id' => $variant->product?->id,
                'product_variant_id' => $variant->id,
                'product_name' => $variant->product?->name ?? 'Produk',
                'sku' => $variant->sku ?? ('SKU-' . $variant->id),
                'color' => $variant->color,
                'size' => $variant->size,
                'qty' => $qty,
                'price' => $price,
                'subtotal' => $itemSub,
            ];
        }

        $grandTotal = $subtotal + $shippingCost;

        $order = Order::create([
            'user_id' => auth('sanctum')->check() ? auth('sanctum')->id() : null,
            'order_code' => 'ORD-' . strtoupper(Str::random(8)),
            'customer_name' => $validated['customer_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'postal_code' => $validated['postal_code'],
            'shipping_method' => $validated['shipping_method'],
            'shipping_service_code' => $validated['shipping_service_code'] ?? null,
            'shipping_label' => $validated['shipping_label'] ?? null,
            'payment_method' => $validated['payment_method'],
            'notes' => $validated['notes'] ?? null,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'grand_total' => $grandTotal,
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_gateway' => null,
            'payment_reference' => null,
            'paid_at' => null,
            'biteship_order_id' => null,
            'tracking_id' => null,
            'waybill_id' => null,
            'shipping_status' => null,
        ]);

        foreach ($itemDetails as $d) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $d['product_id'],
                'product_variant_id' => $d['product_variant_id'],
                'product_name' => $d['product_name'],
                'sku' => $d['sku'],
                'color' => $d['color'],
                'size' => $d['size'],
                'qty' => $d['qty'],
                'price' => $d['price'],
                'subtotal' => $d['subtotal'],
            ]);
        }

        return response()->json($order->load('items'), 201);
    }

    public function summary(Request $request)
    {
        $dateFrom = $request->input('date_from')
            ? \Carbon\Carbon::parse($request->input('date_from'))->startOfDay()
            : \Carbon\Carbon::now()->startOfMonth();

        $dateTo = $request->input('date_to')
            ? \Carbon\Carbon::parse($request->input('date_to'))->endOfDay()
            : \Carbon\Carbon::now()->endOfDay();

        $baseQuery = Order::whereBetween('created_at', [$dateFrom, $dateTo]);

        $totalOrders = (clone $baseQuery)->count();
        $pendingOrders = (clone $baseQuery)->where('status', 'pending')->count();
        $processingOrders = (clone $baseQuery)->where('status', 'processing')->count();
        $shippedOrders = (clone $baseQuery)->where('status', 'shipped')->count();
        $completedOrders = (clone $baseQuery)->where('status', 'completed')->count();
        $cancelledOrders = (clone $baseQuery)->whereIn('status', ['cancelled', 'canceled'])->count();

        $revenueQuery = (clone $baseQuery)
            ->whereIn('status', ['completed', 'complete', 'selesai', 'done'])
            ->whereIn('payment_status', ['paid', 'settlement', 'success', 'lunas', 'berhasil'])
            ->whereNotIn('status', ['cancelled', 'canceled', 'dibatalkan']);

        $totalRevenue = (clone $revenueQuery)->sum('grand_total');
        $validRevenueOrders = (clone $revenueQuery)->count();

        $recentOrders = (clone $baseQuery)
            ->latest()
            ->take(5)
            ->get([
                'id',
                'order_code',
                'customer_name',
                'email',
                'grand_total',
                'status',
                'payment_status',
                'created_at',
            ])
            ->map(function ($order) {
                $countsAsRevenue = in_array(strtolower((string) $order->status), ['completed', 'complete', 'selesai', 'done'])
                    && in_array(strtolower((string) $order->payment_status), ['paid', 'settlement', 'success', 'lunas', 'berhasil'])
                    && !in_array(strtolower((string) $order->status), ['cancelled', 'canceled', 'dibatalkan']);

                return [
                    'id' => $order->id,
                    'order_code' => $order->order_code,
                    'customer_name' => $order->customer_name,
                    'email' => $order->email,
                    'grand_total' => $order->grand_total,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'counts_as_revenue' => $countsAsRevenue,
                    'created_at' => $order->created_at,
                ];
            })
            ->values();

        $weeklyBuckets = [
            1 => 0,
            2 => 0,
            3 => 0,
            4 => 0,
            5 => 0,
        ];

        $orders = (clone $baseQuery)->get(['created_at']);

        foreach ($orders as $order) {
            $day = (int) $order->created_at->day;
            $weekOfMonth = (int) ceil($day / 7);
            $weekOfMonth = max(1, min(5, $weekOfMonth));
            $weeklyBuckets[$weekOfMonth]++;
        }

        $dailyOrders = collect($weeklyBuckets)
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

        return response()->json([
            'total_orders' => $totalOrders,
            'pending_orders' => $pendingOrders,
            'processing_orders' => $processingOrders,
            'shipped_orders' => $shippedOrders,
            'completed_orders' => $completedOrders,
            'cancelled_orders' => $cancelledOrders,
            'total_revenue' => $totalRevenue,
            'valid_revenue_orders' => $validRevenueOrders,
            'recent_orders' => $recentOrders,
            'daily_orders' => $dailyOrders,
            'period' => [
                'date_from' => $dateFrom->toDateString(),
                'date_to' => $dateTo->toDateString(),
            ],
            'revenue_rule' => 'Hanya order completed + paid yang dihitung sebagai revenue online',
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    // PUT /api/orders/{id}/status
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,completed,cancelled',
        ]);

        $order = Order::findOrFail($id);

        $this->authorize('updateStatus', $order);

        if (in_array($order->status, ['completed', 'cancelled'])) {
            return response()->json([
                'message' => 'Status final tidak dapat diubah.'
            ], 422);
        }

        $oldStatus = $order->status;
        $newStatus = $validated['status'];

        $order->status = $newStatus;
        $order->save();

        return response()->json([
            'message' => 'Status order berhasil diperbarui.',
            'previous_status' => $oldStatus,
            'current_status' => $order->status,
            'order' => $order->load('items'),
        ]);
    }
        // GET /api/orders/{id}/tracking
    public function tracking($id, BiteshipService $biteshipService)
    {
        $order = Order::findOrFail($id);

        $this->authorize('view', $order);

        if ($order->shipping_method !== 'jnt') {
            return response()->json([
                'message' => 'Order ini tidak menggunakan pengiriman kurir J&T.',
                'tracking' => null,
            ]);
        }

        try {
            $trackingData = null;

            if (!empty($order->biteship_order_id)) {
                $trackingData = $biteshipService->getOrderTracking($order->biteship_order_id);
            } elseif (!empty($order->waybill_id)) {
                $trackingData = $biteshipService->getPublicTracking($order->waybill_id, 'jnt');
            } else {
                return response()->json([
                    'message' => 'Data tracking belum tersedia.',
                    'tracking' => null,
                ]);
            }

            $courier = data_get($trackingData, 'courier', []);
            $destination = data_get($trackingData, 'destination', []);
            $history = data_get($trackingData, 'courier.history', data_get($trackingData, 'history', []));

            $currentStatus =
                data_get($trackingData, 'courier.status') ??
                data_get($trackingData, 'status') ??
                $order->shipping_status;

            $trackingId =
                data_get($courier, 'tracking_id') ??
                data_get($trackingData, 'tracking_id') ??
                $order->tracking_id;

            $waybillId =
                data_get($courier, 'waybill_id') ??
                data_get($trackingData, 'waybill_id') ??
                $order->waybill_id;

            $link =
                data_get($courier, 'link') ??
                data_get($trackingData, 'link');

            $driverName =
                data_get($courier, 'driver_name') ??
                data_get($trackingData, 'driver_name');

            $driverPhone =
                data_get($courier, 'driver_phone') ??
                data_get($trackingData, 'driver_phone');

            return response()->json([
                'tracking' => [
                    'order_id' => $order->id,
                    'order_code' => $order->order_code,
                    'shipping_method' => $order->shipping_method,
                    'shipping_status' => $currentStatus,
                    'tracking_id' => $trackingId,
                    'waybill_id' => $waybillId,
                    'courier_company' => data_get($courier, 'company', 'jnt'),
                    'courier_type' => data_get($courier, 'type'),
                    'courier_link' => $link,
                    'driver_name' => $driverName,
                    'driver_phone' => $driverPhone,
                    'destination' => [
                        'contact_name' => data_get($destination, 'contact_name', $order->customer_name),
                        'address' => data_get($destination, 'address', $order->address),
                    ],
                    'history' => collect($history)->map(function ($item) {
                        return [
                            'status' => $item['status'] ?? null,
                            'note' => $item['note'] ?? null,
                            'updated_at' => $item['updated_at'] ?? null,
                        ];
                    })->values(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('ORDER TRACKING ERROR', [
                'order_id' => $order->id,
                'biteship_order_id' => $order->biteship_order_id,
                'waybill_id' => $order->waybill_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal mengambil data tracking.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // POST /api/orders/{id}/payment-token
    public function createPaymentToken($id)
    {
        $order = Order::with('items')->findOrFail($id);

        if ($order->payment_status === 'paid') {
            return response()->json([
                'message' => 'Order ini sudah dibayar.'
            ], 422);
        }

        $this->setupMidtrans();

        $midtransItems = $order->items->map(function ($item) {
            return [
                'id' => 'ITEM-' . $item->id,
                'price' => (int) $item->price,
                'quantity' => (int) $item->qty,
                'name' => substr($item->product_name ?: 'Produk', 0, 50),
            ];
        })->toArray();

        if ((int) $order->shipping_cost > 0) {
            $midtransItems[] = [
                'id' => 'SHIPPING',
                'price' => (int) $order->shipping_cost,
                'quantity' => 1,
                'name' => substr($order->shipping_label ?: 'Ongkos Kirim', 0, 50),
            ];
        }

        $grossAmount = collect($midtransItems)->sum(function ($item) {
            return ((int) $item['price']) * ((int) $item['quantity']);
        });

        $params = [
            'transaction_details' => [
                'order_id' => (string) $order->order_code,
                'gross_amount' => (int) $grossAmount,
            ],
            'customer_details' => [
                'first_name' => $order->customer_name ?: 'Customer',
                'email' => $order->email,
                'phone' => $order->phone,
            ],
            'item_details' => $midtransItems,
        ];

        try {
            $snapToken = Snap::getSnapToken($params);

            $order->update([
                'payment_gateway' => 'midtrans',
                'grand_total' => $grossAmount,
            ]);

            return response()->json([
                'snap_token' => $snapToken,
                'client_key' => config('midtrans.client_key'),
                'order_id' => $order->id,
                'order_code' => $order->order_code,
            ]);
        } catch (\Exception $e) {
            \Log::error('MIDTRANS SNAP TOKEN ERROR', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal membuat token pembayaran.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function testMidtrans()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = false;
        Config::$isSanitized = true;
        Config::$is3ds = true;

        $params = [
            'transaction_details' => [
                'order_id' => 'TEST-' . time(),
                'gross_amount' => 10000,
            ],
            'customer_details' => [
                'first_name' => 'Test User',
                'email' => 'test@example.com',
                'phone' => '08123456789',
            ],
            'item_details' => [
                [
                    'id' => 'TEST-ITEM',
                    'price' => 10000,
                    'quantity' => 1,
                    'name' => 'Test Product',
                ]
            ],
        ];

        try {
            $snapToken = Snap::getSnapToken($params);

            return response()->json([
                'snap_token' => $snapToken
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'server_key_prefix' => substr((string) config('midtrans.server_key'), 0, 14),
                'client_key_prefix' => substr((string) config('midtrans.client_key'), 0, 14),
                'is_production' => config('midtrans.is_production'),
            ], 500);
        }
    }

    // POST /api/orders/midtrans-callback
    public function midtransCallback(Request $request, BiteshipService $biteshipService)
    {
        $payload = $request->all();

        \Log::info('MIDTRANS CALLBACK RECEIVED', $payload);

        $orderCode = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;
        $paymentType = $payload['payment_type'] ?? null;
        $transactionId = $payload['transaction_id'] ?? null;

        if (!$orderCode || !$transactionStatus || !$statusCode || !$grossAmount || !$signatureKey) {
            \Log::warning('MIDTRANS CALLBACK INVALID PAYLOAD', $payload);

            return response()->json([
                'message' => 'Payload tidak valid.'
            ], 400);
        }

        $order = Order::with('items')->where('order_code', $orderCode)->first();

        if (!$order) {
            \Log::warning('MIDTRANS CALLBACK ORDER NOT FOUND', [
                'order_code' => $orderCode,
            ]);

            return response()->json([
                'message' => 'Order tidak ditemukan.'
            ], 404);
        }

        $serverKey = config('midtrans.server_key');
        $localSignature = hash('sha512', $orderCode . $statusCode . $grossAmount . $serverKey);

        if ($signatureKey !== $localSignature) {
            \Log::warning('MIDTRANS CALLBACK INVALID SIGNATURE', [
                'order_code' => $orderCode,
                'received_signature' => $signatureKey,
                'expected_signature' => $localSignature,
                'status_code' => $statusCode,
                'gross_amount' => $grossAmount,
            ]);

            return response()->json([
                'message' => 'Signature tidak valid.'
            ], 403);
        }

        try {
            DB::transaction(function () use ($order, $transactionStatus, $fraudStatus, $paymentType, $transactionId, $biteshipService) {
                $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();

                if (!$lockedOrder) {
                    throw new \Exception('Order tidak ditemukan saat proses lock.');
                }

                if ($lockedOrder->payment_status === 'paid') {
                    \Log::info('MIDTRANS CALLBACK SKIPPED - ORDER ALREADY PAID', [
                        'order_code' => $lockedOrder->order_code,
                    ]);
                    return;
                }

                $updateData = [
                    'payment_gateway' => $paymentType ?: 'midtrans',
                ];

                if ($transactionId) {
                    $updateData['payment_reference'] = $transactionId;
                }

                if ($transactionStatus === 'capture') {
                    if ($fraudStatus === 'challenge') {
                        $updateData['payment_status'] = 'pending';
                        $updateData['status'] = 'pending';
                    } else {
                        $this->reduceStockForPaidOrder($lockedOrder);
                        $updateData['payment_status'] = 'paid';
                        $updateData['status'] = 'processing';
                        $updateData['paid_at'] = now();
                    }
                } elseif ($transactionStatus === 'settlement') {
                    $this->reduceStockForPaidOrder($lockedOrder);
                    $updateData['payment_status'] = 'paid';
                    $updateData['status'] = 'processing';
                    $updateData['paid_at'] = now();
                } elseif ($transactionStatus === 'pending') {
                    $updateData['payment_status'] = 'pending';
                } elseif (in_array($transactionStatus, ['deny', 'cancel'])) {
                    $updateData['payment_status'] = 'failed';
                    $updateData['status'] = 'cancelled';
                } elseif ($transactionStatus === 'expire') {
                    $updateData['payment_status'] = 'expired';
                    $updateData['status'] = 'cancelled';
                } elseif ($transactionStatus === 'refund') {
                    $updateData['payment_status'] = 'refund';
                    $updateData['status'] = 'cancelled';
                }

                $lockedOrder->update($updateData);

                if (
                    in_array($transactionStatus, ['capture', 'settlement']) &&
                    $lockedOrder->shipping_method === 'jnt' &&
                    empty($lockedOrder->biteship_order_id)
                ) {
                    $this->createBiteshipShipmentForPaidOrder($lockedOrder, $biteshipService);
                }

                \Log::info('MIDTRANS CALLBACK ORDER UPDATED', [
                    'order_code' => $lockedOrder->order_code,
                    'transaction_status' => $transactionStatus,
                    'fraud_status' => $fraudStatus,
                    'updated_fields' => $updateData,
                    'biteship_order_id' => $lockedOrder->fresh()->biteship_order_id,
                ]);
            });

            return response()->json([
                'message' => 'OK'
            ]);
        } catch (\Exception $e) {
            \Log::error('MIDTRANS CALLBACK PROCESS FAILED', [
                'order_code' => $orderCode,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Gagal memproses callback.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}