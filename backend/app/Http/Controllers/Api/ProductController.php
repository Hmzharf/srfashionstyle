<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
        $products = Product::with(['category', 'images'])
            ->latest()
            ->get();

        return response()->json($products);
    }

    public function catalog()
    {
        $products = Product::with([
            'category',
            'images',
            'variants' => function ($query) {
                $query->where('is_active', 1)->with('inventory');
            }
        ])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('is_active', 1)
            ->latest()
            ->get();

        $onlineSalesBySku = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->whereIn('o.payment_status', ['paid', 'settlement', 'success', 'lunas', 'berhasil'])
            ->whereNotIn('o.status', ['cancelled', 'canceled', 'dibatalkan'])
            ->groupBy('oi.sku')
            ->selectRaw('oi.sku, SUM(oi.qty) as qty_online')
            ->pluck('qty_online', 'oi.sku');

        $products->transform(function ($product) use ($onlineSalesBySku) {
            $variants = collect($product->variants);

            $prices = $variants
                ->pluck('price')
                ->map(fn ($price) => (float) $price)
                ->filter(fn ($price) => $price > 0);

            if ($prices->isEmpty()) {
                $prices = collect([(float) $product->base_price]);
            }

            $minPrice = (float) $prices->min();
            $maxPrice = (float) $prices->max();

            $onlineSoldCount = $variants->sum(function ($variant) use ($onlineSalesBySku) {
                return (int) ($onlineSalesBySku[$variant->sku] ?? 0);
            });

            $averageRating = (float) ($product->reviews_avg_rating ?? 0);
            $reviewsCount = (int) ($product->reviews_count ?? 0);

            $product->online_sold_count = $onlineSoldCount;
            $product->min_price = $minPrice;
            $product->max_price = $maxPrice;
            $product->average_rating = round($averageRating, 1);
            $product->reviews_count = $reviewsCount;

            unset($product->reviews_avg_rating);

            return $product;
        });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp,gif|max:4096',
        ]);

        $product = DB::transaction(function () use ($request, $validated) {
            $product = Product::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'slug' => $this->generateUniqueSlug($validated['name']),
                'description' => $validated['description'] ?? null,
                'base_price' => $validated['base_price'],
                'featured_image' => null,
                'is_active' => $request->boolean('is_active', true),
            ]);

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');

                    $image = $product->images()->create([
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'sort_order' => $index,
                        'is_primary' => $index === 0,
                    ]);

                    if ($index === 0) {
                        $product->update([
                            'featured_image' => asset('storage/' . $image->file_path),
                        ]);
                    }
                }
            }

            return $product->load(['category', 'images']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product,
        ], 201);
    }

    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'images']),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp,gif|max:4096',
            'delete_image_ids' => 'nullable|array',
            'delete_image_ids.*' => 'integer|exists:product_images,id',
        ]);

        $updatedProduct = DB::transaction(function () use ($request, $validated, $product) {
            $product->update([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'slug' => $this->generateUniqueSlug($validated['name'], $product->id),
                'description' => $validated['description'] ?? null,
                'base_price' => $validated['base_price'],
                'is_active' => $request->boolean('is_active', $product->is_active),
            ]);

            if (!empty($validated['delete_image_ids'])) {
                $imagesToDelete = $product->images()
                    ->whereIn('id', $validated['delete_image_ids'])
                    ->get();

                foreach ($imagesToDelete as $image) {
                    Storage::disk('public')->delete($image->file_path);
                    $image->delete();
                }
            }

            if ($request->hasFile('images')) {
                $lastOrder = (int) ($product->images()->max('sort_order') ?? -1);

                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');

                    $product->images()->create([
                        'file_path' => $path,
                        'file_name' => $file->getClientOriginalName(),
                        'sort_order' => $lastOrder + $index + 1,
                        'is_primary' => false,
                    ]);
                }
            }

            $allImages = $product->images()->orderBy('sort_order')->get();

            if ($allImages->isNotEmpty()) {
                $primaryImageId = $allImages->first()->id;

                $product->images()->update(['is_primary' => false]);
                $product->images()->where('id', $primaryImageId)->update(['is_primary' => true]);

                $primaryImage = $product->images()->find($primaryImageId);

                $product->update([
                    'featured_image' => asset('storage/' . $primaryImage->file_path),
                ]);
            } else {
                $product->update([
                    'featured_image' => null,
                ]);
            }

            return $product->load(['category', 'images']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diupdate.',
            'data' => $updatedProduct,
        ]);
    }

    public function catalogShow(Product $product)
    {
        $product->load([
            'category',
            'images',
            'variants' => function ($query) {
                $query->where('is_active', 1)->with('inventory');
            }
        ]);

        if (!$product->is_active) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.'
            ], 404);
        }

        $onlineSalesBySku = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->whereIn('o.payment_status', ['paid', 'settlement', 'success', 'lunas', 'berhasil'])
            ->whereNotIn('o.status', ['cancelled', 'canceled', 'dibatalkan'])
            ->groupBy('oi.sku')
            ->selectRaw('oi.sku, SUM(oi.qty) as qty_online')
            ->pluck('qty_online', 'oi.sku');

        $variants = collect($product->variants);

        $prices = $variants
            ->pluck('price')
            ->map(fn ($price) => (float) $price)
            ->filter(fn ($price) => $price > 0);

        if ($prices->isEmpty()) {
            $prices = collect([(float) $product->base_price]);
        }

        $minPrice = (float) $prices->min();
        $maxPrice = (float) $prices->max();

        $onlineSoldCount = $variants->sum(function ($variant) use ($onlineSalesBySku) {
            return (int) ($onlineSalesBySku[$variant->sku] ?? 0);
        });

        $averageRating = (float) ($product->reviews()->avg('rating') ?? 0);
        $reviewsCount = (int) $product->reviews()->count();

        $product->online_sold_count = $onlineSoldCount;
        $product->min_price = $minPrice;
        $product->max_price = $maxPrice;
        $product->average_rating = round($averageRating, 1);
        $product->reviews_count = $reviewsCount;

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);

        foreach ($product->images as $image) {
            Storage::disk('public')->delete($image->file_path);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus',
        ]);
    }
}