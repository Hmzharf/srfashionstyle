<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    CashierStaff,
    Inventory,
    Order,
    PosShift,
    PosTransaction,
    PosTransactionItem
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PayAtStoreController extends Controller
{
    public function show($id)
    {
        $order = Order::with('items')
            ->where('id', $id)
            ->where('payment_method', 'pay_at_store')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    public function pendingList()
    {
        $orders = Order::query()
            ->where('payment_method', 'pay_at_store')
            ->where('payment_status', 'pending')
            ->where('status', '!=', 'cancelled')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

public function confirmPayment(Request $request, $id)
{
    $validated = $request->validate([
        'pos_payment_method' => 'required|in:cash,qris,transfer_bca',
        'transfer_ref'       => 'nullable|string|max:100',
        'cashier_staff_id'   => 'nullable|integer|exists:cashier_staff,id',
    ]);

    if ($validated['pos_payment_method'] === 'transfer_bca' && empty($validated['transfer_ref'])) {
        return response()->json([
            'success' => false,
            'message' => 'Nomor referensi transfer BCA wajib diisi.'
        ], 422);
    }

    try {
        $result = DB::transaction(function () use ($request, $id, $validated) {
            $order = Order::with('items')
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->payment_method !== 'pay_at_store') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order ini bukan order bayar di toko.'
                ], 422);
            }

            if ($order->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order ini sudah dibayar.'
                ], 422);
            }

            if ($order->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Order sudah dibatalkan.'
                ], 422);
            }

            $shift = PosShift::where('opened_by_user_id', $request->user()->id)
                ->where('status', 'open')
                ->lockForUpdate()
                ->first();

            if (!$shift) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada shift kasir yang sedang berjalan untuk user ini.'
                ], 422);
            }

            // Ambil cashier staff
            $staff = null;

            if (!empty($validated['cashier_staff_id'])) {
                $staff = CashierStaff::where('id', $validated['cashier_staff_id'])
                    ->where('is_active', true)
                    ->first();
            }

            // fallback: ambil staff dari shift kalau ada relasi cashier_staff_id
            if (!$staff && !empty($shift->cashier_staff_id)) {
                $staff = CashierStaff::where('id', $shift->cashier_staff_id)
                    ->where('is_active', true)
                    ->first();
            }

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kasir aktif tidak ditemukan. Pilih kasir terlebih dahulu.'
                ], 422);
            }

            $existingTx = PosTransaction::where('notes', 'PAY_AT_STORE_ORDER:' . $order->id)
                ->first();

            if ($existingTx) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pembayaran POS untuk order ini sudah pernah dicatat.'
                ], 422);
            }

            foreach ($order->items as $item) {
                if (!$item->product_variant_id) {
                    continue;
                }

                $inv = Inventory::where('product_variant_id', $item->product_variant_id)
                    ->lockForUpdate()
                    ->first();

                if (!$inv) {
                    throw new \Exception("Inventory varian tidak ditemukan untuk item {$item->id}.");
                }

                if ((int) $inv->stock_on_hand < (int) $item->qty) {
                    throw new \Exception("Stok tidak mencukupi untuk SKU {$item->sku}.");
                }

                $newStockOnHand = (int) $inv->stock_on_hand - (int) $item->qty;
                $newStockAvailable = max(0, $newStockOnHand - (int) $inv->stock_reserved);

                $inv->update([
                    'stock_on_hand'   => $newStockOnHand,
                    'stock_available' => $newStockAvailable,
                ]);
            }

            $subtotal   = (float) ($order->subtotal ?? 0);
            $discount   = (float) ($order->discount ?? 0);
            $grandTotal = (float) ($order->grand_total ?? ($subtotal - $discount));

            if ($grandTotal < 0) {
                $grandTotal = 0;
            }

            $tx = PosTransaction::create([
                'pos_shift_id'     => $shift->id,
                'cashier_staff_id' => $staff->id,
                'transaction_code' => 'POS-ORDER-' . strtoupper(Str::random(8)),
                'subtotal'         => $subtotal,
                'discount'         => $discount,
                'grand_total'      => $grandTotal,
                'payment_method'   => $validated['pos_payment_method'],
                'cash_received'    => $validated['pos_payment_method'] === 'cash' ? $grandTotal : null,
                'change_given'     => 0,
                'transfer_ref'     => $validated['transfer_ref'] ?? null,
                'status'           => 'completed',
                'notes'            => 'PAY_AT_STORE_ORDER:' . $order->id,
            ]);

            foreach ($order->items as $item) {
                PosTransactionItem::create([
                    'pos_transaction_id' => $tx->id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name'       => $item->product_name ?? 'Produk',
                    'sku'                => $item->sku,
                    'color'              => $item->color,
                    'size'               => $item->size,
                    'price'              => (float) $item->price,
                    'qty'                => (int) $item->qty,
                    'subtotal'           => (float) $item->subtotal,
                ]);
            }

            if ($validated['pos_payment_method'] === 'cash') {
                $shift->increment('total_cash_in', $grandTotal);
            } else {
                $shift->increment('total_non_cash', $grandTotal);
            }

            $order->update([
                'payment_status'     => 'paid',
                'status'             => 'processing',
                'paid_at'            => now(),
                'pos_payment_method' => $validated['pos_payment_method'],
                'pos_transfer_ref'   => $validated['transfer_ref'] ?? null,
                'payment_gateway'    => 'store',
            ]);

            return [
                'success' => true,
                'message' => 'Pembayaran di toko berhasil dikonfirmasi.',
                'data'    => $order->fresh()->load('items'),
            ];
        });

        if ($result instanceof \Illuminate\Http\JsonResponse) {
            return $result;
        }

        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 500);
    }
}
}