<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeaturedProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::with(['category', 'images'])
            ->latest()
            ->get();

        return response()->json($products);
    }

    public function toggle(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'featured' => 'required|boolean',
        ]);

        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $product->update([
            'is_featured' => $data['featured'],
        ]);

        $product->refresh();

        return response()->json([
            'message' => $data['featured']
                ? 'Produk ditampilkan di Best Product homepage.'
                : 'Produk dihapus dari Best Product homepage.',
            'data' => $product->load(['category', 'images']),
        ]);
    }
}
