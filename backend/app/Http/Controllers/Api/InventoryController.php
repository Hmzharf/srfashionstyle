<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        $inventories = Inventory::with('productVariant.product')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($inventories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_variant_id' => ['required', 'exists:product_variants,id', 'unique:inventories,product_variant_id'],
            'stock_on_hand'      => ['required', 'integer', 'min:0'],
            'stock_reserved'     => ['nullable', 'integer', 'min:0'],
            'min_stock_alert'    => ['nullable', 'integer', 'min:0'],
        ]);

        $stockOnHand = (int) $validated['stock_on_hand'];
        $stockReserved = (int) ($validated['stock_reserved'] ?? 0);
        $stockAvailable = max($stockOnHand - $stockReserved, 0);

        $inventory = Inventory::create([
            'product_variant_id' => $validated['product_variant_id'],
            'stock_on_hand'      => $stockOnHand,
            'stock_reserved'     => $stockReserved,
            'stock_available'    => $stockAvailable,
            'min_stock_alert'    => (int) ($validated['min_stock_alert'] ?? 0),
        ]);

        return response()->json([
            'message' => 'Inventory berhasil ditambahkan',
            'data'    => $inventory->load('productVariant.product'),
        ], 201);
    }

    public function show(Inventory $inventory)
    {
        return response()->json($inventory->load('productVariant.product'));
    }

    public function update(Request $request, Inventory $inventory)
    {
        $validated = $request->validate([
            'product_variant_id' => ['required', 'exists:product_variants,id', 'unique:inventories,product_variant_id,' . $inventory->id],
            'stock_on_hand'      => ['required', 'integer', 'min:0'],
            'stock_reserved'     => ['nullable', 'integer', 'min:0'],
            'min_stock_alert'    => ['nullable', 'integer', 'min:0'],
        ]);

        $stockOnHand = (int) $validated['stock_on_hand'];
        $stockReserved = (int) ($validated['stock_reserved'] ?? 0);
        $stockAvailable = max($stockOnHand - $stockReserved, 0);

        $inventory->update([
            'product_variant_id' => $validated['product_variant_id'],
            'stock_on_hand'      => $stockOnHand,
            'stock_reserved'     => $stockReserved,
            'stock_available'    => $stockAvailable,
            'min_stock_alert'    => (int) ($validated['min_stock_alert'] ?? 0),
        ]);

        return response()->json([
            'message' => 'Inventory berhasil diupdate',
            'data'    => $inventory->load('productVariant.product'),
        ]);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();

        return response()->json([
            'message' => 'Inventory berhasil dihapus',
        ]);
    }
}