<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function index()
    {
        $variants = ProductVariant::with('product')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($variants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'color' => ['nullable', 'string', 'max:50'],
            'size' => ['nullable', 'string', 'max:20'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $variant = ProductVariant::create([
            'product_id' => $validated['product_id'],
            'sku' => $validated['sku'],
            'color' => $validated['color'] ?? null,
            'size' => $validated['size'] ?? null,
            'price' => $validated['price'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Varian produk berhasil ditambahkan',
            'data' => $variant->load('product'),
        ], 201);
    }

    public function show(ProductVariant $productVariant)
    {
        return response()->json($productVariant->load('product', 'inventory'));
    }

    public function update(Request $request, ProductVariant $productVariant)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku,' . $productVariant->id],
            'color' => ['nullable', 'string', 'max:50'],
            'size' => ['nullable', 'string', 'max:20'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $productVariant->update([
            'product_id' => $validated['product_id'],
            'sku' => $validated['sku'],
            'color' => $validated['color'] ?? null,
            'size' => $validated['size'] ?? null,
            'price' => $validated['price'],
            'is_active' => $validated['is_active'] ?? $productVariant->is_active,
        ]);

        return response()->json([
            'message' => 'Varian produk berhasil diupdate',
            'data' => $productVariant->load('product'),
        ]);
    }

    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return response()->json([
            'message' => 'Varian produk berhasil dihapus',
        ]);
    }
}