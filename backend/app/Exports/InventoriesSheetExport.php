<?php

namespace App\Exports;

use App\Models\Inventory;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class InventoriesSheetExport implements FromCollection, WithHeadings, ShouldAutoSize, WithTitle, WithMapping
{
    public function collection()
    {
        return Inventory::query()
            ->with([
                'productVariant:id,product_id,sku,color,size,price',
                'productVariant.product:id,name',
            ])
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Nama Produk',
            'SKU',
            'Warna',
            'Ukuran',
            'Harga Varian',
            'Stok',
            'Tanggal',
        ];
    }

    public function map($inventory): array
    {
        $variant = $inventory->productVariant;
        $product = $variant?->product;

        return [
            $inventory->id,
            $product?->name ?? '-',
            $variant?->sku ?? '-',
            $variant?->color ?? '-',
            $variant?->size ?? '-',
            $variant?->price ?? 0,
            $inventory->stock ?? 0,
            optional($inventory->created_at)->format('d-m-Y H:i:s'),
        ];
    }

    public function title(): string
    {
        return 'Inventories';
    }
}