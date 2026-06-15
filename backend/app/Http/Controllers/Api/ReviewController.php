<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function myReviews()
    {
        $reviews = Review::with([
            'product:id,name,slug',
            'order:id,order_code',
        ])
            ->where('user_id', auth()->id())
            ->latest()
            ->get();

        return response()->json([
            'reviews' => $reviews,
        ]);
    }

    public function myOrderReviews($id)
    {
        $order = Order::with('items')->findOrFail($id);

        if ((int) $order->user_id !== (int) auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $reviews = Review::where('order_id', $order->id)
            ->where('user_id', auth()->id())
            ->get();

        return response()->json([
            'reviews' => $reviews,
        ]);
    }

    public function store(Request $request, $id)
    {
        $order = Order::with('items')->findOrFail($id);

        if ((int) $order->user_id !== (int) auth()->id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($order->status !== 'completed') {
            return response()->json([
                'message' => 'Review hanya bisa diberikan setelah pesanan selesai.'
            ], 422);
        }

        $validated = $request->validate([
            'reviews' => ['required', 'array', 'min:1'],
            'reviews.*.order_item_id' => ['required', 'integer'],
            'reviews.*.rating' => ['required', 'integer', 'min:1', 'max:5'],
            'reviews.*.comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $orderItems = $order->items->keyBy('id');

        foreach ($validated['reviews'] as $index => $item) {
            $ownedItem = $orderItems->get($item['order_item_id']);

            if (!$ownedItem) {
                return response()->json([
                    'message' => 'Ada item review yang tidak valid untuk order ini.',
                    'error_index' => $index,
                    'order_item_id' => $item['order_item_id'],
                ], 422);
            }
        }

        $saved = DB::transaction(function () use ($validated, $orderItems, $order) {
            $results = [];

            foreach ($validated['reviews'] as $item) {
                $ownedItem = $orderItems->get($item['order_item_id']);

                $review = Review::updateOrCreate(
                    [
                        'order_item_id' => $ownedItem->id,
                        'user_id' => auth()->id(),
                    ],
                    [
                        'order_id' => $order->id,
                        'product_id' => $ownedItem->product_id,
                        'rating' => $item['rating'],
                        'comment' => $item['comment'] ?? null,
                    ]
                );

                $results[] = $review;
            }

            return $results;
        });

        return response()->json([
            'message' => 'Ulasan berhasil disimpan.',
            'reviews' => $saved,
        ], 200);
    }

    public function productReviews($productId)
    {
        $reviews = Review::with('user:id,name')
            ->where('product_id', $productId)
            ->latest()
            ->get();

        return response()->json([
            'reviews' => $reviews,
        ]);
    }
}