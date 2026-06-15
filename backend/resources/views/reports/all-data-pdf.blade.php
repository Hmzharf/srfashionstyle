<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Laporan Semua Data</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #222;
        }

        h1 {
            margin: 0 0 10px;
            font-size: 20px;
        }

        h2 {
            margin: 22px 0 8px;
            font-size: 15px;
            page-break-after: avoid;
        }

        .meta {
            margin-bottom: 16px;
            font-size: 11px;
            color: #555;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        th, td {
            border: 1px solid #cfcfcf;
            padding: 5px 7px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #f2f2f2;
        }

        .text-right {
            text-align: right;
        }

        .small {
            font-size: 10px;
        }

        .variant-line {
            margin-bottom: 4px;
        }
    </style>
</head>
<body>
    <h1>Laporan Semua Data</h1>

    <div class="meta">
        <div>Dicetak pada: {{ $printedAt }}</div>
        <div>
            Orders: {{ $orders->count() }},
            Products: {{ $products->count() }},
            Categories: {{ $categories->count() }},
            Inventories: {{ $inventories->count() }},
            Reviews: {{ $reviews->count() }},
            Users: {{ $users->count() }}
        </div>
    </div>

    <h2>Orders</h2>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Kode</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Pembayaran</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($orders as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->order_code ?? '-' }}</td>
                    <td>{{ $item->customer_name ?? '-' }}</td>
                    <td>{{ $item->status ?? '-' }}</td>
                    <td>{{ $item->payment_status ?? '-' }}</td>
                    <td class="text-right">Rp {{ number_format($item->grand_total ?? 0, 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Products</h2>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Slug</th>
                <th>Harga Produk</th>
                <th>Varian & Stok</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($products as $index => $item)
                @php
                    $variantPrices = $item->variants
                        ? $item->variants->pluck('price')->filter(fn ($v) => !is_null($v) && $v > 0)
                        : collect();

                    $minPrice = $variantPrices->count() ? $variantPrices->min() : null;
                    $maxPrice = $variantPrices->count() ? $variantPrices->max() : null;
                    $basePrice = (!is_null($item->base_price) && $item->base_price > 0) ? $item->base_price : null;
                @endphp
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->name ?? '-' }}</td>
                    <td>{{ $item->slug ?? '-' }}</td>
                    <td class="text-right">
                        @if(!is_null($basePrice))
                            Rp {{ number_format($basePrice, 0, ',', '.') }}
                        @elseif(!is_null($minPrice) && !is_null($maxPrice))
                            @if($minPrice == $maxPrice)
                                Rp {{ number_format($minPrice, 0, ',', '.') }}
                            @else
                                Rp {{ number_format($minPrice, 0, ',', '.') }} - Rp {{ number_format($maxPrice, 0, ',', '.') }}
                            @endif
                        @else
                            -
                        @endif
                    </td>
                    <td class="small">
                        @if($item->variants && $item->variants->count())
                            @foreach($item->variants as $variant)
                                @php
                                    $inventory = $variant->inventory;
                                    $availableStock = $inventory->stock_available ?? null;
                                    $onHandStock = $inventory->stock_on_hand ?? null;
                                    $reservedStock = $inventory->stock_reserved ?? 0;
                                    $finalStock = !is_null($availableStock) ? $availableStock : ($onHandStock ?? 0);
                                @endphp
                                <div class="variant-line">
                                    SKU: {{ $variant->sku ?? '-' }},
                                    Warna: {{ $variant->color ?? '-' }},
                                    Ukuran: {{ $variant->size ?? '-' }},
                                    Harga: Rp {{ number_format($variant->price ?? 0, 0, ',', '.') }},
                                    Stok Tersedia: {{ $finalStock }},
                                    Stok Ditahan: {{ $reservedStock }}
                                </div>
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Categories</h2>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Slug</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($categories as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->name ?? '-' }}</td>
                    <td>{{ $item->slug ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Inventories</h2>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>SKU</th>
                <th>Warna</th>
                <th>Ukuran</th>
                <th>Harga Varian</th>
                <th>Stok Tersedia</th>
                <th>Stok Ditahan</th>
                <th>Stok Fisik</th>
                <th>Min Alert</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($inventories as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ optional(optional($item->productVariant)->product)->name ?? '-' }}</td>
                    <td>{{ optional($item->productVariant)->sku ?? '-' }}</td>
                    <td>{{ optional($item->productVariant)->color ?? '-' }}</td>
                    <td>{{ optional($item->productVariant)->size ?? '-' }}</td>
                    <td class="text-right">Rp {{ number_format(optional($item->productVariant)->price ?? 0, 0, ',', '.') }}</td>
                    <td>{{ $item->stock_available ?? 0 }}</td>
                    <td>{{ $item->stock_reserved ?? 0 }}</td>
                    <td>{{ $item->stock_on_hand ?? 0 }}</td>
                    <td>{{ $item->min_stock_alert ?? 0 }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="10">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Reviews</h2>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama User</th>
                <th>Nama Produk</th>
                <th>Rating</th>
                <th>Komentar</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($reviews as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ optional($item->user)->name ?? '-' }}</td>
                    <td>{{ optional($item->product)->name ?? '-' }}</td>
                    <td>{{ $item->rating ?? 0 }}</td>
                    <td>{{ $item->comment ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Users</h2>
    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($users as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->name ?? '-' }}</td>
                    <td>{{ $item->email ?? '-' }}</td>
                    <td>{{ $item->role ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>