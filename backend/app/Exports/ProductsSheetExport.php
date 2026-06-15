<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class ProductsSheetExport implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle, WithMapping
{
    public function collection()
    {
        return Product::query()
            ->with('variants:id,product_id,sku,color,size,price')
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Produk',
            'Slug',
            'Harga Produk',
            'Jumlah Varian',
            'Detail Varian',
            'Tanggal',
        ];
    }

    public function map($product): array
    {
        $variantText = $product->variants->map(function ($variant) {
            return
                'SKU: ' . ($variant->sku ?? '-') .
                ', Warna: ' . ($variant->color ?? '-') .
                ', Ukuran: ' . ($variant->size ?? '-') .
                ', Harga: Rp ' . number_format($variant->price ?? 0, 0, ',', '.');
        })->implode(' | ');

        return [
            $product->id,
            $product->name ?? '-',
            $product->slug ?? '-',
            $product->price ?? 0,
            $product->variants->count(),
            $variantText ?: '-',
            optional($product->created_at)->format('d-m-Y H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Products';
    }
}