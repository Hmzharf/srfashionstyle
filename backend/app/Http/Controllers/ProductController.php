<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (
            Product::where('slug', $slug)
                ->when($ignoreId, function ($query) use ($ignoreId) {
                    $query->where('id', '!=', $ignoreId);
                })
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    public function index()
    {
        $products = Product::with('category')->latest()->get();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'   => ['required', 'exists:categories,id'],
            'name'          => ['required', 'string', 'max:150'],
            'description'   => ['nullable', 'string'],
            'base_price'    => ['required', 'numeric', 'min:0'],
            'featured_image'=> ['nullable', 'string', 'max:255'],
            'is_active'     => ['nullable', 'boolean'],
        ]);

        $product = Product::create([
            'category_id'    => $validated['category_id'],
            'name'           => $validated['name'],
            'slug'           => $this->generateUniqueSlug($validated['name']),
            'description'    => $validated['description'] ?? null,
            'base_price'     => $validated['base_price'],
            'featured_image' => $validated['featured_image'] ?? null,
            'is_active'      => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Produk berhasil ditambahkan',
            'data' => $product->load('category'),
        ], 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('category'));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id'   => ['required', 'exists:categories,id'],
            'name'          => ['required', 'string', 'max:150'],
            'description'   => ['nullable', 'string'],
            'base_price'    => ['required', 'numeric', 'min:0'],
            'featured_image'=> ['nullable', 'string', 'max:255'],
            'is_active'     => ['nullable', 'boolean'],
        ]);

        $product->update([
            'category_id'    => $validated['category_id'],
            'name'           => $validated['name'],
            'slug'           => $this->generateUniqueSlug($validated['name'], $product->id),
            'description'    => $validated['description'] ?? null,
            'base_price'     => $validated['base_price'],
            'featured_image' => $validated['featured_image'] ?? null,
            'is_active'      => $validated['is_active'] ?? $product->is_active,
        ]);

        return response()->json([
            'message' => 'Produk berhasil diupdate',
            'data' => $product->load('category'),
        ]);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus',
        ]);
    }
}