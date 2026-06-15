<?php
namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\{CashierStaff, Inventory, PosShift, PosTransaction, PosTransactionItem, ProductVariant};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function searchProducts(Request $request)
    {
        $q = $request->query('q', '');
        if (strlen($q) < 1) return response()->json(['success' => true, 'data' => []]);

        $variants = ProductVariant::with(['product', 'inventory'])
            ->whereHas('product', fn($query) => $query->where('is_active', true))
            ->where('is_active', true)
            ->where(function ($query) use ($q) {
                $query->where('sku', 'like', "%{$q}%")
                    ->orWhere('color', 'like', "%{$q}%")
                    ->orWhere('size', 'like', "%{$q}%")
                    ->orWhereHas('product', fn($q2) => $q2->where('name', 'like', "%{$q}%"));
            })
            ->get()
            ->map(fn($v) => [
                'product_variant_id' => $v->id,
                'product_id'         => $v->product_id,
                'product_name'       => $v->product->name ?? 'Produk',
                'sku'                => $v->sku,
                'color'              => $v->color,
                'size'               => $v->size,
                'price'              => (int)($v->price ?: ($v->product->base_price ?? 0)),
                'stock'              => $v->inventory ? (int)$v->inventory->stock_on_hand : 0,
                'featured_image'     => $v->product->featured_image ?? null,
            ]);

        return response()->json(['success' => true, 'data' => $variants]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pos_shift_id'     => 'required|integer|exists:pos_shifts,id',
            'cashier_staff_id' => 'required|integer|exists:cashier_staff,id',
            'payment_method'   => 'required|in:cash,qris,transfer_bca,card',
            'cash_received'    => 'nullable|numeric|min:0',
            'transfer_ref'     => 'nullable|string|max:100',
            'discount'         => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|integer|exists:product_variants,id',
            'items.*.qty'      => 'required|integer|min:1',
        ]);

        $shift = PosShift::where('id', $validated['pos_shift_id'])
            ->where('opened_by_user_id', $request->user()->id)
            ->where('status', 'open')->firstOrFail();

        $staff = CashierStaff::where('id', $validated['cashier_staff_id'])
            ->where('is_active', true)->firstOrFail();

        $itemDetails = [];
        $subtotal    = 0;

        foreach ($validated['items'] as $item) {
            $variant = ProductVariant::with(['product','inventory'])->findOrFail($item['product_variant_id']);
            $price   = (int)($variant->price ?: ($variant->product->base_price ?? 0));

            if ($price <= 0) {
                return response()->json(['success' => false, 'message' => "Harga produk {$variant->product->name} tidak valid."], 422);
            }

            $qty          = (int)$item['qty'];
            $itemSubtotal = $price * $qty;
            $subtotal    += $itemSubtotal;
            $itemDetails[] = compact('variant') + [
                'product_variant_id' => $variant->id,
                'product_name'       => $variant->product->name ?? 'Produk',
                'sku'                => $variant->sku,
                'color'              => $variant->color,
                'size'               => $variant->size,
                'price'              => $price,
                'qty'                => $qty,
                'subtotal'           => $itemSubtotal,
            ];
        }

        $discount   = (float)($validated['discount'] ?? 0);
        $grandTotal = max(0, $subtotal - $discount);

        if ($validated['payment_method'] === 'cash') {
            if (empty($validated['cash_received'])) {
                return response()->json(['success' => false, 'message' => 'Jumlah uang yang diterima wajib diisi.'], 422);
            }
            if ($validated['cash_received'] < $grandTotal) {
                return response()->json(['success' => false, 'message' => 'Uang yang diterima kurang dari total belanja.'], 422);
            }
        }

        if ($validated['payment_method'] === 'transfer_bca' && empty($validated['transfer_ref'])) {
            return response()->json(['success' => false, 'message' => 'Nomor referensi transfer BCA wajib diisi.'], 422);
        }

        try {
            $transaction = DB::transaction(function () use ($validated, $shift, $staff, $itemDetails, $subtotal, $discount, $grandTotal) {
                foreach ($itemDetails as $d) {
                    $inventory = Inventory::where('product_variant_id', $d['product_variant_id'])
                        ->lockForUpdate()->first();

                    if (!$inventory || $inventory->stock_on_hand < $d['qty']) {
                        throw new \Exception(
                            "Stok {$d['product_name']} ({$d['color']}/{$d['size']}) tidak mencukupi. " .
                            "Tersedia: " . ($inventory->stock_on_hand ?? 0) . ", Diminta: {$d['qty']}"
                        );
                    }

                    $inventory->update([
                        'stock_on_hand'   => $inventory->stock_on_hand - $d['qty'],
                        'stock_available' => max(0, $inventory->stock_on_hand - $d['qty'] - $inventory->stock_reserved),
                    ]);
                }

                $changeGiven = $validated['payment_method'] === 'cash' ? $validated['cash_received'] - $grandTotal : null;

                $tx = PosTransaction::create([
                    'pos_shift_id'     => $shift->id,
                    'cashier_staff_id' => $staff->id,
                    'transaction_code' => 'POS-' . strtoupper(Str::random(8)),
                    'subtotal'         => $subtotal,
                    'discount'         => $discount,
                    'grand_total'      => $grandTotal,
                    'payment_method'   => $validated['payment_method'],
                    'cash_received'    => $validated['cash_received'] ?? null,
                    'change_given'     => $changeGiven,
                    'transfer_ref'     => $validated['transfer_ref'] ?? null,
                    'status'           => 'completed',
                    'notes'            => $validated['notes'] ?? null,
                ]);

                foreach ($itemDetails as $d) {
                    PosTransactionItem::create([
                        'pos_transaction_id' => $tx->id,
                        'product_variant_id' => $d['product_variant_id'],
                        'product_name'       => $d['product_name'],
                        'sku'                => $d['sku'],
                        'color'              => $d['color'],
                        'size'               => $d['size'],
                        'price'              => $d['price'],
                        'qty'                => $d['qty'],
                        'subtotal'           => $d['subtotal'],
                    ]);
                }

                if ($validated['payment_method'] === 'cash') {
                    $shift->increment('total_cash_in', $grandTotal);
                } else {
                    $shift->increment('total_non_cash', $grandTotal);
                }

                return $tx;
            });

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil!',
                'data'    => [
                    'transaction'  => $transaction->load(['items', 'cashierStaff', 'shift']),
                    'cashier_name' => $staff->name,
                    'shift_code'   => $shift->shift_code,
                    'change_given' => $transaction->change_given,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

public function index(Request $request)
{
    $query = PosTransaction::with(['items', 'cashierStaff']);

    if ($request->filled('shift_id')) {
        $query->where('pos_shift_id', $request->shift_id);
    }

    if ($request->query('scope') === 'active_shift') {
        $activeShift = PosShift::where('opened_by_user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if ($activeShift) {
            $query->where('pos_shift_id', $activeShift->id);
        }
    }

    return response()->json([
        'success' => true,
        'data' => $query->orderBy('created_at', 'desc')->get(),
    ]);
}
    public function refund(Request $request, $id)
{
    // Ambil transaksi asli beserta item & relasi
    $original = PosTransaction::with(['items', 'shift', 'cashierStaff'])
        ->findOrFail($id);

    // Validasi input
    $validated = $request->validate([
        'pos_shift_id'     => 'required|integer|exists:pos_shifts,id',
        'cashier_staff_id' => 'required|integer|exists:cashier_staff,id',
        'restock_items'    => 'nullable|boolean', // default true
    ]);

    // Pastikan shift aktif milik user ini
    $shift = PosShift::where('id', $validated['pos_shift_id'])
        ->where('opened_by_user_id', $request->user()->id)
        ->where('status', 'open')
        ->firstOrFail();

    // Pastikan kasir aktif
    $staff = CashierStaff::where('id', $validated['cashier_staff_id'])
        ->where('is_active', true)
        ->firstOrFail();

    // Cegah double refund
    $existingRefund = PosTransaction::where('notes', 'REFUND_OF:' . $original->id)->exists();
    if ($existingRefund) {
        return response()->json([
            'success' => false,
            'message' => 'Transaksi ini sudah pernah direfund.',
        ], 422);
    }

    try {
        $refundTx = DB::transaction(function () use ($original, $shift, $staff, $validated) {

            $shouldRestock = array_key_exists('restock_items', $validated)
                ? (bool) $validated['restock_items']
                : true;

            // Kembalikan stok kalau diminta
            if ($shouldRestock) {
                foreach ($original->items as $item) {
                    if (!$item->product_variant_id) {
                        continue;
                    }

                    $inventory = Inventory::where('product_variant_id', $item->product_variant_id)
                        ->lockForUpdate()
                        ->first();

                    if ($inventory) {
                        $newOnHand = (int) $inventory->stock_on_hand + (int) $item->qty;
                        $inventory->update([
                            'stock_on_hand'   => $newOnHand,
                            'stock_available' => max(0, $newOnHand - (int) $inventory->stock_reserved),
                        ]);
                    }
                }
            }

            // Buat transaksi refund (nilai negatif, status 'refunded')
            $refundSubtotal   = -1 * (float) $original->subtotal;
            $refundDiscount   = -1 * (float) $original->discount;
            $refundGrandTotal = -1 * (float) $original->grand_total;

            $refund = PosTransaction::create([
                'pos_shift_id'     => $shift->id,
                'cashier_staff_id' => $staff->id,
                'transaction_code' => 'REF-' . $original->transaction_code,
                'subtotal'         => $refundSubtotal,
                'discount'         => $refundDiscount,
                'grand_total'      => $refundGrandTotal,
                'payment_method'   => $original->payment_method,
                'cash_received'    => null,
                'change_given'     => null,
                'transfer_ref'     => null,
                'status'           => 'refunded',
                'notes'            => 'REFUND_OF:' . $original->id,
            ]);

            foreach ($original->items as $it) {
                PosTransactionItem::create([
                    'pos_transaction_id' => $refund->id,
                    'product_variant_id' => $it->product_variant_id,
                    'product_name'       => $it->product_name,
                    'sku'                => $it->sku,
                    'color'              => $it->color,
                    'size'               => $it->size,
                    'price'              => -1 * (float) $it->price,
                    'qty'                => (int) $it->qty,
                    'subtotal'           => -1 * (float) $it->subtotal,
                ]);
            }

            // Atur uang keluar dari shift (kurangi total)
            if ($original->payment_method === 'cash') {
                $shift->decrement('total_cash_in', (float) $original->grand_total);
            } else {
                $shift->decrement('total_non_cash', (float) $original->grand_total);
            }

            return $refund->load(['items', 'cashierStaff', 'shift']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Refund berhasil dicatat.',
            'data'    => [
                'refund'   => $refundTx,
                'original' => $original,
            ],
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 422);
    }
}
    public function show($id)
    {
        $tx = PosTransaction::with(['items', 'cashierStaff', 'shift.cashierStaff'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $tx]);
    }
}