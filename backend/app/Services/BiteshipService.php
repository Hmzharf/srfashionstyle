<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class BiteshipService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.biteship.base_url');
        $this->apiKey = config('services.biteship.api_key');
    }

    protected function client()
    {
        return Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->baseUrl($this->baseUrl);
    }

    public function getJntRates(string $destinationPostalCode, array $items): array
    {
        $payload = [
            'origin_postal_code' => config('services.biteship.origin_postal_code'),
            'destination_postal_code' => $destinationPostalCode,
            'couriers' => 'jnt',
            'items' => collect($items)->map(function ($item) {
                return [
                    'name' => $item['product_name'] ?? 'Produk',
                    'description' => $item['product_name'] ?? 'Produk',
                    'value' => (int) ($item['price'] ?? 0),
                    'quantity' => (int) ($item['qty'] ?? 1),
                    'weight' => (int) ($item['weight'] ?? 500),
                ];
            })->values()->toArray(),
        ];

        $response = $this->client()->post('/rates/couriers', $payload);

        if (!$response->successful()) {
            throw new \Exception($response->body());
        }

        $pricing = $response->json('pricing') ?? [];

        return collect($pricing)->map(function ($rate) {
            return [
                'courier_code' => $rate['courier_code'] ?? 'jnt',
                'courier_name' => $rate['courier_name'] ?? 'J&T',
                'service_code' => $rate['courier_service_code'] ?? '',
                'service_name' => $rate['courier_service_name'] ?? '',
                'price' => $rate['price'] ?? 0,
                'etd' => $rate['duration'] ?? '',
            ];
        })->values()->toArray();
    }

    public function createJntOrder(array $orderData): array
    {
        $payload = [
            'shipper_contact_name' => config('services.biteship.store_name'),
            'shipper_contact_phone' => config('services.biteship.store_phone'),
            'shipper_contact_email' => config('services.biteship.store_email'),
            'shipper_organization' => config('services.biteship.store_name'),

            'origin_contact_name' => config('services.biteship.store_name'),
            'origin_contact_phone' => config('services.biteship.store_phone'),
            'origin_address' => config('services.biteship.store_address'),
            'origin_postal_code' => config('services.biteship.origin_postal_code'),

            'destination_contact_name' => $orderData['customer_name'],
            'destination_contact_phone' => $orderData['phone'],
            'destination_contact_email' => $orderData['email'],
            'destination_address' => $orderData['address'],
            'destination_postal_code' => $orderData['postal_code'],

            'courier_company' => 'jnt',
            'courier_type' => $orderData['shipping_service_code'],
            'delivery_type' => 'now',

            'items' => collect($orderData['items'])->map(function ($item) {
                return [
                    'name' => $item['product_name'] ?? 'Produk',
                    'description' => $item['product_name'] ?? 'Produk',
                    'value' => (int) ($item['price'] ?? 0),
                    'quantity' => (int) ($item['qty'] ?? 1),
                    'weight' => (int) ($item['weight'] ?? 500),
                ];
            })->values()->toArray(),
        ];

        $response = $this->client()->post('/orders', $payload);

        if (!$response->successful()) {
            throw new \Exception($response->body());
        }

        return $response->json();
    }
    public function getOrderTracking(string $biteshipOrderId): array
    {
        $response = $this->client()->get("/orders/{$biteshipOrderId}");

        if (!$response->successful()) {
            throw new \Exception($response->body());
        }

        return $response->json();
    }

    public function getPublicTracking(string $waybillId, string $courierCode = 'jnt'): array
    {
        $response = $this->client()->get("/trackings/{$waybillId}/couriers/{$courierCode}");

        if (!$response->successful()) {
            throw new \Exception($response->body());
        }

        return $response->json();
    }
}