<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippingController extends Controller
{
    public function rates(Request $request)
    {
        $request->validate([
            'destination_postal_code' => ['required', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'items.*.weight' => ['nullable', 'numeric', 'min:1'],
        ]);

        try {
            $destinationPostalCode = $request->destination_postal_code;
            $items = $request->items;

            $totalWeight = collect($items)->sum(function ($item) {
                return (int) ($item['weight'] ?? 500) * (int) ($item['qty'] ?? 1);
            });

            if ($totalWeight <= 0) {
                $totalWeight = 500;
            }

            $payload = [
                'origin_postal_code' => env('BITESHIP_ORIGIN_POSTAL_CODE'),
                'destination_postal_code' => $destinationPostalCode,
                'couriers' => 'jnt',
                'items' => collect($items)->map(function ($item) {
                    return [
                        'name' => $item['product_name'],
                        'description' => $item['product_name'],
                        'value' => (int) $item['price'],
                        'weight' => (int) ($item['weight'] ?? 500),
                        'quantity' => (int) $item['qty'],
                    ];
                })->values()->all(),
            ];

            $response = Http::withHeaders([
                'Authorization' => env('BITESHIP_API_KEY'),
                'Content-Type' => 'application/json',
            ])->post(env('BITESHIP_BASE_URL') . '/rates/couriers', $payload);

            if (!$response->successful()) {
                Log::error('BITESHIP_RATES_ERROR', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                    'payload' => $payload,
                ]);

                return response()->json([
                    'message' => 'Gagal mengambil data ongkir dari Biteship.',
                    'biteship_status' => $response->status(),
                    'biteship_response' => $response->json(),
                ], 422);
            }

            $result = $response->json();
            $pricing = $result['pricing'] ?? [];

            $options = collect($pricing)->map(function ($row) {
                return [
                    'courier_code' => $row['company'] ?? 'jnt',
                    'courier_name' => strtoupper($row['company'] ?? 'JNT'),
                    'service_code' => $row['type'] ?? '',
                    'service_name' => $row['type'] ?? '',
                    'price' => (int) ($row['price'] ?? 0),
                    'etd' => $row['estimated_days'] ?? '-',
                ];
            })->values();

            return response()->json([
                'message' => 'Berhasil mengambil ongkir.',
                'options' => $options,
            ]);
        } catch (\Throwable $e) {
            Log::error('SHIPPING_RATES_FATAL', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'message' => 'Terjadi error pada server saat mengambil ongkir.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}